var moment = require('moment');
var { logger, payment, userinfo } = require('../../../config/logger');
var { upload, report_notice } = require('./../../../config/s3_option');
var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var Report = require("../../../models/report_user");
var Banned = require("../../../models/banned");


//middleware
var { get_userid, get_now, get_country_leaderboard, get_global_leaderboard, get_stage_info } = require("../middleware/function");

//닉네임 필터링용 문자열
const fs = require('fs');
let filter = fs.readFileSync("/root/Fotbb/src/filter.txt");


var current_version = require("../version/current_version.js");

//닉네임 생성기용 obj
var nick_obj = require("../../../src/nickname_generator.json");




require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


//version 상수화
const _version = current_version.version;


//닉네임 비속어 필터링
function id_filter(new_id) {
    //특수문자 제거용 reg

    var reg = /[\{\}\[\]\/?.,;:\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    console.log(`필터링 함수 내의 id - ${new_id}`);
    //특수문자 필터링
    var _filter = filter.toString().replace(reg, "");
    var _filter = _filter.toString().replace(/\r\n/g, ""); //엔터
    var result = new RegExp(_filter);
    //txt 파일 정규표현식 객체화

    console.log(result);  // -> 필터링단어 목록을 찍어낸다

    //필터링되지 않으면 false 반환, 필터링 되면 true 반환
    let test = result.exec(new_id);
    console.log(`정규표현식 결과 -> ${test}`);
    //true, false로 치환
    if (test !== null) {
        filtered = true;
    } else {
        console.log("필터링 통과했습니다.")
        filtered = false;
    }
    return filtered;
}



//닉네임 생성기
exports.nickname_generator = async (req, res, next) => {
    userid = generator();
    //중복이 없을 때 까지 체크
    while (true) {
        let userid_list = await User.find().select("-_id googleid");
        let result = userid_list.filter(e => e.googleid === userid);
        if (result.length === 0) { //중복된 아이디가 없을 때
            break;
        } else {
            console.log("정말 신기하게도 중복발생!");
            userid = generator();
        }
    }
    res.status(200).json({ generated_nickname: userid });

    



    function generator() {
        let adj;
        let noun;
        let rand_int;
        let combined_nickname;
        const max_int = 10000;

        //<형용사>
        //형용사 객체 개수를 length로 구하고
        let adj_max = nick_obj.adj.length;

        //랜덤으로 객체(형용사)를 정한다.
        let rand_adj = Math.floor(Math.random() * adj_max);


        //객체 필드 접근으로 형용사를 뽑는다.
        adj = nick_obj.adj[rand_adj];
        //console.log("형용사",adj);

        //<명사>
        //명사 객체 개수를 length로 구하고
        let noun_max = nick_obj.noun.length;

        //랜덤으로 객체(명사)를 정한다.
        let rand_noun = Math.floor(Math.random() * noun_max);

        //객체 필드 접근으로 명사를 뽑는다.
        noun = nick_obj.noun[rand_noun];
        //console.log("명사",noun);

        //랜덤 숫자를 뽑는다/
        rand_int = Math.floor(Math.random() * max_int);
        //console.log("랜덤숫자",rand_int);

        //닉네임을 조합한다.
        combined_nickname = adj + noun + rand_int;

        return combined_nickname;
    }
}


//fotbb DB에 이미 저장된 유저인지 파악용 (가입여부 체킹 로직 분리)
//로그인 로직에서 제일먼저 접근하는 api이기 때문에
//여기에서 버전 체크도 같이 진행하자
exports.check_exist_user = async (req, res, next) => {
    const { email, user_version } = req.body;

    //current_version이랑 게임 내부에 변수로 저장돼있는 version이랑 
    //비교를한다
    if (_version === user_version) {
        console.log("올바른 접근입니다.")
        var result = await User.exists({ email: email });
        res.status(200).json({ exist: result });
    } else {
        console.log("업데이트가필요합니다.")
        //구버전이면 업데이트하도록 처리
        res.status(200).json({ message: `유저버전 ${user_version} => 현재버전 ${_version} 업데이트가 필요합니다.`, need_update: true });
    }


}

//유효성 체크 라우터 
//신규 유저 가입할 때나 닉네임 변경할 때 미리 접근해서 유효성체킹 하는 api
exports.check_validation = async (req, res, next) => {
    const { new_id } = req.body;

    console.log("진입했습니다.")
    let validation = false;
    //신규 유저일 때, 만약 유효성 통과하면 생성하고
    //안되면 생성취소하고 다시 접근하도록 한다.
    try {
        //아이디만들 때 고려해야 할 점
        //1. 13자 이하여야 함
        //트림
        var _new_id = new_id.replace(/(\s*)/g, "");
        //console.log(_new_id);


        //최대길이 13자 체크
        if (_new_id.length > 13) {
            res.status(200).json({ message: "닉네임은 13자를 초과하면 안됩니다.", code: 200, validation: false });
        } else {
            //2. 비속어가 있으면 안됨 (필터링)
            //비속어 필터링
            console.log("1단계 13자 체크 통과");
            if (id_filter(_new_id)) {
                console.log("2단계에서 필터링 됐습니다.")
                //필터링 되면 (비속어 있음)
                res.status(200).json({ message: "필터링 됐습니다", code: 200, validation: false });
            } else {//필터링 안되면 (비속어 없음)
                console.log("2단계 필터링 통과");
                //3. 이미 존재중인 id면 안됨
                let userid_list = await User.find().select("-_id googleid");

                let result = userid_list.filter(e => e.googleid === _new_id);

                if (result.length === 0) { //중복된 아이디가 없을 때
                    //중복되는 id 가 없음 => 완전히 새로운 id니까 생성가능 
                    console.log("3단계 필터링 통과");
                    validation = true;
                    res.status(200).json({ message: "유효성검사 통과.", code: 200, validation: validation }); // 닉네임 유효성 검사 결과 리턴(Boolean)
                } else { // 중복된 아이디 존재
                    //유효성 검사 통과 실패
                    console.log("아이디 중복입니다.");
                    validation = false;
                    res.status(200).json({ message: "아이디 중복입니다.", code: 200, validation: validation }); // 닉네임 유효성 검사 결과 리턴(Boolean)
                }
            }
        }
    } catch (err) {
        console.log(err)
    }


}


async function get_all_leaderboard(email) {
    let resultArr = [];
    let j = 0;
    // let stage_list = [];
    // let totalObj= {};

    //유저가 보유중인 스테이지의 목록을 얻는다.
    let userid = await get_userid(email);
    let user_stage = await User_stage.findOne({ userid: userid });
    // 스테이지마다 돌면서 글로벌 리더보드와 정보를 뽑는다.


    // console.log("===============함수 실행===============")
    // console.log(`user_stage.stage.length(유저의 스테이지 개수) = ${user_stage.stage.length}\n\n\n`);
    for (j in user_stage.stage) {
        let stage = await Stage.findOne({ stage_name: user_stage.stage[j].stage_name });

        await add_obj(stage, userid).then((Obj) => {
            resultArr.push(Obj);
        })
    }

    return resultArr;



    function add_obj(stage, userid) {
        const jsonObj = {};
        //유저가 보유중인 스테이지를 참조하여 스테이지 객체를 얻는다.

        return new Promise(async (resolve, rejected) => {
            jsonObj["stage_info"] = await get_stage_info(stage);
            jsonObj["global_Normal"] = await get_global_leaderboard(stage, userid);
            resolve(jsonObj);
        })
    };
}


////////////////////////////////////////////


// //접속 처리 컨트롤러 (클라이언트 접속 시 동기화용)
//     // DB에 저장안돼 있는 유저의 생성 컨트롤러
// 유효성검사를 거친 뒤에 접근하는  api 이기 때문에 중복은 일어나지 않는다.
exports.user_login = async (req, res, next) => {
    const { create, new_id, country, email } = req.body;

    const jsonObj = {};
    let check_exist = await User.exists({ email: email });

    //신규 유저일 경우
    //신규 유저가 닉네임 유효성 통과했을 경우 DB에 저장  | create => boolean
    if (create) {
        try {
            if (check_exist) {
                console.log("테스트 실수방지용 코드입니다");
                res.status(200).json({ message: "잘못된 접근입니다." });
            } else {
                //moment format
                //var day = new Date();
                var day_format = 'YYYY.MM.DD HH:mm:ss';
                var now = moment().format(day_format);

                var user = new User({
                    googleid: new_id,
                    email: email,
                    created_date: now,
                    latest_login: now,   //Date.now(),
                    country: country,
                    bee_custom: 0,
                    shot_custom: 0,
                    badge: 0,
                    //crystal: crystal,
                    //...나머지는 default
                });
                var user_stage = new User_stage({
                    userid: new_id,
                    stage: {
                        stage_name: "바흐시메이저",
                        N_cleartime: 0, //Normal
                        N_death: 0,
                    },
                });
                await Stage.findOneAndUpdate(
                    { stage_name: "바흐시메이저" },
                    {
                        $addToSet: {
                            Normal: {
                                userid: new_id,
                                cleartime: 0,
                                death: 0,
                                country: country,
                                renewed_at: '',
                                used_badge: 0,
                                used_bee_custom: 0,
                                terminated: false,
                            },
                        },
                    }, { new: true }).setOptions({ runValidators: true });
                await user.save({ new: true });
                await user_stage.save({ new: true });



                jsonObj.user = user;
                jsonObj.user_stage = user_stage;
                //여기서 리더보드도 같이 응답하도록
                jsonObj.leaderboard = await get_all_leaderboard(email);



                res.status(200).json(jsonObj);
                logger.info(`신규 유저 등록 : ${email} : ${user.googleid}`);
                userinfo.info(`신규 유저 등록 : ${email} : ${user.googleid}`);

            }

        } catch (err) {
            res.status(500).json({ error: "database failure" });
            logger.error(`신규 유저 등록 에러: ${email} : ${user.googleid} [${err}]`);
            userinfo.error(`신규 유저 등록 에러: ${email} : ${user.googleid} [${err}]`);
            upload(email, 'user_login', err);
            next(err);
        }
        //이미 등록된 유저 일 때, 로그인 진행
    } else {
        try {
            let check_banned = await Banned.findOne({ email: email });
            //로그인할 때 밴 여부 체크
            //밴 당한 유저일 때
            if (check_banned) {
                console.log("밴로직 진입");
                res.status(200).json({ "message": `${check_banned.userid} 는 밴 된 유저입니다`, "banned_at": check_banned.banned_at, "banned": "true" });
                //밴 당한 유저가 아닐 떄
            } else {
                //user 객체 얻기
                let user = await User.findOne({ email: email });

                //만약 최신버전이면 로직 계속 진행
                let now = get_now();

                var user_stage = await User_stage.findOne()
                    .where("userid")
                    .equals(user.googleid);

                //로그인했을 때 stage체크여부 초기화 및 최근 로그인 날짜 갱신
                user.stage_checked = [];
                user.latest_login = now;
                await user.save({ new: true });

                jsonObj.user_stage = user_stage;
                jsonObj.user = user;
                //여기서 리더보드도 같이 응답하도록
                jsonObj.leaderboard = await get_all_leaderboard(email);




                res.status(200).json(jsonObj);
                logger.info(`email : ${email} - ${user.googleid} 가 로그인 했습니다.`);
                userinfo.info(`email : ${email} - ${user.googleid} 가 로그인 했습니다.`);
            }
        } catch (err) {
            // 이메일은 존재하다면
            if (email) {
                let id = await get_userid(email);
                res.status(500).json({ error: "database failure" });
                logger.error(`신규 유저 로그인 에러: ${id}} [${err}]`);
                userinfo.error(`신규 유저 로그인 에러: ${id} [${err}]`);
                upload(email, 'user_login', err);
                next(err);
            } else { //이메일이 존재하지 않는 이상한 접근일 경우
                res.status(500).json({ error: "database failure" });
                logger.error(`신규 유저 로그인 에러: 이메일이 존재하지 않습니다. [${err}]`);
                userinfo.error(`신규 유저 로그인 에러: 이메일이 존재하지 않습니다. [${err}]`);
                upload('', 'user_login', err);
                next(err);
            }
        }
    }

}



//크리스탈 처리 라우터 (크리스탈 획득)
exports.crystal = async (req, res, next) => {
    const { email, crystal, royal_crystal } = req.body;

    try {
        if (crystal && !royal_crystal) { //일반 크리스탈이면
            var result = await User.findOneAndUpdate(
                { email: email },
                { $inc: { crystal: crystal } },
                { new: true }
            ).setOptions({ runValidators: true });
            res.status(200).json({ user: result });
            logger.info(`${result.googleid} 가 크리스탈 ${crystal}개를 획득했습니다.`);
            payment.info(`${result.googleid} 가 크리스탈 ${crystal}개를 획득했습니다.`);
        } else if (royal_crystal && !crystal) { //로얄 크리스탈이면
            var result = await User.findOneAndUpdate(
                { email: email },
                { $inc: { royal_crystal: royal_crystal } },
                { new: true }
            ).setOptions({ runValidators: true });
            res.status(200).json({ user: result });
            logger.info(`${result.googleid} 가 로얄 크리스탈 ${royal_crystal}개를 획득했습니다.`);
            payment.info(`${result.googleid} 가 로얄 크리스탈 ${royal_crystal}개를 획득했습니다.`);
        } else if (royal_crystal && crystal) {
            var result = await User.findOneAndUpdate(
                { email: email },
                {
                    $inc: { crystal, royal_crystal }
                },
                { new: true }
            ).setOptions({ runValidators: true });
            res.status(200).json({ user: result });
            logger.info(`${result.googleid} 가 크리스탈 ${crystal}, 로얄 크리스탈 ${royal_crystal}개를 획득했습니다.`);
            payment.info(`${result.googleid} 가 크리스탈 ${crystal}, 로얄 크리스탈 ${royal_crystal}개를 획득했습니다.`);
        } else {
            res.status(200).json({ message: "잘못된 입력", status: 'fail' });

        }
    } catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`크리스탈 획득 에러: ${result.googleid} [${err}]`);
        payment.error(`크리스탈 획득 에러: ${result.googleid} [${err}]`);
        upload(email, 'crystal획득', err);
        next(err);
    }
}


