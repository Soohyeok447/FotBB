require("dotenv").config();

const jwt = require('jsonwebtoken');

var Playing = require("../../../models/playing");
var Banned = require("../../../models/banned");

var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");

var Rt = require("../../../models/rt");
var Rt_blacklist = require("../../../models/rt_blacklist");



// 밴용 moment
var moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

//밴
async function ban(user,email ,reason) {
	let day_format = "YYYY.MM.DD HH:mm:ss";
	let now = moment().format(day_format);

	try {

		//밴
		//banned에 userid 추가
		var user_ = new Banned({
			userid: user.googleid,
			email: email,
			banned_at: now,
			reason: reason,
		});
		await user_.save({ new: true });

		///////////terminate
		//해당유저가 보유중인 스테이지 목록 문자열 배열화
		var result = await User_stage.findOne({ userid: user.googleid });
		var banned_user_arr = [];
		result.stage.forEach((e) => {
			banned_user_arr.push(e.stage_name);
		});

		//스테이지 목록 배열을 이용해서 stage모델에 접근 후 terminated 박아버리기
		banned_user_arr.forEach(async (e) => {
			try {
				let stage = await Stage.findOne({ stage_name: e });
				let banned_user_stage_N = stage.Normal.find((n) => n.userid === user.googleid);
				banned_user_stage_N.terminated = false;
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



// function verifyToken(){
// 	try{
// 		let fotbbToken = jwt.verify(req.body.token, process.env.FOTBB_JWT_SECRET_KEY);
// 		res.status(200).json({fotbbToken});
// 	}catch(err){

// 	}
// }

exports.verifyToken = async (req,res,next)=>{
	try{
		if(req.body.refreshToken){
			console.log("토큰 재발급");
			console.log("refreshToken의 유효성 검사 시작");
			try{		
								//블랙리스트관련처리	
				//만약 블랙리스트에 있는 리프레시토큰이면 실패해야한다.
				if(await Rt_blacklist.exists({rt:req.body.refreshToken})){ //true이면  (블랙리스트이면)
					console.log("블랙리스트에 있는 토큰");
					//만약 블랙리스트의 exp_ms보다 now_ms가 오래됐으면 (만료됐다는 뜻)
					//블랙리스트에서 제거해도 무방
					await check_expired(req.body.email);

					return res.status(200).json({
						status:'forbiddenToken',
						message:'블랙리스트에 있는 토큰입니다.',
					});
				}else{ //블랙리스트에 없는 토큰 (유효한 하나 밖에 없는 토큰)
					let rfToken = await Rt.findOne({email:req.body.email});
					if(rfToken.rt===req.body.refreshToken){ //DB에 저장된 rf랑 같으면
						console.log("유효한 refreshToken입니다. token을 재발급합니다.");
						jwt.verify(req.body.refreshToken, process.env.FOTBB_JWT_SECRET_KEY);
						const token = jwt.sign({
							email: req.body.email,
						},process.env.FOTBB_JWT_SECRET_KEY,{
							expiresIn:'30s',
							issuer:'Fotbb',
						});
						return res.status(200).json({
							status:'tokenRefresh',
							message:'Fotbb 토큰 재발급',
							token
						});

						
	
					}else{ // DB에 저장된 rf랑 다르면 (이상한 접근)
						return res.status(550).json({
							status:'invaliedRefreshToken',
							message:'유효하지 않은 토큰입니다.'
						});
					}
				}
			}catch(err){
				if (err.name === 'TokenExpiredError') {
					console.log("refresh토큰 만료");
					return res.status(560).json({
						status: 'refreshTokenExpired',
						message: 'Fotbb refresh토큰 만료 재로그인 하세요',
					});
				}
				console.log('유효하지 않은 토큰');
				return res.status(550).json({
					status: 'invaliedToken',
					message: '유효하지 않은 토큰입니다.'
				});
			}
		}else{
			console.log("Fotbb토큰의 유효성검사 시작");
			jwt.verify(req.body.token, process.env.FOTBB_JWT_SECRET_KEY);
			console.log('통과');
			next();
		}
	}catch(err){
		if(err.name==='TokenExpiredError'){
			console.log("토큰 만료");
			return res.status(555).json({
				status:'tokenExpired',
				message:'Fotbb 토큰 만료',
			});
		}
		console.log('유효하지 않은 토큰');
		return res.status(550).json({
			status:'invaliedToken',
			message:'유효하지 않은 토큰입니다.'
		});
	}
}

async function check_expired(email){
    //만약 블랙리스트의 exp_ms보다 now_ms가 오래됐으면 (만료됐다는 뜻)
    if(await Rt_blacklist.exists({email:email})){
        let expired_Rt = await Rt_blacklist.findOne({email:email});
        let now_ms = new Date().getTime();
        if(expired_Rt.exp<now_ms){
            console.log(expired_Rt.exp);
            console.log(now_ms);
            console.log('리프레시토큰 만료됐습니다. DB에서 삭제해도 무방합니다.');
            await Rt_blacklist.findOneAndRemove({email:email});
            console.log(await Rt_blacklist.findOne({email:email}));
        }else{
            console.log("아직 리프레시토큰이 신선합니다.")
        }
    }else{
        console.log('블랙리스트에없음');
    }
}



exports.get_now = get_now;
exports.get_userid = get_userid;
exports.ban = ban;
exports.delete_playing = delete_playing;
exports.calculate_leaderboard = calculate_leaderboard;
exports.get_global_leaderboard = get_global_leaderboard;
exports.get_country_leaderboard = get_country_leaderboard;
exports.get_stage_info = get_stage_info;
