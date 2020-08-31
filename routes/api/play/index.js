//어떤 스테이지를 플레이하면 인기도 1 상승
//인기도는 어떻게 떨궈야 할지 고민

var express = require("express");

var Stage = require("../../../models/stage");

const router = express.Router();

router.post("/", async (req, res, next) => {
    const {stage_name, gametype} = req.body //gametype에 따라 구분해야한다면 나중에 수정
    try{
        let selected_stage = await Stage.findOne({stage_name});
        selected_stage.popularity++;
        await selected_stage.save({new:true});
        res.status(201).json({"popularity":selected_stage.popularity});
    }catch (err) {
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});

module.exports = router;