//커스터마이징 처리
exports.customizing = async (req, res, next) => {
    const { email, custom_type, crystal_type, reduce_crystal, customizing } = req.body;

    try {
        let user = await User.findOne({ email: email }); //비교용 find
        let bee_custom = user.bee_custom;
        let shot_custom = user.shot_custom;
        let holding_crystal = user.crystal;//현재 보유중인 크리스탈
        let holding_royal_crystal = user.royal_crystal;//현재 보유중인 로얄 크리스탈

        //벌 커스텀, 샷 커스텀 분기
        if (custom_type === 'bee') {
            let has_bee_custom = (bee_custom.find(e => e === customizing));

            //해당 벌 커스텀을 이미 보유중이면
            if (has_bee_custom || has_bee_custom === 0) { //0은 false라서 따로 추가
                res.status(200).json({ message: "이미 보유중인 벌 커스텀입니다..", status: 'fail' });
                //보유중이지 않은 벌 커스텀이면
            } else {
                if (crystal_type === 'royal') { //로얄 커스텀이면
                    if (holding_royal_crystal < reduce_crystal) {
                        res.status(201).json({ message: "로얄 크리스탈이 부족합니다.", status: 'fail' });
                    } else {
                        var result = await User.findOneAndUpdate(
                            { email: email },
                            {
                                $inc: { royal_crystal: -reduce_crystal },
                                $addToSet: { bee_custom: customizing }
                            },
                            { new: true, upsert: true },
                        ).setOptions({ runValidators: true });
                        res.status(200).json({ user: result, status: 'success' });
                        logger.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                        userinfo.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                    }
                } else if (crystal_type === 'normal') {  // 일반 커스텀이면
                    if (holding_crystal < reduce_crystal) {
                        res.status(201).json({ message: "크리스탈이 부족합니다.", status: 'fail' });
                    } else {
                        var result = await User.findOneAndUpdate(
                            { email: email },
                            {
                                $inc: { crystal: -reduce_crystal },
                                $addToSet: { bee_custom: customizing }
                            },
                            { new: true, upsert: true },
                        ).setOptions({ runValidators: true });
                        res.status(200).json({ user: result, status: 'success' });
                        logger.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                        userinfo.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);

                    }
                } else { //잘못된 입력
                    res.status(200).json({ message: "잘못된 입력", status: 'fail' });
                }
            }

        } else if (custom_type === 'shot') {
            let has_shot_custom = (shot_custom.find(e => e === customizing));

            //해당 샷 커스텀을 이미 보유중이면
            if (has_shot_custom || has_shot_custom === 0) { //0은 false라서 따로 추가
                res.status(200).json({ message: "이미 보유중인 벌 커스텀입니다..", status: 'fail' });
                //보유중이지 않은 샷 커스텀이면
            } else {
                if (crystal_type === 'royal') { //로얄 커스텀이면
                    if (holding_royal_crystal < reduce_crystal) {
                        res.status(201).json({ message: "로얄 크리스탈이 부족합니다.", status: 'fail' });
                    } else {
                        var result = await User.findOneAndUpdate(
                            { email: email },
                            {
                                $inc: { royal_crystal: -reduce_crystal },
                                $addToSet: { shot_custom: customizing }
                            },
                            { new: true, upsert: true },
                        ).setOptions({ runValidators: true });
                        res.status(200).json({ user: result, status: 'success' });
                        logger.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                        userinfo.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                    }
                } else if (crystal_type === 'normal') {  // 일반 커스텀이면
                    if (holding_crystal < reduce_crystal) {
                        res.status(201).json({ message: "크리스탈이 부족합니다.", status: 'fail' });
                    } else {
                        var result = await User.findOneAndUpdate(
                            { email: email },
                            {
                                $inc: { crystal: -reduce_crystal },
                                $addToSet: { shot_custom: customizing }
                            },
                            { new: true, upsert: true },
                        ).setOptions({ runValidators: true });
                        res.status(200).json({ user: result, status: 'success' });
                        logger.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);
                        userinfo.info(`${user.googleid} 가 커스텀 ${customizing}을(를) 획득했습니다.`);

                    }
                } else { //잘못된 입력
                    res.status(200).json({ message: "잘못된 크리스탈 타입 입력", status: 'fail' });
                }
            }
        } else {
            res.status(200).json({ message: "잘못된 커스텁 타입 입력", status: 'fail' });
        }

    } catch (err) {
        let id = get_userid(email)
        res.status(500).json({ error: "database failure" });
        logger.error(`커스텀 구매 에러: ${id} : ${email} [${err}]`);
        payment.error(`커스텀 구매 에러: ${id} : ${email} [${err}]`);
        upload(email, '커스텀구매', err);
        next(err);
    }
}




