var express = require("express");

var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
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
                    stage_number: 1,
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
        } catch {
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
        } catch {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        }
    }
});

//크리스탈 처리 라우터
router.post("/crystal", async (req, res, next) => {
    const { id, reduce_crystal } = req.body;
    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { $inc: { crystal: -reduce_crystal } },
            { new: true }
        ).setOptions({ runValidators: true });
        res.status(201).json(result.crystal);
    } catch {
        res.status(500).json({ error: "database failure" });
        console.error(error);
        next(error);
    }
});

//유저 옵션 저장 라우터 (수정 필요) (에러있다 수정)
router.post("/option", async (req, res, next) => {
    const { id, option } = req.body;

    try {
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { option: option },
            { new: true }
        );
        res.status(201).send("옵션수정 완료"); //?????무슨 차이지
        /*
        User.findOneAndUpdate(
            { googleid: id },
            { option: option },
            { new: true }
        );
        res.status(201).send("옵션수정 완료");
        */
    } catch {
        res.status(500).json({ error: "database failure" });
        console.error(error);
        next(error);
    }

    
});

//유저 커스터마이징 저장 라우터 (수정 필요) 
//(구매 시 TEXT데이터 POST요청 보내고 라우터실행, 
// TEXT데이터(커스터마이징 이름)를 배열로 push)
router.post("/customize", (req, res, next) => {
    const { id, customizing } = req.body;
    User.findOneAndUpdate(
        { googleid: id },
        { customizing: customizing },
        { new: true }
    )
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((err) => {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        });
});

//유저 언어 설정 라우터
router.post("/language", async (req, res, next) => {
    const { id, language } = req.body;
    try{
        var result = await User.findOneAndUpdate(
            { googleid: id },
            { language: language },
            { new: true }.setOptions({ runValidators: true })
        )
        res.status(201).json(result);
    }catch{
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
    }
});

//총 플레이 타임 갱신 (수정 해야 할 수 있음)
// 총 비행 시간으로 변경 가능
router.post("/playtime", (req, res, next) => {
    const { id, playtime } = req.body;
    User.findOneAndUpdate(
        { googleid: id },
        { playtime: playtime },
        { new: true }
    )
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((err) => {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        });
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

module.exports = router;
