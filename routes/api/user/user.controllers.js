var moment = require('moment');
var {logger,payment,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');
var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var current_version = require("../version").version;



require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

/*
//Google auth
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);
async function verify() {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
}
verify().catch(console.error);
*/

  
//접속 처리 라우터 (클라이언트 접속 시 동기화용)
exports.user_login =  async (req, res, next) => {
    const { id ,country} = req.body;
    const jsonObj = {};
    var result = await User.exists({ googleid: id });
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
            upload(err,'/user');
            next(err);
        }
    } else {
        //이미 등록된 유저
        try {
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
        } catch(err) {
            res.status(500).json({ error: "database failure" });
            logger.error(`신규 유저 로그인 에러: ${id} [${err}]`);
            userinfo.error(`신규 유저 로그인 에러: ${id} [${err}]`);
            upload();
            next(err);
        }
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
        next(err);
    }
}

//커스터마이징 처리
exports.customizing = async (req, res, next) => {
    const { id, customizing ,chest , reduce_crystal} = req.body;
    let user = await User.findOne({googleid:id}); //비교용 find
    let user_cus = user.customizing;
    let has_customizing = (user_cus.find(e => e ===customizing));
    let now_crystal = user.crystal;//현재 보유중인 크리스탈
    try{
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
        next(err);
    };
}

//스테이지 언락
exports.stage = async (req, res, next) => {
    const { id ,reduce_crystal , stage_name} = req.body;
    let user = await User.findOne({googleid:id}); //비교용 find
    let user_stage = await User_stage.findOne({userid:id});
    let has_stage = (user_stage.stage.filter(s=>s.stage_name === stage_name));
    let now_crystal = user.crystal;//현재 보유중인 크리스탈
    //유저 country 알 수 있으면 받아오게 수정

    try{
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
        next(err);
    }
}