//스테이지 언락
exports.stage = async (req, res, next) => {
    const { email, reduce_crystal, stage_name } = req.body;


    try {
        let user = await User.findOne({ email: email }); //비교용 find
        let user_stage = await User_stage.findOne({ userid: user.googleid });
        let has_stage = (user_stage.stage.filter(s => s.stage_name === stage_name));
        let now_crystal = user.crystal;//현재 보유중인 크리스탈
        //유저 country 알 수 있으면 받아오게 수정

        let stageObj = await Stage.findOne({ stage_name: '바흐시메이저' });
        let idx = stageObj.Normal.findIndex((e) => e.userid === user.googleid);
        let used_bee_custom = stageObj.Normal[idx].used_bee_custom;
        let used_badge = stageObj.Normal[idx].used_badge;

        if (now_crystal < reduce_crystal) {
            res.status(200).json({ status: 'fail', message: "크리스탈이 부족합니다." });
        } else {
            if (has_stage.length !== 0) {
                res.status(200).json({ status: 'fail', message: "이미 보유중입니다." });
            } else {
                //stage 모델 배열에 유저추가
                let stage = await Stage.findOneAndUpdate(
                    { stage_name: stage_name },
                    {
                        $addToSet: {
                            Normal: {
                                userid: user.googleid,
                                cleartime: 0,
                                death: 0,
                                country: user.country,
                                used_bee_custom: used_bee_custom,
                                used_badge: used_badge,
                                renewed_at: '',
                                terminated: false,
                            },
                        },
                    }, { new: true }).setOptions({ runValidators: true });

                let usResult = await User_stage.findOneAndUpdate(
                    { userid: user.googleid },
                    {
                        $addToSet: {
                            stage: {
                                stage_name: stage_name,
                                N_cleartime: 0,
                                H_cleartime: 0,
                                N_death: 0,
                                H_death: 0,
                            }
                        }
                    },
                    { new: true }
                ).setOptions({ runValidators: true });
                let userResult = await User.findOneAndUpdate(
                    { email: email },
                    { $inc: { crystal: -reduce_crystal }, },
                    { new: true, upsert: true },
                ).setOptions({ runValidators: true });

                //언락 후 해당 스테이지 리더보드 동기화
                let stageArr = [];
                let stageObj = {};
                stageObj.stage_info = await get_stage_info(stage);

                stageObj.global_Normal = await get_global_leaderboard(stage, "Normal", user.googleid);
                stageObj.country_Normal = await get_country_leaderboard(stage, user.country, "Normal", user.googleid);
                stageArr.push(stageObj);

                res.status(200).json({ message: `${stage_name} 언락완료.`, crystal: userResult.crystal, status: 'success', user_stage: usResult, leaderboard: stageArr });
                logger.info(`${email} : ${user.googleid} 가 스테이지 ${stage_name}을(를) 언락완료.`);
                payment.info(`${email} : ${user.googleid} 가 스테이지 ${stage_name}을(를) 언락완료.`);
            }
        }
    } catch (err) {
        let userid = await get_userid(email);
        res.status(500).json({ error: "database failure" });
        logger.error(`스테이지 구매 에러: ${email} : ${userid}[${err}]`);
        payment.error(`스테이지 구매 에러: ${email} : ${userid}[${err}]`);
        upload(email, '스테이지 구매 에러', err);
        next(err);
    }
}


