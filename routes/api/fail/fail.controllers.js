var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");

var {logger,play} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');


//middleware
var {get_userid} = require("../middleware/function");

//////////////////verify///////////////////////
require('dotenv').config();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


async function verify(token,email) {
    try{
        var TokenObj ={}
        
        //email이 존재하지 않는 경우
        if(!email){
            TokenObj.verified = false;
            TokenObj.error = 'no email';
            logger.error(`no email`);
            upload('','fail | token',`no email`);
            return TokenObj;
        }else{
            var id = await get_userid(email);
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        

        var check_validation = (payload.aud === process.env.CLIENT_ID) ? true : false;

        //토큰 유효성 체크 통과
        if(check_validation && payload){
            console.log("aud일치 유효한 토큰입니다.")
            TokenObj.payload = payload;
            TokenObj.verified = true;
            
            return TokenObj;

        }else if(check_validation){
            console.log("payload가 없습니다.")
            TokenObj.verified = false;
            TokenObj.error = 'no payload';
            logger.error(`no payload error`);
            upload(email,'fail | token',`accessToken error`);
            return TokenObj;
        }else{ 
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email,'fail | token',`accessToken error`);
            return TokenObj;
        }

    }catch(err){
        console.log("err났습니다.")
        let check_expiredtoken = /Token used too late/;
        
        let error = err.toString();
        

        let check = error.match(check_expiredtoken);
        
        //토큰 만료 에러
        if(check){
            TokenObj.error = 'Token Expired';
            TokenObj.verified = false; 
        //토큰 만료 에러 외
        }else{
            TokenObj.error = err;
            TokenObj.verified = false; 
        }
        
        logger.error(`${id} - ${email} : ${err}`);
        upload(email,`fail | token`,err);
        return TokenObj;
    }
}


////////////////////////////////////////////




//죽으면 death 갱신
exports.death_up = async (req, res, next) => {
    const {email, stage_name, gametype, get_crystal, token} = req.body

    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            //get userid
            let userid = await get_userid(email);

            //User 모델의 death, playtime 갱신
            let user = await User.findOneAndUpdate(
                { email: email },
                { $inc:{ crystal:get_crystal,total_death:1}},
                { new: true }
            ).setOptions({ runValidators: true }); 
    
    
    
    
            //user_Stage 모델의 N_death, H_death 갱신
            let user_stage = await User_stage.findOne( { userid: userid});
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
                var userindex = stage.Normal.findIndex((s) => s.userid === userid);
                
                stage.Normal[userindex].death++;  //Normal death 갱신
                await stage.save({ new: true });
                res.status(200).json({"total_death":user.total_death,"stage_total_death":stage.total_death,"Normal_death":stage.Normal[userindex].death});
                logger.info(`${userid} 가 노말 ${stage_name} 실패.`);
                play.info(`${userid} 가 노말 ${stage_name} 실패.`);
            }else{ //Hard
                var userindex = stage.Hard.findIndex((s) => s.userid === userid);
    
                stage.Hard[userindex].death++;
                await stage.save({ new: true }); //Hard death 갱신
                res.status(200).json({"total_death":user.total_death,"stage_total_death":stage.total_death,"Hard_death":stage.Hard[userindex].death});
                logger.info(`${userid} 가 하드 ${stage_name} 실패.`);
                play.info(`${userid} 가 하드 ${stage_name} 실패.`);
            }       
        }catch (err) {
            res.status(500).json({ error: "database failure" });
            logger.error(`스테이지 fail 에러: ${userid} [${err}]`);
            play.error(`스테이지 fail 에러: ${userid} [${err}]`);
            upload(email,`fail`,err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }
}


