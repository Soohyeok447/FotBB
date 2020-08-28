var express = require("express");

var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
const { json } = require("body-parser");
var current_version = require("../version").version;

const router = express.Router();

//접속 처리 라우터 (클라이언트 접속 시 동기화용)
router.post("/", async (req, res, next) => {
    const { id } = req.body;
    const jsonObj = {};
    var result = await User.exists({ googleid: id });
    //신규 유저
    if (result === false) {
        try {
            var user = new User({
                googleid: id,
                latest_login: Date.now(),
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
                    death:0
                    //unlock: true,
                },
            });
            await user.save({ new: true });
            await user_stage.save({ new: true });
            jsonObj.user = user;
            jsonObj.user_stage = user_stage;
            res.status(201).json(jsonObj);
        } catch(err) {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        }
    } else {
        //이미 등록된 유저
        try {
            var user_stage = await User_stage.findOne()
                .where("userid")
                .equals(id);

            var user = await User.findOneAndUpdate(
                { googleid: id },
                { latest_login: Date.now() },
                { new: true }
            ).setOptions({ runValidators: true });
            jsonObj.user_stage = user_stage;
            jsonObj.user = user;
            res.status(201).json(jsonObj);
        } catch(err) {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        }
    }
});

//크리스탈 처리 라우터 (크리스탈 구매)
router.post("/crystal", async (req, res, next) => {
    const { id, crystal } = req.body;
    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { $inc: { crystal: crystal } },
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(201).json(result.crystal);
    } catch(err) {
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});

//유저 옵션 저장 라우터 (볼륨, 언어)
router.post("/option", async (req, res, next) => {
    const { id, option } = req.body;

    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { option: option },
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(201).json(result.option);
        
    } catch(err) {
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }

    
});

//유저 커스터마이징 저장 라우터
router.post("/customizing",async (req, res, next) => {
    const { id, customizing ,chest , reduce_crystal} = req.body;
    let user = await User.findOne({googleid:id}); //비교용 find
    let user_cus = user.customizing;
    let has_customizing = (user_cus.find(e => e ===customizing));
    let now_crystal = user.crystal;//현재 보유중인 크리스탈
    try{
        if (chest){ //상자깡
            if(has_customizing){
                res.status(201).send("이미 보유중인 커스텀입니다.");
            }else{
                var result = await User.findOneAndUpdate(
                    {googleid:id},
                    {$addToSet:{customizing: customizing}},
                    {new:true,upsert:true},
                ).setOptions({ runValidators: true });
                res.status(201).json(result.customizing);
            }
        }else if(reduce_crystal>0){ //크리스탈 인 앱 결제
            console.log("크리스탈 처리");
            if(has_customizing){
                res.status(201).send("이미 보유중인 커스텀입니다.");
            }else if(now_crystal<reduce_crystal){
                res.status(201).send("크리스탈이 부족합니다.");
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
                res.status(201).json(jsonObj);
            }
        }
        }catch(err){
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});


//총 플레이 타임 갱신 (수정 해야 할 수 있음)
// (총 비행 시간)으로 변경 가능
router.post("/playtime", async (req, res, next) => {
    const { id, playtime } = req.body;
    try{
        var user = await User.findOneAndUpdate(
            { googleid: id },
            { $inc:{ playtime:playtime}},
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(201).json(user.playtime);
    }catch(err){
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    };
});

//stage인 앱 구매 (크리스탈)
router.post("/stage",async (req, res, next) => {
    const { id ,reduce_crystal , stage_name} = req.body;
    let user = await User.findOne({googleid:id}); //비교용 find
    let user_stage = await User_stage.findOne({userid:id});
    let has_stage = (user_stage.stage.filter(s=>s.stage_name === stage_name));
    let now_crystal = user.crystal;//현재 보유중인 크리스탈
    try{
        if(now_crystal<reduce_crystal){
            res.status(201).send("크리스탈이 부족합니다.");
        }else{
            if(has_stage.length!==0){
                res.status(201).send("보유중인 스테이지입니다.");
            }else{
                let stage = await User_stage.findOneAndUpdate(
                    {userid:id},
                    {$addToSet: {stage:{
                        stage_name:stage_name,
                        N_cleartime:0,
                        H_cleartime:0,
                        death:0
                    }}},
                    {new:true}
                    ).setOptions({ runValidators: true });
                let user = await User.findOneAndUpdate(
                        {googleid:id},
                        {$inc:{crystal: -reduce_crystal},},
                        {new:true,upsert:true},
                    ).setOptions({ runValidators: true });           
                    const jsonObj = {};
                    jsonObj.crystal = user.crystal;
                    jsonObj.user_stage = stage;
                    res.status(201).json(jsonObj);
            } 
        }      
    }catch(err){
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});


//findbygoogleid 테스트용 라우터 async await 적용
router.post("/test1", async (req, res, next) => {
    const { id } = req.body;
    const jsonObj = {};
    try {
        var result = await User.findByGoogleid(id);
        jsonObj.user = result;
        console.log(jsonObj);
    } catch (error) {
        consolg.log(error);
    }
    res.json(jsonObj);
});

//쿼리빌더 테스트용 라우터
router.post("/test2", async (req, res, next) => {
    const { id } = req.body;
    const jsonObj = {};
    try {
        var result = await User.find().where("googleid").equals(id);

        jsonObj.user = result;
        console.log(jsonObj);
    } catch (error) {
        consolg.log(error);
    }
    res.json(jsonObj);
});


/*
//유저 언어 설정 라우터
router.post("/language", async (req, res, next) => {
    const { id, option } = req.body;
    try{
        console.log(`${id} , ${option.language}`);
        
        var result = await User.findOneAndUpdate(
            { googleid: id},
            { option: option },
            { new: true }.setOptions({ runValidators: true })
        )

        res.status(201).json(result.option);
    }catch(err){
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
    }
});
*/








module.exports = router;
