

var Stage = require("../../../models/stage");
var {logger,play} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');

//스테이지 플레이 횟수 +1
exports.playcount_up = async (req, res, next) => {
    const {stage_name, gametype} = req.body //gametype에 따라 구분해야한다면 나중에 수정
    try{
        let selected_stage = await Stage.findOne({stage_name});
        selected_stage.playcount++;
        await selected_stage.save({new:true});
        logger.info(`스테이지${stage_name} 플레이됨.`);
        res.status(200).json({"playcount":selected_stage.playcount});
    }catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`스테이지 플레이 에러: ${stage_name} [${err}]`);
        upload(err,`${stage_name}| /play`);
        next(err);
    }
}