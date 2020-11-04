require('dotenv').config();

var Playing = require("../../../models/playing");
var Banned = require("../../../models/banned");

var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");



// 밴용 moment
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");




//밴
async function ban(email, reason) {
    let day_format = 'YYYY.MM.DD HH:mm:ss';
    let now = moment().format(day_format);

    try {
        let userid = await get_userid(email);
        //밴
        //banned에 userid 추가
        var user = new Banned({
            userid: userid,
            email: email,
            banned_at: now,
            reason: reason,
        });
        await user.save({ new: true });



        ///////////terminate
        //해당유저가 보유중인 스테이지 목록 문자열 배열화
        var result = await User_stage.findOne({ userid: userid })
        var banned_user_arr = [];
        result.stage.forEach(e => {
            banned_user_arr.push(e.stage_name);
        });


        //스테이지 목록 배열을 이용해서 stage모델에 접근 후 terminated 박아버리기
        banned_user_arr.forEach(async e => {
            try {
                let stage = await Stage.findOne({ stage_name: e });
                let banned_user_stage_N = stage.Normal.find(n => n.userid === userid);
                let banned_user_stage_H = stage.Hard.find(n => n.userid === userid);
                banned_user_stage_N.terminated = false;
                banned_user_stage_H.terminated = false;
                await stage.save({ new: true });
            } catch (err) {
                console.log(err);
            }
        })
    } catch (err) {
        console.log("에러발생")
        console.log(err);
    }
}


//playing모델 해당 유저 필드 삭제
async function delete_playing(email) {

    await Playing.findOneAndRemove(
        { email: email },
        { new: true }
    ).setOptions({ runValidators: true });
}

//userid getter
async function get_userid(email) {
    let user = await User.findOne({ email: email });
    if (user === null) {
        console.log("이메일이 없습니다.")
        return null;
    } else {
        let id = user.googleid;
        return id;
    }
    // 주의!!!!!!!!!!
    //이 함수 사용할 때 await 붙여야함
}

//(moment) now getter
function get_now() {
    //moment format
    let day = new Date();
    let day_format = 'YYYY.MM.DD HH:mm:ss';
    let now = moment(day).format(day_format);
    return now;
}




/*
    리더보드 관련
*/
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

async function check_record(stage, email, type) {
    let userid = await get_userid(email);
    switch (type) {
        case "Normal": {
            let user_index = stage.Normal.findIndex((s) => s.userid === userid) + 1
            if (stage.Normal[user_index].cleartime === 0) { //플레이기록이 있으면
                console.log("플레이 기록이 없습니다.")
                return false;

            } else { //플레이 기록이 없으면
                console.log("플레이 기록이 있습니다.")
                return true;
            }
        }
        case "Hard": {
            let user_index = stage.Hard.findIndex((s) => s.userid === userid) + 1
            if (stage.Hard[user_index].cleartime === 0) { //플레이기록이 있으면
                return false;
            } else { //플레이 기록이 없으면
                return true;
            }
        }
        default: return false;
    }
}

