require("dotenv").config();

var Playing = require("../../../models/playing");
var Banned = require("../../../models/banned");

var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");

// 밴용 moment
var moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

//밴
async function ban(email, reason) {
	let day_format = "YYYY.MM.DD HH:mm:ss";
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
		var result = await User_stage.findOne({ userid: userid });
		var banned_user_arr = [];
		result.stage.forEach((e) => {
			banned_user_arr.push(e.stage_name);
		});

		//스테이지 목록 배열을 이용해서 stage모델에 접근 후 terminated 박아버리기
		banned_user_arr.forEach(async (e) => {
			try {
				let stage = await Stage.findOne({ stage_name: e });
				let banned_user_stage_N = stage.Normal.find((n) => n.userid === userid);
				let banned_user_stage_H = stage.Hard.find((n) => n.userid === userid);
				banned_user_stage_N.terminated = false;
				banned_user_stage_H.terminated = false;
				await stage.save({ new: true });
			} catch (err) {
				console.log(err);
			}
		});
	} catch (err) {
		console.log("에러발생");
		console.log(err);
	}
}

//playing모델 해당 유저 필드 삭제
async function delete_playing(email) {
	await Playing.findOneAndRemove({ email: email }, { new: true }).setOptions({
		runValidators: true,
	});
}

//userid getter
async function get_userid(email) {
	let user = await User.findOne({ email: email });
	if (user === null) {
		console.log("DB에 없는 유저입니다.");
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
	let day_format = "YYYY.MM.DD HH:mm:ss";
	let now = moment(day).format(day_format);
	return now;
}

/*
	리더보드 관련
*/
////////////////////////////////////////////
function calculate_leaderboard(stage) {
	let no_0_array;

	//클리어 타임이 0이 아닌 랭킹들 필터링
	no_0_array = stage.Normal.filter((it) => it.cleartime > 0);
		
	

	//terminated된 기록들 필터링
	let no_terminated_array = no_0_array.filter((e) => e.terminated === !true);

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

	return sorted_ranking;
}


//클리어한 사람 숫자 리턴
function calculate_headcount(stage) {
	let no_0_array;

	//클리어 타임이 0이 아닌 랭킹들 필터링
	no_0_array = stage.Normal.filter((it) => it.cleartime > 0);
		

	//terminated된 기록들 필터링
	let no_terminated_array = no_0_array.filter((e) => e.terminated === !true);


	return no_terminated_array.length;
}



async function get_global_leaderboard(stage,userid) {
	let leaderboard_arr = [];

	
	
	let sorted_Total_Normal_ranking = calculate_leaderboard(stage);

	//1등부터 50등 까지 반환
	let sliced_total_Normal_array = sorted_Total_Normal_ranking.slice(0, 50);
	//내 등수 불러오기
	let my_total_Normal_ranking = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid) + 1;

	//내 라이벌 등수 불러오기
	if (my_total_Normal_ranking === 0) {
		//내가 1등이면
		var my_rival_Normal = null;
	} else {
		//1등이 아니면
		var my_rival_Normal = sorted_Total_Normal_ranking[my_total_Normal_ranking - 1];
	}

	//(프론트 요청으로 리더보드 배열에 넣어서 response하도록 수정)
	for (i = 0; i < 52; i++) {
		if (i < 50) {
			//50위 까지 저장
			leaderboard_arr[i] = sliced_total_Normal_array[i];
			if (leaderboard_arr[i]) {
				leaderboard_arr[i].ranking = i + 1;
			}
		} else if (i === 50) {
			//라이벌 저장
			if (my_rival_Normal) {
				if (my_total_Normal_ranking > 50) {
					leaderboard_arr[i] = sorted_Total_Normal_ranking[my_total_Normal_ranking - 2];
					leaderboard_arr[i].ranking = my_total_Normal_ranking - 1;
				}
			}
		} else {
			//나 저장
			if (my_total_Normal_ranking > 50) {
				leaderboard_arr[i] = sorted_Total_Normal_ranking[my_total_Normal_ranking - 1];
				leaderboard_arr[i].ranking = my_total_Normal_ranking;
			}
		}
	}

	return leaderboard_arr;
}

async function get_country_leaderboard(stage, country,userid) {
	let leaderboard_arr = [];
	//let userid = await get_userid(email);

	let sorted_Total_Normal_ranking = calculate_leaderboard(stage);
	//국가 필터링
	let Normal_country_filter = sorted_Total_Normal_ranking.filter(
		(it) => it.country === country
	);

	//1등부터 50등 까지 반환
	let sliced_country_Normal_array = Normal_country_filter.slice(0, 50);
	//내 등수 불러오기
	let my_country_Normal_ranking =
		Normal_country_filter.findIndex((s) => s.userid === userid) + 1;

	//내 라이벌 등수 불러오기
	if (my_country_Normal_ranking === 0) {
		//내가 1등이면
		var my_rival_Normal = null;
	} else {
		//1등이 아니면
		var my_rival_Normal = Normal_country_filter[my_country_Normal_ranking - 1];
	}

	//(프론트 요청으로 리더보드 배열에 넣어서 response하도록 수정)
	for (i = 0; i < 52; i++) {
		if (i < 50) {
			//50위 까지 저장
			leaderboard_arr[i] = sliced_country_Normal_array[i];
			if (leaderboard_arr[i]) {
				leaderboard_arr[i].ranking = i + 1;
			}
		} else if (i === 50) {
			//라이벌 저장
			if (my_rival_Normal) {
				if (my_country_Normal_ranking > 50) {
					leaderboard_arr[i] = Normal_country_filter[my_country_Normal_ranking - 2];
					leaderboard_arr[i].ranking = my_country_Normal_ranking - 1;
				}
			}
		} else {
			//나 저장
			if (my_country_Normal_ranking > 50) {
				leaderboard_arr[i] = Normal_country_filter[my_country_Normal_ranking - 1];
				leaderboard_arr[i].ranking = my_country_Normal_ranking;
			}
		}
	}
	return leaderboard_arr;
}

async function get_stage_info(stage) {
	const jsonObj = {};
	jsonObj.playcount = stage.playcount;
	jsonObj.total_death = stage.total_death;
	jsonObj.total_clear = stage.total_clear;
	jsonObj.stage_name = stage.stage_name;
	jsonObj.N_headcount = calculate_headcount(stage);
		

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