//프리미엄 구매
exports.premium = async (req, res, next) => {
    const { email, reduce_crystal, premium } = req.body; //premium -> Boolean


    try {
        let user = await User.findOne({ email: email }); //비교용 getfind
        let now_crystal = user.crystal;//현재 보유중인 크리스탈
        let check_premium = user.premium;

        if (now_crystal < reduce_crystal) { //크리스탈 부족 시
            res.status(200).send("크리스탈이 부족합니다.");
        } else {
            if (check_premium) { //프리미엄 유저 일 시
                res.status(200).send("이미 프리미엄 유저입니다.")
            } else {
                var result = await User.findOneAndUpdate(
                    { email: email },
                    { $inc: { crystal: -reduce_crystal }, premium: premium },
                    { new: true }
                ).setOptions({ runValidators: true });
                res.status(200).json({ "crystal": result.crystal, "premium": premium });
                logger.info(`${email} : ${user.googleid} 가 프리미엄을 구매했습니다.`);
                payment.info(`${email} : ${user.googleid} 가 프리미엄을 구매했습니다.`);
            }
        }
    } catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`프리미엄 구매 에러: ${email} : ${user.googleid} [${err}]`);
        payment.error(`프리미엄 구매 에러: ${email} : ${user.googleid} [${err}]`);
        upload(email, '프리미엄 구매 설정', err);
        next(err);
    }

}




