//게임 중 지속적으로 데이터를 받음(now_time) → 저장돼있는 now_time과 비교해서 어이없는 데이터가 들어오면 
//유저 모든 db terminate화, 밴처리를 한다. → 그리고 클리어시에도 비교


var Playing = require("../../../models/playing");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");
var User = require("../../../models/user");

var {ban,delete_playing,get_userid,get_now} = require("../middleware/function");

var {logger,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');


            
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
            upload('','badge | token',`no email`);
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
            upload(email,'badge | token',`accessToken error`);
            return TokenObj;
        }else{ 
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email,'badge | token',`accessToken error`);
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
        upload(email,`badge | token`,err);
        return TokenObj;
    }
}


//뱃지 획득
exports.badge = async (req, res, next) => {
    const {email, badge ,token} = req.body;

    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            if(!badge){
                res.status(200).json({error:"no badge",status:'fail'});
            }else{
                let user = await User.findOneAndUpdate(
                    { email: email },
                    { $addToSet: { badge: badge }, },
                    { new: true, upsert: true },
                ).setOptions({ runValidators: true });
                res.status(200).json({user:user,status:'success'});
            }
        }catch (err) {
            let id = await get_userid(email);
            res.status(500).json({ error: `${err}` });
            logger.error(`유저 뱃지획득 에러: ${email} : ${id} [${err}]`);
            userinfo.error(`유저 뱃지획득 에러: ${email} : ${id} [${err}]`);
            upload(email,'badge',err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }
}