var moment = require('moment');
var {logger,payment,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');
var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var current_version = require("../version").version;





require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");



require('dotenv').config();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


async function verify(token) {
    try{
        var TokenObj ={}
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        
        const userid = payload['sub'];
        
        

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
            logger.error(`accessToken error`);
            upload('accessToken error',`accessToken error`);
            return TokenObj;
        }else{
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`accessToken error`);
            upload('accessToken error',`accessToken error`);
            return TokenObj;
        }
    }catch(err){
        console.log("err났습니다.")
        
        TokenObj.error = err;
        TokenObj.verified = false; 
        logger.error(`accessToken error`);
        upload('accessToken error',`accessToken error`);
        return TokenObj;
    }
}
  
//접속 처리 라우터 (클라이언트 접속 시 동기화용)
exports.user_login =  async (req, res, next) => {
    const { id ,country,token} = req.body;
    var result = await verify(token)


    if(result.verified){
        console.log("진입");
        const jsonObj = {};
        var result = await User.exists({ googleid: id });
        var check_banned = await User.findOne({googleid: id });
    
        //신규 유저
        if (result === false) {
            try {
                //moment format
                //var day = new Date();
                var day_format = 'YYYY.MM.DD HH:mm:ss';
                var now = moment().format(day_format);
    
                var user = new User({
                    googleid: id,
                    created_date: now,
                    latest_login: now,   //Date.now(),
                    country:country,
                    version: current_version,
                    //crystal: crystal,
                    //...나머지는 default
                });
                var user_stage = new User_stage({
                    userid: id,
                    stage: {
                        stage_name: "startmusic",
                        N_cleartime: 0, //Normal
                        H_cleartime: 0, //hard
                        N_death:0,
                        H_death:0,
                    },
                });
                await Stage.findOneAndUpdate(
                    {stage_name:"startmusic"},
                    {
                        $addToSet: {
                            Normal: {
                                userid: id,
                                cleartime: 0,
                                death: 0,
                                country: country,
                            },
                            Hard:{
                                userid:id,
                                cleartime: 0,
                                death: 0,
                                country: country,
                            },
                        },
                    },{new:true}).setOptions({ runValidators: true });
                await user.save({ new: true });
                await user_stage.save({ new: true });
                jsonObj.user = user;
                jsonObj.user_stage = user_stage;
                logger.info(`신규 유저 등록 : ${id}`);
                userinfo.info(`신규 유저 등록 : ${id}`);
                res.status(200).json(jsonObj);
            } catch(err) {
                res.status(500).json({ error: "database failure" });
                logger.error(`신규 유저 등록 에러: ${id} [${err}]`);
                userinfo.error(`신규 유저 등록 에러: ${id} [${err}]`);
                upload(err,'user_login');
                next(err);
            }
        } else {
            //이미 등록된 유저
            try {
            //로그인할 때 밴 여부 체크
                //밴 당한 유저일 때
                if(check_banned.banned === true){
                    res.status(200).json({"message":`${id} 는 밴 된 유저입니다`,"banned_at":check_banned.banned_at,"baaned":"true"});
                //밴 당한 유저가 아닐 떄
                }else{
                    //moment format
                    var day = new Date();
                    var day_format = 'YYYY.MM.DD HH:mm:ss';
                    var now = moment(day).format(day_format);
    
                    var user = await User.findOneAndUpdate(
                        {googleid:id},
                        {stage_checked:[]},
                        {new:true}).setOptions({ runValidators: true });
                    
                    var user_stage = await User_stage.findOne()
                        .where("userid")
                        .equals(id);
    
                    var user = await User.findOneAndUpdate(
                        { googleid: id },
                        { latest_login: now },
                        { new: true }
                    ).setOptions({ runValidators: true });
                    jsonObj.user_stage = user_stage;
                    jsonObj.user = user;
                    logger.info(`${id} 가 로그인 했습니다.`);
                    userinfo.info(`${id} 가 로그인 했습니다.`);
                    res.status(200).json(jsonObj);
                }
            } catch(err) {
                res.status(500).json({ error: "database failure" });
                logger.error(`신규 유저 로그인 에러: ${id} [${err}]`);
                userinfo.error(`신규 유저 로그인 에러: ${id} [${err}]`);
                upload(err,'user_login');
                next(err);
            }
        }
    }else{
        console.log("토큰이 이상하거나 verify함수가 이상하거나임",result.error)
        res.status(500).json({ "message": "Token error" ,"error":`${result.error}`});
    }
    
}