async function get_global_leaderboard(stage, email, type) {
    const jsonObj = {};

    var userid = await get_userid(email);

    if (type) { //clear API에서 사용
        switch (type) {
            case "Normal": {

                let sorted_Total_Normal_ranking = calculate_leaderboard(stage, 'Normal')

                //1등부터 50등 까지 반환
                let sliced_total_Normal_array = sorted_Total_Normal_ranking.slice(0, 50);
                //내 등수 불러오기
                let my_total_Normal_ranking = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid) + 1

                //내 라이벌 등수 불러오기
                if (my_total_Normal_ranking === 0) { //내가 1등이면
                    var my_rival_Normal = null;
                } else {//1등이 아니면
                    let my_rival_Normal_index = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid);
                    var my_rival_Normal = sorted_Total_Normal_ranking[my_rival_Normal_index - 1];
                }


                jsonObj.total_Normal_leaderboard = sliced_total_Normal_array;
                jsonObj.total_Normal_my_ranking = my_total_Normal_ranking;
                jsonObj.total_Normal_rival = my_rival_Normal;

                return jsonObj;

            }
            case "Hard": {

                let sorted_Total_Hard_ranking = calculate_leaderboard(stage, 'Hard')

                //1등부터 50등 까지 반환
                let sliced_total_Hard_array = sorted_Total_Hard_ranking.slice(0, 50);
                //내 등수 불러오기
                let my_total_Hard_ranking = sorted_Total_Hard_ranking.findIndex((s) => s.userid === userid) + 1

                //내 라이벌 등수 불러오기
                if (my_total_Hard_ranking === 0) { //내가 1등이면
                    var my_rival_Hard = null;
                } else {//1등이 아니면
                    let my_rival_Hard_index = sorted_Total_Hard_ranking.findIndex((s) => s.userid === userid);
                    var my_rival_Hard = sorted_Total_Hard_ranking[my_rival_Hard_index - 1];

                }


                jsonObj.total_Hard_leaderboard = sliced_total_Hard_array;
                jsonObj.total_Hard_my_ranking = my_total_Hard_ranking;
                jsonObj.total_Hard_rival = my_rival_Hard;

                return jsonObj;

            }
            default: return "오류";
        }
    } else { //그냥 스테이지 불러오기
        console.log("그냥 스테이지 전부 불러오기");
        let sorted_Total_Normal_ranking = calculate_leaderboard(stage, 'Normal')
        let sorted_Total_Hard_ranking = calculate_leaderboard(stage, 'Hard')


        //1등부터 50등 까지 반환
        let sliced_total_Normal_array = sorted_Total_Normal_ranking.slice(0, 50);
        let sliced_total_Hard_array = sorted_Total_Hard_ranking.slice(0, 50);

        //내 등수 불러오기
        let my_total_Normal_ranking = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid) + 1
        let my_total_Hard_ranking = sorted_Total_Hard_ranking.findIndex((s) => s.userid === userid) + 1

        //내 라이벌 등수 불러오기 (노말)
        if (my_total_Normal_ranking === 0) { //내가 1등이면
            var my_rival_Normal = null;
        } else {//1등이 아니면
            let my_rival_Normal_index = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid);
            var my_rival_Normal = sorted_Total_Normal_ranking[my_rival_Normal_index - 1];
        }

        //내 라이벌 등수 불러오기 (하드)
        if (my_total_Hard_ranking === 0) { //내가 1등이면
            var my_rival_Hard = null;
        } else {//1등이 아니면
            let my_rival_Hard_index = sorted_Total_Hard_ranking.findIndex((s) => s.userid === userid);
            var my_rival_Hard = sorted_Total_Hard_ranking[my_rival_Hard_index - 1];

        }




        jsonObj.total_Normal_leaderboard = sliced_total_Normal_array;
        jsonObj.total_Normal_ranking = my_total_Normal_ranking;
        jsonObj.total_Normal_rival = my_rival_Normal;
        jsonObj.total_Hard_leaderboard = sliced_total_Hard_array;
        jsonObj.total_Hard_ranking = my_total_Hard_ranking;
        jsonObj.total_Hard_rival = my_rival_Hard;


        return jsonObj;
    }


}

async function get_country_leaderboard(stage, email, country, type) {
    const jsonObj = {};



    let userid = await get_userid(email);


    if (type) { //clear API에서 사용
        switch (type) {
            case "Normal": {



                let sorted_Total_Normal_ranking = calculate_leaderboard(stage, 'Normal')
                //국가 필터링
                let Normal_country_filter = sorted_Total_Normal_ranking.filter(it => it.country === country);

                //1등부터 50등 까지 반환
                let sliced_country_Normal_array = Normal_country_filter.slice(0, 50);
                //내 등수 불러오기
                let my_country_Normal_ranking = Normal_country_filter.findIndex((s) => s.userid === userid) + 1

                //내 라이벌 등수 불러오기
                if (my_country_Normal_ranking === 0) { //내가 1등이면
                    var my_rival_Normal = null;
                } else {//1등이 아니면
                    let my_rival_Normal_index = Normal_country_filter.findIndex((s) => s.userid === userid);
                    var my_rival_Normal = Normal_country_filter[my_rival_Normal_index - 1];
                }

                jsonObj.country_Normal_leaderboard = sliced_country_Normal_array;
                jsonObj.country_Normal_my_ranking = my_country_Normal_ranking;
                jsonObj.country_Normal_rival = my_rival_Normal;

                return jsonObj;

            }
            case "Hard": {

                let sorted_Total_Hard_ranking = calculate_leaderboard(stage, 'Hard')
                //국가 필터링
                let Hard_country_filter = sorted_Total_Hard_ranking.filter(it => it.country === country);

                //1등부터 50등 까지 반환
                let sliced_country_Hard_array = Hard_country_filter.slice(0, 50);
                //내 등수 불러오기
                let my_country_Hard_ranking = Hard_country_filter.findIndex((s) => s.userid === userid) + 1
                //내 라이벌 정보불러오기
                if (my_country_Hard_ranking === 0) { //내가 1등이면
                    var my_rival_Hard = null;
                } else {//1등이 아니면
                    var my_rival_Hard_index = Hard_country_filter.findIndex((s) => s.userid === userid);
                    var my_rival_Hard = Hard_country_filter[my_rival_Hard_index - 1];
                }

                jsonObj.country_Hard_leaderboard = sliced_country_Hard_array;
                jsonObj.country_Hard_my_ranking = my_country_Hard_ranking;
                jsonObj.country_Hard_rival = my_rival_Hard;

                return jsonObj;

            }
            default: return "오류";
        }
    } else { //그냥 스테이지 불러오기
        console.log("전체 스테이지 불러오기")
        let sorted_Total_Normal_ranking = calculate_leaderboard(stage, 'Normal')
        let sorted_Total_Hard_ranking = calculate_leaderboard(stage, 'Hard')


        //국가 랭킹
        //국가 필터링
        let Normal_country_filter = sorted_Total_Normal_ranking.filter(it => it.country === country);
        let Hard_country_filter = sorted_Total_Hard_ranking.filter(it => it.country === country);


        //1등부터 50등 까지 반환
        let sliced_country_Normal_array = Normal_country_filter.slice(0, 50);
        let sliced_country_Hard_array = Hard_country_filter.slice(0, 50);

        //내 등수 불러오기
        let my_country_Normal_ranking = Normal_country_filter.findIndex((s) => s.userid === userid) + 1
        let my_country_Hard_ranking = Hard_country_filter.findIndex((s) => s.userid === userid) + 1


        //내 라이벌 등수 불러오기 (노말)
        if (my_country_Normal_ranking === 0) { //내가 1등이면
            var my_rival_Normal = null;
        } else {//1등이 아니면
            let my_rival_Normal_index = Normal_country_filter.findIndex((s) => s.userid === userid);
            var my_rival_Normal = Normal_country_filter[my_rival_Normal_index - 1];
        }

        //내 라이벌 등수 불러오기 (하드)
        if (my_country_Hard_ranking === 0) { //내가 1등이면
            var my_rival_Hard = null;
        } else {//1등이 아니면
            let my_rival_Hard_index = Hard_country_filter.findIndex((s) => s.userid === userid);
            var my_rival_Hard = Hard_country_filter[my_rival_Hard_index - 1];

        }       



        jsonObj.country_Normal_leaderboard = sliced_country_Normal_array;
        jsonObj.country_Normal_ranking = my_country_Normal_ranking;
        jsonObj.country_Normal_rival = my_rival_Normal;
        jsonObj.country_Hard_leaderboard = sliced_country_Hard_array;
        jsonObj.country_Hard_ranking = my_country_Hard_ranking;
        jsonObj.country_Hard_rival = my_rival_Hard;

        return jsonObj;
    }




}