//부적절 닉네임 신고
exports.report = async (req, res, next) => {
    const { email, target_id } = req.body;

    try {
        const limit = 3;

        let findUser = await User.findOne({ googleid: target_id })

        let user = await Report.findOne({ email: findUser.email }); //비교용 find
        //만약 유저가 DB에 저장이 안돼있으면 다큐먼트 생성
        if (user === null) {
            let new_user = new Report({
                email: findUser.email,
                id: target_id,
                count: 0,
                changed_id_by_force: 0,
            });
            await new_user.save({ new: true });
            res.status(200).json({ "message": "등록 완료", "code": 200 });
        } else {
            //다큐먼트가 존재하면 신고당한 횟수 +1 갱신
            user.count++;
            await user.save({ new: true });

            if (user.count > 3 && user.count % limit === 0) {
                console.log("진입");
                //신고당한 횟수가 3회 이상이면 운영진에게 알림을 주는 시스템이 있으면 좋겠음 (aws sns라든가 이건 뭐 upload가 있으니까 금방가능)

                logger.info(`${user.email}의 신고횟수가 ${limit}회를 넘었습니다. 현재 신고횟수 - ${user.count}회 현재 닉네임 - ${user.id}`);

                //aws sns 연결 후 운영진에게 sns보내기...?
                report_notice(user.id, user.email, user.count);
            }
            res.status(200).json({ "message": "신고 횟수 갱신 완료", "count": user.count, "code": 200 });
        }


    } catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`신고 에러: ${email} [${err}]`);
        payment.error(`신고 에러: ${email} [${err}]`);
        upload("", `email : ${email} 신고`, err);
        next(err);
    }

}



