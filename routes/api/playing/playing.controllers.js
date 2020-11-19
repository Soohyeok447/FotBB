//게임 중 지속적으로 데이터를 받음(now_time) → 저장돼있는 now_time과 비교해서 어이없는 데이터가 들어오면 
//유저 모든 db terminate화, 밴처리를 한다. → 그리고 클리어시에도 비교


var Playing = require("../../../models/playing");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");
var User = require("../../../models/user");

var { ban, delete_playing, get_userid, get_now } = require("../middleware/function");

var { logger, userinfo } = require('../../../config/logger');
var { upload } = require('./../../../config/s3_option');

var midi_info = require('../../../src/midi_info.json');
//플레이 중 데이터 변조 체크
exports.check_modulation = async (req, res, next) => {
    const { email, now_time, start, stage_name, midi_request } = req.body //gametype에 따라 구분해야한다면 나중에 수정

    try {

        let user = await User.findOne({ email });
        if (user === null) {
            throw new Error('존재하지 않는 유저');
        }
        let user_stage = await User_stage.findOne({ userid: user.googleid });
        let check_has_stage = user_stage.stage.findIndex(s => s.stage_name === stage_name);

        if (start) {
            await up_playcount(stage_name);

            let check_duplicate = await Playing.exists({ email: email })
            if (check_duplicate) {  // 해킹이나 버그로 start=true가 또 오거나
                await check_Stage_DB(user, stage_name, check_has_stage);
                await delete_playing(email); //playing DB 초기화
                var user_playing = new Playing({
                    userid: user.googleid,
                    email: email,
                    now_time: now_time,
                    start_at: get_now(),
                    stage_name: stage_name
                });
                //playing모델에 id,now_time 필드 등록
                await user_playing.save({ new: true });
                if (midi_request) {
                    let midi_info_ = midi_info[stage_name];
                    res.status(200).json({ message: '새로운 시작.', midi_info: midi_info_ });
                } else {
                    res.status(200).json({ message: '플레이 시작.' });
                }
            } else {  //진짜 첫 플레이이면
                if (check_has_stage === -1) { //보유중이지 않은 스테이지면

                    res.status(200).json({ error: `보유중이지 않은 스테이지 ${stage_name} playing 시도` })


                } else { //보유중인 스테이지면
                    await check_Stage_DB(user, stage_name, check_has_stage);
                    console.log("start 진입했어요");
                    await delete_playing(email); //playing DB 초기화
                    var user_playing = new Playing({
                        userid: user.googleid,
                        email: email,
                        now_time: now_time,
                        start_at: get_now(),
                        stage_name: stage_name
                    });
                    //playing모델에 id,now_time 필드 등록
                    await user_playing.save({ new: true });

                    if (midi_request) {
                        let midi_info_ = midi_info[stage_name];
                        res.status(200).json({ message: '플레이 시작.', midi_info: midi_info_ });
                    } else {
                        res.status(200).json({ message: '플레이 시작.' });
                    }
                }
                
            }
            //start 가 false일 때,
        } else {
            let check = await Playing.findOne({ email: email });
            if(check===null){
                res.status(200).json({ message: "잘못된 접근입니다." })
            }else {
                console.log("이전 기록과 비교를 해야합니다.")
                //id로 해당 유저 찾고

                //그리고 이전 now_time이랑 비교
                let check_result = (check.now_time >= now_time) ? true : false;
                //만약 저장된 now_time보다 적은 time이면 (사기 기록이면)
                if (check_result) {
                    console.log("이 사람 사기 친다")

                    //밴 , playing 모델에서 필드 삭제
                    ban(user,email ,'부정기록');
                    await delete_playing(email);

                    res.status(200).json({ "previous_time": check.now_time, "now_time": now_time, "banned": true, "userid": userid });


                    userinfo.info(`유저 ${userid} 밴 됨.`);
                    logger.info(`유저 ${userid} 밴 됨.`);
                } else {
                    console.log("유효한 기록이므로 저장합니다.")
                    //아니면 now_time갱신
                    check.now_time = now_time;
                    check.save({new:true});

                    res.status(200).json({ "now_time": now_time, "validation": "true" });


                }
            }
        }

    } catch (err) {
        let id = await get_userid(email);
        console.log('에러 발생');

        res.status(500).json({ error: `${err}` });


        logger.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
        userinfo.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
        upload(email, 'playing', err);
        next(err);
    }
}



async function up_playcount(stage_name) {
    // 스테이지 플레이 횟수 증가
    let selected_stage = await Stage.findOne({ stage_name });
    selected_stage.playcount++;
    await selected_stage.save({ new: true });
}

async function check_Stage_DB(user, stage_name, check_has_stage) {
    console.log('함수 진입');
    let stage = await Stage.findOne({ stage_name: stage_name });
    let stage_idx = stage.Normal.findIndex((e) => e.userid === user.googleid);

    console.log(stage_idx);
    console.log(check_has_stage);
    if (stage_idx === -1 && check_has_stage !== -1) { //user_stage에는 보유중인데 stageDB에는 없을 때(오류로 언락이 안됐을 때)
        console.log("DB저장이 잘 안됐습니다. 새로 추가합니다.")

        let stageObj = await Stage.findOne({ stage_name: '바흐시메이저' });
        let idx = stageObj.Normal.findIndex((e) => e.userid === user.googleid);
        let used_bee_custom = stageObj.Normal[idx].used_bee_custom;
        let used_badge = stageObj.Normal[idx].used_badge;

        await Stage.findOneAndUpdate(
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
    }
}