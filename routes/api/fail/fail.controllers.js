var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");

var {logger,play} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');

//죽으면 death 갱신
exports.death_up = async (req, res, next) => {
    const {id, playtime, stage_name, gametype} = req.body
    try{
        //User 모델의 death, playtime 갱신
        let user = await User.findOneAndUpdate(
            { googleid: id },
            { $inc:{ playtime:playtime,total_death:1}},
            { new: true }
        ).setOptions({ runValidators: true }); 




        //user_Stage 모델의 N_death, H_death 갱신
        let user_stage = await User_stage.findOne( { userid: id});
        let stageindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
        if(gametype==="Normal"){ //Normal
            user_stage.stage[stageindex].N_death++;
            await user_stage.save({ new: true }); //Normal death 갱신
            
        }else{ //Hard
            user_stage.stage[stageindex].H_death++;
            await user_stage.save({ new: true }); //Hard death 갱신
        }
       



        //Stage 모델의 스테이지별 death 갱신
        let stage = await Stage.findOne({stage_name: stage_name});

        //total_death갱신
        stage.total_death++;

        if(gametype==="Normal"){ //Normal
            var userindex = stage.Normal.findIndex((s) => s.userid === id);
            
            stage.Normal[userindex].death++;  //Normal death 갱신
            await stage.save({ new: true });
            logger.info(`${id} 가 노말 ${stage_name} 실패.`);
            play.info(`${id} 가 노말 ${stage_name} 실패.`);
            res.status(200).json({"total_death":user.total_death,"stage_total_death":stage.total_death,"Normal_death":stage.Normal[userindex].death});
        }else{ //Hard
            var userindex = stage.Hard.findIndex((s) => s.userid === id);

            stage.Hard[userindex].death++;
            await stage.save({ new: true }); //Hard death 갱신
            logger.info(`${id} 가 하드 ${stage_name} 실패.`);
            play.info(`${id} 가 하드 ${stage_name} 실패.`);
            res.status(200).json({"total_death":user.total_death,"stage_total_death":stage.total_death,"Hard_death":stage.Hard[userindex].death});
        }       
    }catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`스테이지 fail 에러: ${id} [${err}]`);
        play.error(`스테이지 fail 에러: ${id} [${err}]`);
        upload(err,`${stage_name}| /fail`);
        next(err);
    }
}