var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var { logger } = require('../../../config/logger');
var { upload } = require('./../../../config/s3_option');

//middleware
var { get_userid, get_stage_info, get_country_leaderboard } = require("../middleware/function");




//스테이지목록에서 한 스테이지 눌렀을 때 타입에 따라 전체랭킹,국가랭킹 불러오기
exports.leaderboard = async (req, res, next) => {
    const { email, country, stage_name } = req.body;

    try {
        let jsonObj = {};
        let stage = await Stage.findOne({ stage_name: stage_name });
        let user = await User.findOne({ email: email });

        let stage_name_country = `${stage_name}` + '_' + `${country}`;

        let check_initialized = user.stage_checked.findIndex(s => s === stage_name_country);
        if (check_initialized < 0) { //스테이지 랭킹 불러온적이 없을 때
            user.stage_checked.push(stage_name_country);
            await user.save({ new: true });

            let jsonArr = [];
            jsonObj.stage_info = await get_stage_info(stage);
            jsonObj.country_Normal = await get_country_leaderboard(stage, country,user.googleid);
            jsonArr.push(jsonObj);
            res.status(200).json({ status: 'success', leaderboard: jsonArr });
            //logger.info(`${userid} 가 스테이지 ${stage_name}의 랭킹을 로딩`)
        } else { //스테이지를 불러온적이 있을 때,
            res.status(200).json({ message: "이미 불러온 적 있습니다.", status: 'fail' })
        }

    } catch (err) {
        let userid = await get_userid(email);
        res.status(500).json({ error: `${err}` });
        logger.error(`${userid} 가 스테이지 ${stage_name}의 랭킹로딩에 실패 [${err}]`)
        upload(email, 'stages', err);
        next(err);
    }
    
}