//변경하기전에 유효성체크하고 접근해야함
//changed_id 는 유효성체크( 비속어 필터링, 13자 이하, 중복체크) 통과한 문자열임
//닉네임 변경
exports.id_change = async (req, res, next) => {
    const { changed_id, use_generator, email } = req.body;

    try {
        //먼저 User모델에 email로 find해서 수정되기 전 id를 가지고 옴
        let user = await User.findOne({ email: email })
        let before_id = user.googleid;


        //만약 닉네임생성기를 이용한다고 치면
        //new_id에 닉네임생성기함수() 대입


        // change_nickname 함수는 하나만 있으면 괜찮아 보임
        if (use_generator) {
            //new_id = nickname_generator();
            change_nickname(user, changed_id, before_id);
        } else {
            change_nickname(user, changed_id, before_id);
        }
    } catch (err) {
        res.status(500).json({ error: "database failure" });
        logger.error(`닉네임 변경 에러: ${email} [${err}]`);
        payment.error(`닉네임 변경 에러: ${email} [${err}]`);
        upload(email, `email : ${email} 닉네임 변경`, err);
        next(err);
    }




    async function change_nickname(user, new_id, before_id) {

        /*  
                    변경해야 할 DB
                <User, User_stage, Stage>
            */


        //User의 googleid 변경
        user.googleid = new_id;
        await user.save({ new: true });

        //User_stage의 userid 변경
        // before_id 로 Stage, User_stage에 있는 모델에 접근
        let user_stage = await User_stage.findOne({ userid: before_id });
        user_stage.userid = new_id;
        await user_stage.save({ new: true });

        //Stage의 userid 변경 
        //이건 조금 까다로운데 Stage모델속에 stage객체배열이 있고 Normal객체배열 속 userid와 Hard 객체배열 속 userid를 바꿔야한다. 
        let stage = await Stage.find({}); // 모든 다큐먼트 불러오기 (모든 스테이지)
        stage.forEach(async e => { //e 는 하나의 스테이지 객체 
            //해당 유저가 기록된 index 구하기
            normal_index = e.Normal.findIndex((s) => s.userid === before_id);
            hard_index = e.Hard.findIndex((s) => s.userid === before_id);

            //만약 기록이 존재하면 닉네임 변경
            //구한 index로 해당 유저에 접근하고 userid 변경
            if (normal_index !== -1) {
                e.Normal[normal_index].userid = new_id;
            }
            if (hard_index !== -1) {
                e.Hard[hard_index].userid = new_id;
            }
            await e.save({ new: true });
        });
        res.status(200).json({ message: `닉네임 변경 ${before_id} => ${new_id}`, code: 200 });
    }

}