//크리스탈 처리 라우터 (크리스탈 구매)
exports.crystal = async (req, res, next) => {
    const { id, get_crystal } = req.body;
    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { $inc: { crystal: get_crystal } },
            { new: true }
        ).setOptions({ runValidators: true });
        logger.info(`${id} 가 크리스탈 ${get_crystal}개를 구매했습니다.`);
        payment.info(`${id} 가 크리스탈 ${get_crystal}개를 구매했습니다.`);
        res.status(200).json(result.crystal);
    } catch(err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`크리스탈 구매 에러: ${id} [${err}]`);
        payment.error(`크리스탈 구매 에러: ${id} [${err}]`);
        upload(err,'crystal구매');
        next(err);
    }
};

//유저 옵션 저장 라우터 (볼륨, 언어)
exports.option = async (req, res, next) => {
    const { id, option } = req.body;

    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { option: option },
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(200).json(result.option);
        
    } catch(err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`옵션 설정 에러: ${id} [${err}]`);
        upload(err,'옵션설정');
        next(err);
    }
}

//커스터마이징 처리
exports.customizing = async (req, res, next) => {
    const { id, customizing ,chest , reduce_crystal} = req.body;
    try{
        let user = await User.findOne({googleid:id}); //비교용 find
        let user_cus = user.customizing;
        let has_customizing = (user_cus.find(e => e ===customizing));
        let now_crystal = user.crystal;//현재 보유중인 크리스탈
        if (chest){ //상자깡
            if(has_customizing){
                res.status(200).send("이미 보유중인 커스텀입니다.");
            }else{
                var result = await User.findOneAndUpdate(
                    {googleid:id},
                    {$addToSet:{customizing: customizing}},
                    {new:true,upsert:true},
                ).setOptions({ runValidators: true });
                logger.info(`${id} 가 커스텀 ${customizing}을(를) 상자깡으로 획득했습니다.`);
                userinfo.info(`${id} 가 커스텀 ${customizing}을(를) 상자깡으로 획득했습니다.`);
                res.status(200).json(result.customizing);
            }
        }else if(reduce_crystal>0){ //크리스탈 인 앱 결제
            console.log("크리스탈 처리");
            if(has_customizing){
                res.status(200).send("이미 보유중인 커스텀입니다.");
            }else if(now_crystal<reduce_crystal){
                res.status(200).send("크리스탈이 부족합니다.");
            }else{
                var result = await User.findOneAndUpdate(
                    {googleid:id},
                    {
                        $inc:{crystal: -reduce_crystal},
                        $addToSet:{customizing: customizing}
                    },
                    {new:true,upsert:true},
                ).setOptions({ runValidators: true });           
                const jsonObj = {};
                jsonObj.crystal = result.crystal;
                jsonObj.customizing = result.customizing;
                logger.info(`${id} 가 커스텀 ${customizing}을(를) 크리스탈로 획득했습니다.`);
                payment.info(`${id} 가 커스텀 ${customizing}을(를) 크리스탈로 획득했습니다.`);
                res.status(200).json(jsonObj);
            }
        }
        }catch(err){
        res.status(500).json({ error: "database failure" });
        logger.error(`커스텀 구매 에러: ${id} [${err}]`);
        payment.error(`커스텀 구매 에러: ${id} [${err}]`);
        upload(err,'커스텀구매');
        next(err);
    }
}