function get_stage_info(stage) {
    const jsonObj = {};
    jsonObj.playcount = stage.playcount;
    jsonObj.total_death = stage.total_death;
    jsonObj.total_clear = stage.total_clear;
    jsonObj.stage_name = stage.stage_name;

    return jsonObj;
}

async function get_all_leaderboard(email) {
    let jsonObj = {};
    // let language = [
    //     Arabic,
    //     Basque,
    //     Belarusian,
    //     Bulgarian,
    //     Catalan,
    //     Chinese,
    //     Czech,
    //     Danish,
    //     Dutch,
    //     English ,
    //     Estonian ,
    //     Faroese ,
    //     Finnish ,
    //     French ,
    //     German ,
    //     Greek ,
    //     Hebrew ,
    //     Hungarian ,
    //     Hugarian ,
    //     Icelandic ,
    //     Indonesian ,
    //     Italian ,
    //     Japanese ,
    //     Korean ,
    //     Latvian ,
    //     Lithuanian ,
    //     Norwegian ,
    //     Polish ,
    //     Portuguese ,
    //     Romanian ,
    //     Russian ,
    //     SerboCroatian ,
    //     Slovak ,
    //     Slovenian ,
    //     Spanish ,
    //     Swedish ,
    //     Thai ,
    //     Turkish ,
    //     Ukrainian ,
    //     Vietnamese ,
    //     Unknown ,
    // ]
    let userid = await get_userid(email);
    let user_stage = await User_stage.findOne({ userid: userid });


    user_stage.stage.forEach(async s => {
        let stage_name = s.stage_name;
        jsonObj = await get_global_leaderboard(stage_name, email, "Normal");
        jsonObj = await get_global_leaderboard(stage_name, email, "Hard");
        console.log(jsonObj);
        // language.forEach(async s =>{
        //     jsonObj = get_country_leaderboard(stage_name,email,s,Normal);
        //     jsonObj = get_country_leaderboard(stage_name,email,s,Hard);
        // })
    })
    return jsonObj;
}





exports.get_now = get_now;
exports.get_userid = get_userid;
exports.ban = ban;
exports.delete_playing = delete_playing;
exports.calculate_leaderboard = calculate_leaderboard;
exports.get_global_leaderboard = get_global_leaderboard;
exports.get_country_leaderboard = get_country_leaderboard;
exports.get_stage_info = get_stage_info;
exports.get_all_leaderboard = get_all_leaderboard;