//테스트
exports.test = async (req, res, next) => {
    const { email } = req.body;

    try {
        let user = await User.findOne({ email: email });
        let user_stage = await User_stage.findOne({ userid: user.googleid });
        let all_stage = await Stage.find({});
        console.log(user_stage);
        user_stage.stage[0].N_cleartime = 0;
        user_stage.stage[0].N_death = 0;

        user.total_death = 0;
        user.bee_custom = 0;
        user.shot_custom = 0;
        user.badge = 0;



        all_stage.forEach(async e => {

            if (e.stage_name !== '바흐시메이저') {
                console.log("진입");

                var stage = await Stage.findOne({ stage_name: e.stage_name });

                //해당 유저가 기록된 index 구하기
                let normal_index = stage.Normal.findIndex((e) => e.userid === user.googleid);
                if(normal_index!==-1){
                    stage.Normal.splice(normal_index, 1);
                    await stage.save({ new: true });
                }
                
            } else {
                console.log("바흐 시메이저입니다.")
                var stage = await Stage.findOne({ stage_name: e.stage_name });
                //해당 유저가 기록된 index 구하기
                let normal_index = stage.Normal.findIndex((e) => e.userid === user.googleid);

                stage.Normal[normal_index].cleartime = 0;
                stage.Normal[normal_index].renewed_at = '';
                stage.Normal[normal_index].death = 0;

                await stage.save({ new: true });
            }
        })
        user_stage.stage.splice(1, user_stage.stage.length);

        await user_stage.save({ new: true });
        await user.save({ new: true });

        res.status(200).json(user_stage);
    } catch (err) {
        console.log(err);
        res.status(200).send(err);
    }


}