//플레이타임 (수정 필요)
exports.playtime = async (req, res, next) => {
    const { id, playtime } = req.body;
    try{
        var user = await User.findOneAndUpdate(
            { googleid: id },
            { $inc:{ playtime:playtime}},
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(200).json(user.playtime);
    }catch(err){
        res.status(500).json({ error: "database failure" });
        logger.error(`플레이타임 설정 에러: ${id} [${err}]`);
        upload(err,'플레이타임 설정');
        next(err);
    };
}

//스테이지 언락
exports.stage = async (req, res, next) => {
    const { id ,reduce_crystal , stage_name} = req.body;
    try{
        let user = await User.findOne({googleid:id}); //비교용 find
        let user_stage = await User_stage.findOne({userid:id});
        let has_stage = (user_stage.stage.filter(s=>s.stage_name === stage_name));
        let now_crystal = user.crystal;//현재 보유중인 크리스탈
        //유저 country 알 수 있으면 받아오게 수정
    
        if(now_crystal<reduce_crystal){
            res.status(200).send("크리스탈이 부족합니다.");
        }else{
            if(has_stage.length!==0){
                res.status(200).send("보유중인 스테이지입니다.");
            }else{
                //stage 모델 배열에 유저추가
                await Stage.findOneAndUpdate(
                    {stage_name:stage_name},
                    {
                        $addToSet: {
                            Normal: {
                                userid: id,
                                cleartime: 0,
                                death: 0,
                                country: user.country,
                            },
                            Hard:{
                                userid:id,
                                cleartime: 0,
                                death: 0,
                                country: user.country,
                            },
                        },
                    },{new:true}).setOptions({ runValidators: true });

                await User_stage.findOneAndUpdate(
                    {userid:id},
                    {$addToSet: {stage:{
                        stage_name:stage_name,
                        N_cleartime:0,
                        H_cleartime:0,
                        N_death:0,
                        H_death:0,
                    }}},
                    {new:true}
                    ).setOptions({ runValidators: true });
                await User.findOneAndUpdate(
                    {googleid:id},
                    {$inc:{crystal: -reduce_crystal},},
                    {new:true,upsert:true},
                ).setOptions({ runValidators: true });           
                logger.info(`${id} 가 스테이지 ${stage_name}을(를) 크리스탈로 획득했습니다.`);
                payment.info(`${id} 가 스테이지 ${stage_name}을(를) 크리스탈로 획득했습니다.`);
                res.status(200).send("스테이지 언락 완료");
            } 
        }      
    }catch(err){
        res.status(500).json({ error: "database failure" });
        logger.error(`스테이지 구매 에러: ${id} [${err}]`);
        payment.error(`스테이지 구매 에러: ${id} [${err}]`);
        upload(err,'스테이지 구매 설정');
        next(err);
    }
}

//프리미엄 구매
exports.premium = async (req, res, next) => {
    const { id, reduce_crystal, premium } = req.body; //premium -> Boolean
    try {
        let user = await User.findOne({googleid:id}); //비교용 find
        let now_crystal = user.crystal;//현재 보유중인 크리스탈
        let check_premium = user.premium;

        if(now_crystal<reduce_crystal){ //크리스탈 부족 시
            res.status(200).send("크리스탈이 부족합니다.");
        }else{
            if(check_premium){ //프리미엄 유저 일 시
                res.status(200).send("이미 프리미엄 유저입니다.")
            }else{
                var result = await User.findOneAndUpdate(
                    { googleid: id },
                    { $inc:{crystal: -reduce_crystal} ,premium: premium },
                    { new: true }
                ).setOptions({ runValidators: true });
                logger.info(`${id} 가 프리미엄을 구매했습니다.`);
                payment.info(`${id} 가 프리미엄을 구매했습니다.`);
                res.status(200).json({"crystal":result.crystal,"premium":premium});
            }
        }    
    } catch(err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`프리미엄 구매 에러: ${id} [${err}]`);
        payment.error(`프리미엄 구매 에러: ${id} [${err}]`);
        upload(err,'프리미엄 구매 설정');
        next(err);
    }
}