var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var Playing = require("../../../models/playing");

var { ban, delete_playing, get_userid, get_now, get_country_leaderboard, get_global_leaderboard, get_stage_info } = require("../middleware/function");

var { logger, play, userinfo } = require('../../../config/logger');
var { upload } = require('./../../../config/s3_option');



function calculate_leaderboard(array) {
    let no_0_array;

    //클리어 타임이 0이 아닌 랭킹들 필터링   
    no_0_array = array.Normal.filter(it => it.cleartime > 0);

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
        crystal,
        royal_crystal,
        cleartime,
        stage_name,
        result_type,
        used_bee_custom,
        used_badge,
    } = req.body;


    try {
        //만약 playing을 거치지 않고 clear라우터에 접근 시도 시 db접근 거부
        if (!await Playing.exists({ email: email })) {
            res.status(200).json({ message: "잘못된 접근입니다.", status: 'fail' });
        } else {
            //userid 불러오기
            let userid = await get_userid(email);
            //유저 db 갱신
            let user = await User.findOne({ email: email });

            var status;

            //커스텀,뱃지 유효성 체크
            let validation_result = await custom_badge_validation(used_bee_custom, used_badge, user, email);
            //클리어일 경우
            if (result_type === 'clear') {
                let playing = await Playing.findOne({ email: email });
                //부정기록인지 정당한 기록인지 체크
                //부정기록이면 밴
                if ((playing.now_time > cleartime) ? true : false) {
                    console.log("부정기록입니다 해당 유저를 밴 합니다.")
                    try {
                        //밴    
                        await ban(email, '부정기록')
                        //Playing 초기화
                        await delete_playing(email);


                        res.status(200).json({ "now_time": playing.now_time, "cleartime": cleartime, "userid": userid, status: 'banned' });
                        userinfo.info(`유저 ${userid} 밴 됨.`);
                        logger.info(`유저 ${userid} 밴 됨.`);
                    } catch (err) {
                        res.status(500).json({ error: "database failure" });
                        logger.error(`유저 밴 에러: ${userid} ${email} [${err}]`);
                        userinfo.error(`유저 밴 에러: ${userid} ${email} [${err}]`);
                        upload(email, `clear`, err);
                    }

                    //정당한 기록일 시, 유효한 뱃지나 커스텀일 때
                } else if (validation_result) {
                    console.log("정당한 기록입니다. 기록을 저장합니다.")
                    await delete_playing(email);



                    //유저 stage db , stage 모델 갱신
                    let stage = await Stage.findOne({ stage_name: stage_name });





                    //total_clear 갱신
                    await up_crystal(user, crystal, royal_crystal);
                    await user.save({ new: true });
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
                        status = 'first_clear';
                        //클리어타임 갱신
                        stage_select[0].cleartime = cleartime; //Stage 모델 클리어타임 갱신용 (잠시 해제)
                        user_stage.stage[userindex].N_cleartime = cleartime; // user_stage 모델 클리어 타임 갱신용

                        await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                        //랭킹등록 
                        //let stage = await Stage.findOne( { stage_name: stage_name});
                        userindex = stage.Normal.findIndex((s) => s.userid === userid);
                        stage.Normal[userindex].cleartime = cleartime;
                        stage.Normal[userindex].renewed_at = get_now();
                        stage.Normal[userindex].used_bee_custom = used_bee_custom;
                        stage.Normal[userindex].used_badge = used_badge;
                        await stage.save({ new: true });



                        var leaderboardArr = await integrating_leaderboard_arr(stage, userid, user.country);

                        //res.status(200).json({ "status": "clear_renewal_unlock",user_stage:user_stage ,leaderboard: leaderboardArr ,"nextstage_leaderboard":stageArr});
                        logger.info(`${userid} 가 노말 ${stage_name} 첫 클리어.   랭킹 :  기록  : ${cleartime}`);
                        play.info(`${userid} 가 노말 ${stage_name} 첫 클리어.   랭킹 :   기록  : ${cleartime}`);
                    } else { //첫 플레이가 아닐경우(기록 존재)
                        console.log("첫플레이가 아닙니다.");
                        status = 'renewal';
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
                            stage.Normal[userindex].used_bee_custom = used_bee_custom;
                            stage.Normal[userindex].used_badge = used_badge;

                            await stage.save({ new: true }); //신기록 갱신

                            var leaderboardArr = await integrating_leaderboard_arr(stage, userid, user.country);
                            //res.status(200).json({ "status": "clear_renewal", leaderboard: leaderboardArr });

                            logger.info(`${userid} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 :   기록  : ${cleartime}`);
                            play.info(`${userid} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 :   기록  : ${cleartime}`);
                        } else { //기록 갱신 실패했을 경우
                            console.log("기록갱신 실패했습니다.");
                            let stage = await Stage.findOne({ stage_name: stage_name });
                            status = 'clear';

                            var sorted_ranking = calculate_leaderboard(stage);

                            //등수 찾기
                            var ranking = (sorted_ranking.findIndex((s) => s.userid === userid) + 1);
                            console.log("갱신실패 ", previous_cleartime, "초  ", ranking, "등입니다. 현재 초 :", cleartime);

                            //내 바로 다음 랭커 기록 찾기
                            let compare_with_me = sorted_ranking[ranking - 2];
                            console.log(compare_with_me);
                            //스테이지 정보 불러오기
                            var stage_info = await get_stage_info(stage, 'Normal');

                            logger.info(`${userid} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                            play.info(`${userid} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                        }

                    }

                    switch (status) {
                        case 'first_clear': {
                            await renew_stageDB(used_bee_custom, used_badge, user, user_stage);
                            res.status(200).json({ "status": "clear_renewal", user: user, leaderboard: leaderboardArr });
                            break;
                        }
                        case 'renewal': {
                            await renew_stageDB(used_bee_custom, used_badge, user, user_stage);
                            res.status(200).json({ "status": "clear_renewal", user: user, leaderboard: leaderboardArr });
                            break;
                        }
                        case 'clear': {
                            await renew_stageDB(used_bee_custom, used_badge, user, user_stage);
                            res.status(200).json({ "ranking": ranking, user: user, "previous_cleartime": previous_cleartime, "stage_info": stage_info, status: 'clear' });
                            break;
                        }
                        default: break;
                    }

                } else {
                    console.log('커스텀 뱃지 사기입니다. 유저 밴')
                    res.status(200).json({ message: '유효하지 않은 커스텀, 뱃지', status: 'banned' });
                }
            } else { //fail
                try {
                    await delete_playing(email);
                    //User 모델의 death, playtime 갱신
                    
                    let user = await User.findOne({email:email});

                    await up_crystal(user,crystal,royal_crystal);
                    user.total_death++;
                    await user.save({new:true});


                    //user_Stage 모델의 N_death, H_death 갱신
                    let user_stage = await User_stage.findOne({ userid: userid });
                    let stageindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);

                    user_stage.stage[stageindex].N_death++;
                    await user_stage.save({ new: true }); //Normal death 갱신


                    //Stage 모델의 스테이지별 death 갱신
                    let stage = await Stage.findOne({ stage_name: stage_name });

                    //total_death갱신
                    stage.total_death++;

                    var userindex = stage.Normal.findIndex((s) => s.userid === userid);

                    stage.Normal[userindex].death++;  //Normal death 갱신
                    await stage.save({ new: true });
                    res.status(200).json({ status: 'fail', user: user, "total_death": user.total_death, "stage_total_death": stage.total_death, "Normal_death": stage.Normal[userindex].death });
                    logger.info(`${userid} 가 노말 ${stage_name} 실패.`);
                    play.info(`${userid} 가 노말 ${stage_name} 실패.`);

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
        res.status(500).json(err);
        logger.error(`스테이지 clear 에러: ${email} : ${userid} [${err}]`);
        play.error(`스테이지 clear 에러: ${email} : ${userid} [${err}]`);
        upload(email, `clear`, err);
        next(err);
    }






    //Obj랑 Arr 합쳐주는 함수
    async function integrating_leaderboard_arr(stage, userid, country) {
        try {
            let leaderboardObj = {};
            var leaderboardArr = [];

            //스테이지 정보 불러오기
            leaderboardObj.stage_info = await get_stage_info(stage);
            //갱신된 리더보드 불러오기
            leaderboardObj.global_Normal = await get_global_leaderboard(stage, userid);
            leaderboardObj.country_Normal = await get_country_leaderboard(stage, country, userid);
            leaderboardArr.push(leaderboardObj);

            return leaderboardArr;
        } catch (err) {
            console.log(err);
            return err;
        }
    }



    async function up_crystal(user, crystal, royal_crystal) {
        if (crystal && !royal_crystal) {
            user.crystal += crystal; //유저 크리스탈 증가
            await user.save({ new: true });
        } else if (royal_crystal && !crystal) {
            user.royal_crystal += royal_crystal; //유저 로얄크리스탈 증가
            await user.save({ new: true });
        } else {
            user.crystal += crystal; //유저 로얄크리스탈 증가
            user.royal_crystal += royal_crystal; //유저 로얄크리스탈 증가

            await user.save({ new: true });
        }
    }


    //2가지 함수가 더 필요함 
    //  1. 커스텀, 뱃지 유효성 체크
    async function custom_badge_validation(bee_custom, badge, user, email) {
        console.log("커스텀 뱃지 유효성 체크 함수 시작")
        console.log(bee_custom, badge);


        if (user.bee_custom.includes(bee_custom) && user.badge.includes(badge)) {
            console.log('뱃지랑 커스텀 모두 보유중입니다.');
            return true;
        } else {
            console.log('뱃지랑 커스텀 중 보유중인게 없습니다.')
            await ban(email, '뱃지커스텀 사기');
            return false;
        }
    }

    //  2. 클리어 할 때 유저가 보유중인 모든 스테이지 used_custom, used_badge 갱신하는 함수
    async function renew_stageDB(bee_custom, badge, user, user_stage) {
        console.log("스테이지 커스텀 통일 함수 실행")


        //만약 이미 다 통일 돼있는데 계속 바꾸면 낭비니까
        // 바흐시메이저일 경우는 .index +1
        // 나머지 곡일 경우는 index -1 해서 해당 스테이지들 used_bee_custom 비교를 하고
        // 같으면 내비두고 다르면 수정하도록 변경



        let user_stage_arr = [];

        for (i = 0; i < user_stage.stage.length; i++) {
            user_stage_arr.push(user_stage.stage[i].stage_name);
        }
        console.log(user_stage_arr.length);
        if (user_stage_arr.length === 1) { //바흐시메이저 밖에없다.
            renew_db(user_stage_arr, user, bee_custom, badge);
        } else { //곡이 여러개가 있다.
            let check_stage = await Stage.findOne({ stage_name: '바흐시메이저' });

            let normal_index = check_stage.Normal.findIndex((e) => e.userid === user.googleid);
            let used_bee_custom = check_stage.Normal[normal_index].used_bee_custom;
            let used_badge = check_stage.Normal[normal_index].used_badge

            if (bee_custom === used_bee_custom && badge === used_badge) { //다 같아서 수정할 필요가 없다.
                console.log("갱신할 필요가 없음");
                return
            } else if (bee_custom !== used_bee_custom && badge === used_badge) {
                renew_db(user_stage_arr, user, bee_custom);
            } else if (bee_custom === used_bee_custom && badge !== used_badge) {
                renew_db(user_stage_arr, user, null, badge);
            } else {
                renew_db(user_stage_arr, user, bee_custom, badge);
            }

        }

    }

    async function renew_db(user_stage_arr, user, bee_custom, badge) {


        if (bee_custom && !badge) {
            console.log('renew_db 1');
            for (e of user_stage_arr) {
                var stage = await Stage.findOne({ stage_name: e });
                //해당 유저가 기록된 index 구하기
                let normal_index = stage.Normal.findIndex((e) => e.userid === user.googleid);
                stage.Normal[normal_index].used_bee_custom = bee_custom;

                await stage.save({ new: true });
            }
        } else if (badge && !bee_custom) {
            console.log('renew_db 2');
            for (e of user_stage_arr) {
                var stage = await Stage.findOne({ stage_name: e });
                //해당 유저가 기록된 index 구하기
                let normal_index = stage.Normal.findIndex((e) => e.userid === user.googleid);
                stage.Normal[normal_index].used_badge = badge;

                await stage.save({ new: true });
            }
        } else {
            console.log('renew_db 3');
            for (e of user_stage_arr) {
                var stage = await Stage.findOne({ stage_name: e });
                //해당 유저가 기록된 index 구하기
                let normal_index = stage.Normal.findIndex((e) => e.userid === user.googleid);

                stage.Normal[normal_index].used_bee_custom = bee_custom;
                stage.Normal[normal_index].used_badge = badge;



                await stage.save({ new: true });
            }
        }
    }

}