exports.test2 = async (req, res, next) => {
    const {email} = req.body;
    let user = await User.findOne({email:email});
    all_stage_list=[];
    all_user_stage_list = [];

    let all_stage = await Stage.find();
    all_stage.forEach(x=>{
        all_stage_list.push(x.stage_name);

    });

    let all_user_stage = await User_stage.findOne({userid:user.googleid});
    all_user_stage.stage.forEach(x=>{
        all_user_stage_list.push(x.stage_name)
    })


    for(s of all_stage_list){
        if(!all_user_stage_list.find(e => e === s)){
            await Stage.findOneAndUpdate(
                { stage_name: s },
                {
                    $addToSet: {
                        Normal: {
                            userid: user.googleid,
                            cleartime: 0,
                            death: 0,
                            country: user.country,
                            used_bee_custom: 0,
                            used_badge: 0,
                            renewed_at: '',
                            terminated: false,
                        },
                    },
                }, { new: true }).setOptions({ runValidators: true });
        
            await User_stage.findOneAndUpdate(
                { userid: user.googleid },
                {
                    $addToSet: {
                        stage: {
                            stage_name: s,
                            N_cleartime: 0,
                            H_cleartime: 0,
                            N_death: 0,
                            H_death: 0,
                        }
                    }
                },
                { new: true }
            ).setOptions({ runValidators: true });
    
        }

        
    }
    res.status(200).json({});
}

exports.test3 = async (req, res, next) => {


}
