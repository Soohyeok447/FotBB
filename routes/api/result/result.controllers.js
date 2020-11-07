var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var Playing = require("../../../models/playing");

var { ban, delete_playing, get_userid, get_now, get_country_leaderboard, get_global_leaderboard, get_stage_info } = require("../middleware/function");

var { logger, play, userinfo } = require('../../../config/logger');
var { upload } = require('./../../../config/s3_option');

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
            upload('', 'clear | token', `no email`);
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
            upload(email, 'clear | token', `accessToken error`);
            return TokenObj;
        } else {
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email, 'clear | token', `accessToken error`);
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

        logger.error(`${id}- ${email} : ${err}`);
        upload(email, `clear | token`, err);
        return TokenObj;
    }
}

////////////////////////////////////////////         

function calculate_leaderboard(array, type) {
    let no_0_array;

    //클리어 타임이 0이 아닌 랭킹들 필터링   
    switch (type) {
        case 'Normal':
            //console.log("노말입니다잉")
            no_0_array = array.Normal.filter(it => it.cleartime > 0);
            break;
        case 'Hard':
            //console.log("하드입니다잉")
            no_0_array = array.Hard.filter(it => it.cleartime > 0);
            break;
        default:
            //console.log("그럴리는 없겠지만 잘못된 타입이 들어왔습니다.")
            break;
    }



    //terminated된 기록들 필터링
    let no_terminated_array = no_0_array.filter(e => e.terminated === !true);

    // cleartime 기준으로 정렬
    let sorted_ranking = no_terminated_array.sort((a, b) => {
        if (a.cleartime > b.cleartime) {
            return 1;
        }
        if (a.cleartime < b.cleartime) {
            return -1;
        }
        // 동률
        return 0;
    });

    return sorted_ranking
}
////////////////////////////////////////////         


