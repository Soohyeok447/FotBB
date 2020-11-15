var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var { logger } = require('../../../config/logger');
var { upload } = require('./../../../config/s3_option');

//middleware
var { get_userid, get_stage_info, get_country_leaderboard } = require("../middleware/function");


//////////////////verify///////////////////////
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


async function verify(token, email) {
    try {
        var TokenObj = {}

        //email이 존재하지 않는 경우
        if (!email) {
            TokenObj.verified = false;
            TokenObj.error = 'no email';
            logger.error(`no email`);
            upload('', 'stages | token', `no email`);
            return TokenObj;
        } else {
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
        if (check_validation && payload) {
            console.log("aud일치 유효한 토큰입니다.")
            TokenObj.payload = payload;
            TokenObj.verified = true;

            return TokenObj;

        } else if (check_validation) {
            console.log("payload가 없습니다.")
            TokenObj.verified = false;
            TokenObj.error = 'no payload';
            logger.error(`no payload error`);
            upload(email, 'stages | token', `accessToken error`);
            return TokenObj;
        } else {
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email, 'stages | token', `accessToken error`);
            return TokenObj;
        }

    } catch (err) {
        console.log("err났습니다.")
        let check_expiredtoken = /Token used too late/;

        let error = err.toString();


        let check = error.match(check_expiredtoken);

        //토큰 만료 에러
        if (check) {
            TokenObj.error = 'Token Expired';
            TokenObj.verified = false;
            //토큰 만료 에러 외
        } else {
            TokenObj.error = err;
            TokenObj.verified = false;
        }

        logger.error(`${id} - ${email} : ${err}`);
        upload(email, `stages | token`, err);
        return TokenObj;
    }
}


//스테이지목록에서 한 스테이지 눌렀을 때 타입에 따라 전체랭킹,국가랭킹 불러오기
exports.leaderboard = async (req, res, next) => {
    const { email, country, stage_name, token } = req.body;
    var verify_result = await verify(token, email)
    if (verify_result.verified) {
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
    } else {
        res.status(500).json({ "message": "Token error", "error": `${verify_result.error}` });
    }
}