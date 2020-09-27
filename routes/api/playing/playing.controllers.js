//게임 중 지속적으로 데이터를 받음(now_time) → 저장돼있는 now_time과 비교해서 어이없는 데이터가 들어오면 
//유저 모든 db terminate화, 밴처리를 한다. → 그리고 클리어시에도 비교

var User = require("../../../models/user");
var Playing = require("../../../models/playing");
var Banned = require("../../../models/banned");
var {ban,delete_playing} = require("../middleware/function");

var {logger,playing,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');







//플레이 중 데이터 변조 체크
exports.check_modulation = async (req, res, next) => {
    const {id, now_time,start} = req.body //gametype에 따라 구분해야한다면 나중에 수정
    try{
        //만약에 플레이 시작하는 거면
        if(start){
            console.log("start 진입했어요");
            var user_playing = new Playing({
                userid: id,
                now_time: now_time,

            });
            //playing모델에 id,now_time 필드 등록
            await user_playing.save({ new: true });
            res.status(200).send("플레이 시작")
        }else{
            console.log("이전 기록과 비교를 해야합니다.")
            //id로 해당 유저 찾고
            let check = await Playing.findOne({userid:id});

            //그리고 이전 now_time이랑 비교
            let check_result = (check.now_time >= now_time) ? true : false;
            console.log(`저장된 기록: ${check.now_time} vs 현재 기록 : ${now_time}`);
            console.log(check_result);
            //만약 저장된 now_time보다 적은 time이면 (사기 기록이면)
            if(check_result){
                console.log("이 사람 사기 친다")
                
                //밴 , playing 모델에서 필드 삭제

                ban(id);
                delete_playing(id);
                

                userinfo.info(`유저 ${id} 밴 됨.`);
                logger.info(`유저 ${id} 밴 됨.`);
                res.status(200).json({"previous_time":check.now_time,"now_time":now_time,"banned":true,"userid":id});
                
                
            }else{
                console.log("유효한 기록이므로 저장합니다.")
                //아니면 now_time갱신
                await Playing.findOneAndUpdate(
                    {userid:id},
                    {now_time:now_time},
                    { new: true }
                ).setOptions({ runValidators: true });

                res.status(200).json({"now_time":now_time,"validation":"true"});
            }

        }
        
    }catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`playing 에러: ${id} [${err}]`);
        userinfo.error(`playing 에러: ${id} [${err}]`);
        upload(err,`유저 : ${id} 밴 처리 실패 or playing컨트롤러 에러| /playing`);
        next(err);
    }
}