const jwt = require('jsonwebtoken');

var {get_userid} = require("../middleware/function");

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


//fotbb API서버의 토큰 발급
exports.auth = async (req, res, next) => {
    const {email ,token} = req.body;

    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            const token = jwt.sign({
                email: email,
            },process.env.FOTBB_JWT_SECRET_KEY,{
                expiresIn:'31d',
                issuer:'Fotbb',
            });
            res.status(200).json({status:"success",message:'Fotbb토큰 발급완료',token});
        }catch (err) {
            let id = await get_userid(email);
            res.status(500).json({ error: `${err}`,status:'fail',message:'Fotbb토큰 발급실패' });
            logger.error(`토큰 획득 에러: ${email} : ${id} [${err}]`);
            userinfo.error(`토큰 획득 에러: ${email} : ${id} [${err}]`);
            upload(email,'token',err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "gpgs token error" ,"error":`${verify_result.error}`});
    }
}