//클리어 시
exports.result = async (req, res, next) => {
    const {
        email,
        get_crystal,
        cleartime,
        gametype,
        token,
        stage_name,
        country,
        nextstage,
        result,
    } = req.body;

    //유효한 토큰이면 api 이용
    var verify_result = await verify(token, email)
    if (verify_result.verified) {
        try {
            //만약 playing을 거치지 않고 clear라우터에 접근 시도 시 db접근 거부
            if (!await Playing.exists({ email: email })) {
                res.status(200).json({ message: "잘못된 접근입니다.", status: 'fail' });
            } else {
                //userid 불러오기
                let userid = await get_userid(email);

                //클리어일 경우
                if (result === 'clear') {
                    let playing = await Playing.findOne({ email: email });
                    //부정기록인지 정당한 기록인지 체크
                    //부정기록이면 밴
                    if ((playing.now_time > cleartime) ? true : false) {
                        console.log("부정기록입니다 해당 유저를 밴 합니다.")
                        try {
                            //밴    
                            ban(email, '부정기록')
                            //Playing 초기화
                            delete_playing(email);


                            res.status(200).json({ "now_time": playing.now_time, "cleartime": cleartime, "userid": userid, status: 'banned' });
                            userinfo.info(`유저 ${userid} 밴 됨.`);
                            logger.info(`유저 ${userid} 밴 됨.`);
                        } catch (err) {
                            res.status(500).json({ error: "database failure" });
                            logger.error(`유저 밴 에러: ${userid} ${email} [${err}]`);
                            userinfo.error(`유저 밴 에러: ${userid} ${email} [${err}]`);
                            upload(email, `clear`, err);
                        }

                        //정당한 기록일 시
                    } else {
                        console.log("정당한 기록입니다. 기록을 저장합니다.")
                        await delete_playing(email);
                        //유저 db 갱신
                        let user = await User.findOneAndUpdate(
                            { email: email },
                            {
                                $inc: {
                                    crystal: get_crystal,
                                },
                            },
                            { new: true }
                        ).setOptions({ runValidators: true });

                        //다음 스테이지 언락  (유니티에서 처리 가능해보임) 
                        //처리가 가능하다면 true false 여부만 판단해서 스테이지등록
                        let user_stage = await User_stage.findOne({ userid: userid });
                        let has_stage = (user_stage.stage.filter(s => s.stage_name === nextstage));
                        if (has_stage.length === 0 && user_stage.userid) {  //user_stage 모델에서 해당 스테이지를 찾지 못했을 때
                            console.log("없는 스테이지 입니다.");
                            //user_stage 모델 배열에 스테이지 추가
                            await User_stage.findOneAndUpdate(
                                { userid: userid },
                                {
                                    $addToSet: {
                                        stage: {
                                            stage_name: nextstage,
                                            N_cleartime: 0,
                                            H_cleartime: 0,
                                            N_death: 0,
                                            H_death: 0,
                                        }
                                    }
                                },
                                { new: true }
                            ).setOptions({ runValidators: true });

                            //stage 모델 배열에 유저추가
                            let next_stage = await Stage.findOneAndUpdate(
                                { stage_name: nextstage },
                                {
                                    $addToSet: {
                                        Normal: {
                                            userid: userid,
                                            cleartime: 0,
                                            death: 0,
                                            country: country,
                                            renewed_at: '',
                                            terminated: false,
                                        },
                                        Hard: {
                                            userid: userid,
                                            cleartime: 0,
                                            death: 0,
                                            country: country,
                                            renewed_at: '',
                                            terminated: false,
                                        },
                                    },
                                }, { new: true }).setOptions({ runValidators: true });
                            
                            
                               //언락 후 해당 스테이지 리더보드 동기화
                                var stageObj ={};
                                stageObj.global_Normal = await get_global_leaderboard(next_stage,email,"Normal");
                                stageObj.global_Hard = await get_global_leaderboard(next_stage,email,"Hard");

                                stageObj.country_Normal = await get_country_leaderboard(next_stage,email,user.country,"Normal");
                                stageObj.country_Hard = await get_country_leaderboard(next_stage,email,user.country,"Hard");

                                stageObj.stage_info = await get_stage_info(next_stage);
                        } else {
                            console.log("있는 스테이지 거나 보유중인 스테이지가 아닙니다.");
                        }


                        //유저 stage db , stage 모델 갱신
                        let stage = await Stage.findOne({ stage_name: stage_name });



                        if (gametype === "Normal") {
                            console.log("Normal 진입");
                            let type = 'Normal'
                            //total_clear 갱신
                            stage.total_clear++;

                            //이전 클리어타임 확인용
                            let stage_select = stage.Normal.filter( //stage_name으로 stage 선택
                                (s) => s.userid === userid
                            );
                            //console.log(stage_select);
                            let previous_cleartime = stage_select[0].cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수




                            //user_stage 모델에 Normal클리어타임 갱신
                            let user_stage = await User_stage.findOne({ userid: userid });
                            let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);


                            //(기본 로직)
                            //랭킹등록 -> 등수와 클리어타임 반환
                            //첫 플레이일 경우,
                            if (previous_cleartime === 0) {
                                console.log("첫 랭킹 등록");

                                //클리어타임 갱신
                                stage_select[0].cleartime = cleartime; //Stage 모델 클리어타임 갱신용 (잠시 해제)
                                user_stage.stage[userindex].N_cleartime = cleartime; // user_stage 모델 클리어 타임 갱신용

                                await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                                //랭킹등록 
                                //let stage = await Stage.findOne( { stage_name: stage_name});
                                userindex = stage.Normal.findIndex((s) => s.userid === userid);
                                stage.Normal[userindex].cleartime = cleartime;
                                stage.Normal[userindex].renewed_at = get_now();
                                await stage.save({ new: true });


                                //갱신된 리더보드 불러오기
                                let global_leaderboard = await get_global_leaderboard(stage, email, 'Normal');
                                let country_leaderboard = await get_country_leaderboard(stage, email, user.country, 'Normal');
                                //스테이지 정보 불러오기
                                let stage_info = await get_stage_info(stage);

                                await res.status(200).json({ "status": "clear_renewal", "stage_info": stage_info, "global_leaderboard": global_leaderboard, "country_leaderboard": country_leaderboard , "nextstage_leaderboard":stageObj});

                                logger.info(`${userid} 가 노말 ${stage_name} 첫 클리어.   랭킹 : ${global_leaderboard.total_Normal_ranking}  기록  : ${cleartime}`);
                                play.info(`${userid} 가 노말 ${stage_name} 첫 클리어.   랭킹 : ${global_leaderboard.total_Normal_ranking}  기록  : ${cleartime}`);
                            } else { //첫 플레이가 아닐경우(기록 존재)
                                console.log("첫플레이가 아닙니다.");
                                //이제 기록 갱신과 갱신이 아닌경우 처리
                                console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)

                                await stage.save({ new: true }); //stage 모델에 cleartime 갱신

                                if (previous_cleartime > cleartime) {  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                                    console.log("기록 갱신 성공");

                                    //user_stage 모델에 Normal클리어타임 갱신
                                    let user_stage = await User_stage.findOne({ userid: userid });
                                    let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                                    //console.log(stage.Normal[userindex])
                                    user_stage.stage[userindex].N_cleartime = cleartime;

                                    await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                                    //랭킹등록 
                                    let stage = await Stage.findOne({ stage_name: stage_name });
                                    userindex = stage.Normal.findIndex((s) => s.userid === userid);
                                    //console.log(stage.Normal[userindex])
                                    stage.Normal[userindex].cleartime = cleartime;
                                    stage.Normal[userindex].renewed_at = get_now();

                                    await stage.save({ new: true }); //신기록 갱신


                                    //갱신된 리더보드 불러오기
                                    let global_leaderboard = await get_global_leaderboard(stage, email, 'Normal');
                                    let country_leaderboard = await get_country_leaderboard(stage, email, user.country, 'Normal');
                                    //스테이지 정보 불러오기
                                    let stage_info = await get_stage_info(stage);

                                    await res.status(200).json({ "status": "clear_renewal", "stage_info": stage_info, "global_leaderboard": global_leaderboard, "country_leaderboard": country_leaderboard });

                                    logger.info(`${userid} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 : ${global_leaderboard.total_Normal_ranking}  기록  : ${cleartime}`);
                                    play.info(`${userid} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 : ${global_leaderboard.total_Normal_ranking}  기록  : ${cleartime}`);
                                } else { //기록 갱신 실패했을 경우
                                    console.log("기록갱신 실패했습니다.");
                                    let stage = await Stage.findOne({ stage_name: stage_name });


                                    var sorted_ranking = calculate_leaderboard(stage, type);

                                    //등수 찾기
                                    let ranking = (sorted_ranking.findIndex((s) => s.userid === userid) + 1);
                                    console.log("갱신실패 ", previous_cleartime, "초  ", ranking, "등입니다. 현재 초 :", cleartime);

                                    //내 바로 다음 랭커 기록 찾기
                                    let compare_with_me = sorted_ranking[ranking - 2];
                                    console.log(compare_with_me);
                                    //스테이지 정보 불러오기
                                    let stage_info = await get_stage_info(stage);


                                    if (compare_with_me < 0) {
                                        console.log("1등입니다.")
                                        res.status(200).json({ "ranking": ranking, "previous_cleartime": previous_cleartime, "stage_info": stage_info, status: 'clear' });
                                    } else { //1등이 아니면 바로 윗 랭크 기록 반환
                                        res.status(200).json({ "ranking": ranking, "previous_cleartime": previous_cleartime, "stage_info": stage_info, status: 'clear' });
                                    }
                                    logger.info(`${userid} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                                    play.info(`${userid} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                                }
                            }
                        } else { //Hard
                            var type = 'Hard';
                            console.log("Hard 진입");

                            //total_clear 갱신
                            stage.total_clear++;
                            //let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기

                            //stage 모델에 Hard 클리어 타임 갱신
                            let stage_select = stage.Hard.filter( //stage_name으로 stage 선택
                                (s) => s.userid === userid
                            );
                            let previous_cleartime = stage_select[0].cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수


                            //user_stage 모델에 Hard클리어타임 갱신
                            let user_stage = await User_stage.findOne({ userid: userid });
                            let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                            //console.log(stage.Normal[userindex])
                            await stage.save({ new: true });



                            //첫 플레이일 경우,
                            if (previous_cleartime === 0) {
                                console.log("첫 랭킹 등록");

                                //클리어 타임 갱신
                                user_stage.stage[userindex].H_cleartime = cleartime; //user_stage 모델 클리어 타임 갱신용
                                stage_select[0].cleartime = cleartime; //stage 모델 클리어타임 갱신용 (잠시 해제)

                                await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신



                                //let stage = await Stage.findOne( { stage_name: stage_name});
                                userindex = stage.Hard.findIndex((s) => s.userid === userid);
                                //console.log(stage.Normal[userindex])
                                stage.Hard[userindex].cleartime = cleartime;
                                stage.Hard[userindex].renewed_at = get_now();

                                await stage.save({ new: true });


                                //갱신된 리더보드 불러오기
                                let global_leaderboard = await get_global_leaderboard(stage, email, 'Hard');
                                let country_leaderboard = await get_country_leaderboard(stage, email, user.country, 'Hard');
                                //스테이지 정보 불러오기
                                let stage_info = await get_stage_info(stage);



                                logger.info(`${userid} 가 하드 ${stage_name} 첫 클리어.   랭킹 : ${global_leaderboard.total_hard_ranking}  기록  : ${cleartime}`);
                                play.info(`${userid} 가 하드 ${stage_name} 첫 클리어.   랭킹 : ${global_leaderboard.total_hard_ranking}  기록  : ${cleartime}`);
                                res.status(200).json({ "status": "clear_renewal", "stage_info": stage_info, "global_leaderboard": global_leaderboard, "country_leaderboard": country_leaderboard ,"nextstage_leaderboard":stageObj });
                            } else { //첫 플레이가 아닐경우(기록 존재)
                                console.log("첫플레이가 아닙니다.");
                                //이제 기록 갱신과 갱신이 아닌경우 처리
                                console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)



                                if (previous_cleartime > cleartime) {  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                                    console.log("기록 갱신 성공");

                                    //user_stage 모델에 Hard클리어타임 갱신
                                    let user_stage = await User_stage.findOne({ userid: userid });
                                    let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                                    //console.log(stage.Normal[userindex])
                                    user_stage.stage[userindex].H_cleartime = cleartime;

                                    await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신


                                    //랭킹등록 
                                    //let stage = await Stage.findOne( { stage_name: stage_name});
                                    userindex = stage.Hard.findIndex((s) => s.userid === userid);
                                    //console.log(stage.Hard[userindex])
                                    stage.Hard[userindex].cleartime = cleartime;
                                    stage.Hard[userindex].renewed_at = get_now();
                                    await stage.save({ new: true }); //신기록 갱신


                                    //갱신된 리더보드 불러오기
                                    let global_leaderboard = await get_global_leaderboard(stage, email, 'Hard');
                                    let country_leaderboard = await get_country_leaderboard(stage, email, user.country, 'Hard');
                                    //스테이지 정보 불러오기
                                    let stage_info = await get_stage_info(stage);


                                    logger.info(`${userid} 가 하드 ${stage_name} 클리어.(갱신)   랭킹 : ${global_leaderboard.total_hard_ranking}  기록  : ${cleartime}`);
                                    play.info(`${userid} 가 하드 ${stage_name} 클리어.(갱신)   랭킹 : ${global_leaderboard.total_hard_ranking}  기록  : ${cleartime}`);

                                    res.status(200).json({ "status": "clear_renewal", "stage_info": stage_info, "global_leaderboard": global_leaderboard, "country_leaderboard": country_leaderboard });

                                } else { //기록 갱신 실패했을 경우
                                    console.log("기록갱신 실패했습니다.");
                                    let stage = await Stage.findOne({ stage_name: stage_name });

                                    var sorted_ranking = calculate_leaderboard(stage, type);


                                    //등수 찾기
                                    let ranking = (sorted_ranking.findIndex((s) => s.userid === userid) + 1);
                                    console.log("갱신실패 ", previous_cleartime, "초  ", ranking, "등입니다. 현재 초 :", cleartime);

                                    //내 바로 다음 랭커 기록 찾기
                                    let compare_with_me = (sorted_ranking[ranking - 2]);
                                    //스테이지 정보 불러오기
                                    let stage_info = await get_stage_info(stage);
                                    if (compare_with_me < 0) {
                                        console.log("1등입니다.")
                                        res.status(200).json({ "ranking": ranking, "previous_cleartime": previous_cleartime, "stage_info": stage_info, status: 'clear' });
                                    } else { //1등이 아니면 바로 윗 랭크 기록 반환
                                        res.status(200).json({ "ranking": ranking, "previous_cleartime": previous_cleartime, "stage_info": stage_info, status: 'clear' });
                                    }

                                    logger.info(`${userid} 가 하드 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                                    play.info(`${userid} 가 하드 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                                }
                            }
                        }
                    }
                } else {
                    try {
                        delete_playing(email);
                        //User 모델의 death, playtime 갱신
                        let user = await User.findOneAndUpdate(
                            { email: email },
                            { $inc: { crystal: get_crystal, total_death: 1 } },
                            { new: true }
                        ).setOptions({ runValidators: true });


                        //user_Stage 모델의 N_death, H_death 갱신
                        let user_stage = await User_stage.findOne({ userid: userid });
                        let stageindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                        if (gametype === "Normal") { //Normal
                            user_stage.stage[stageindex].N_death++;
                            await user_stage.save({ new: true }); //Normal death 갱신

                        } else { //Hard
                            user_stage.stage[stageindex].H_death++;
                            await user_stage.save({ new: true }); //Hard death 갱신
                        }




                        //Stage 모델의 스테이지별 death 갱신
                        let stage = await Stage.findOne({ stage_name: stage_name });

                        //total_death갱신
                        stage.total_death++;

                        if (gametype === "Normal") { //Normal
                            var userindex = stage.Normal.findIndex((s) => s.userid === userid);

                            stage.Normal[userindex].death++;  //Normal death 갱신
                            await stage.save({ new: true });
                            res.status(200).json({ "total_death": user.total_death, "stage_total_death": stage.total_death, "Normal_death": stage.Normal[userindex].death });
                            logger.info(`${userid} 가 노말 ${stage_name} 실패.`);
                            play.info(`${userid} 가 노말 ${stage_name} 실패.`);
                        } else { //Hard
                            var userindex = stage.Hard.findIndex((s) => s.userid === userid);

                            stage.Hard[userindex].death++;
                            await stage.save({ new: true }); //Hard death 갱신
                            res.status(200).json({ "total_death": user.total_death, "stage_total_death": stage.total_death, "Hard_death": stage.Hard[userindex].death });
                            logger.info(`${userid} 가 하드 ${stage_name} 실패.`);
                            play.info(`${userid} 가 하드 ${stage_name} 실패.`);
                        }
                    } catch (err) {
                        res.status(500).json({ error: "database failure" });
                        logger.error(`스테이지 fail 에러: ${userid} [${err}]`);
                        play.error(`스테이지 fail 에러: ${userid} [${err}]`);
                        upload(email, `fail`, err);
                        next(err);
                    }
                }
            }
        } catch (err) {
            let userid = await get_userid(email);
            res.status(500).json({ error: err });
            logger.error(`스테이지 clear 에러: ${email} : ${userid} [${err}]`);
            play.error(`스테이지 clear 에러: ${email} : ${userid} [${err}]`);
            upload(email, `clear`, err);
            next(err);
        }
    } else {
        res.status(500).json({ "message": "Token error", "error": `${verify_result.error}` });
    }
}