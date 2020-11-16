const jwt = require('jsonwebtoken');

const jwt_decode = require('jwt-decode');

var Rt = require("../../../models/rt");
var Rt_blacklist = require("../../../models/rt_blacklist");

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
    const {email ,gpgsToken} = req.body;
    var verify_result = await verify(gpgsToken,email)
    if(verify_result.verified){
        try{
            /*
                        토큰생성
            */
            const token = jwt.sign({
                email: email,
            },process.env.FOTBB_JWT_SECRET_KEY,{
                //expiresIn:'1h',
                expiresIn:'30s',
                issuer:'Fotbb',
            });
            const refreshToken = jwt.sign({
                email: email,
            },process.env.FOTBB_JWT_SECRET_KEY,{
                expiresIn:'1m',
                //expiresIn:'10m',
                issuer:'Fotbb',
            });



            /* 
                        리프레시토큰 관련 처리
            */
            if(await Rt.exists({email:email})){
                console.log("블랙리스트 체킹");
                await check_expired(email);
                

                //이미 사용했던 refreshToken은 블랙리스트로 이동
                console.log("사용했던 리프레시토큰 블랙리스트로 이동");
                await set_blacklist(email);
                
                console.log("Rt DB에 저장돼있는 리프레시토큰 갱신")
                await Rt.findOneAndUpdate(
                    {email:email},
                    {rt:refreshToken},
                    { new: true, upsert: true },
                ).setOptions({ runValidators: true });
                
            }else{
                console.log("로그인 하고 Rt DB에 신규 생성");
                
                let rt_user = new Rt({
                    email:email,
                    rt:refreshToken,
                });
                await rt_user.save();
            }
            
            res.status(200).json({status:"success",message:'Fotbb토큰 발급완료',token,refreshToken});
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


//로그아웃 시 리프레시토큰 블랙리스트에 넣기
exports.logout = async (req, res, next) => {
    const {email} = req.body;
    try{
        //만약 email이 rt DB에 존재하면 블랙리스트에 넣기
        if(await Rt.exists({email:email})){
            console.log("사용한 토큰 블랙리스트로 이동");
            //rt에 있는 리프레시토큰을 얻고
            //얻은 리프레시 토큰을 rt_blacklist DB에 exp를 걸어서 넣는다.
            await set_blacklist(email);

            //블랙리스트에 넣고 삭제를했기 때문에 다시 사용불가하니 삭제 해도 무방
            console.log('Rt DB에서 삭제해도 무방합니다.');
            await Rt.findOneAndRemove({email:email});
        }

        
            //지금 왕벌의비행 앱에서 사용중이었던 리프레시토큰
        //만약 블랙리스트의 exp_ms보다 now_ms가 오래됐으면 (만료됐다는 뜻)
        //블랙리스트에서 제거해도 무방
        await check_expired(email);
        
        
        res.status(200).json();
    }catch (err) {
        let id = await get_userid(email);
        res.status(500).json({ error: `${err}`,status:'fail',message:'로그아웃에러' });
        logger.error(`로그아웃 에러: ${email} : ${id} [${err}]`);
        userinfo.error(`로그아웃 에러: ${email} : ${id} [${err}]`);
        upload(email,'token',err);
        next(err);
    }

}



async function set_blacklist(email){
    //만약 email이 rt DB에 존재하면
    //rt에 있는 리프레시토큰을 얻고
    let refreshToken = await Rt.findOne({email:email});

    //저장됐던 토큰의 만료시간을 얻는다.
    let decode = jwt_decode(refreshToken.rt);
    let exp_ms = (decode.exp) * 1000;


    rt_blacklist = new Rt_blacklist({
        rt: refreshToken.rt,
        exp: exp_ms,
        email:email
    })
    await rt_blacklist.save();
}



async function check_expired(email){
    //만약 블랙리스트의 exp_ms보다 now_ms가 오래됐으면 (만료됐다는 뜻)
    if(await Rt_blacklist.exists({email:email})){
        let expired_rt_arr = await Rt_blacklist.find();
        let user_expired_rt_arr = expired_rt_arr.filter((e)=> e.email === email);

        let now_ms = new Date().getTime();
        console.log(now_ms);
        for (e of user_expired_rt_arr){   
            if(e.exp<now_ms){
                console.log('리프레시토큰 만료됐습니다. DB에서 삭제해도 무방합니다.');
                await Rt_blacklist.findOneAndRemove({rt:e.rt});
            }else{
                console.log("아직 리프레시토큰이 신선합니다.")
            }
        }

        
        
    }else{
        console.log('블랙리스트에없음');
    }
}