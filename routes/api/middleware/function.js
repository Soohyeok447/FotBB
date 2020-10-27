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
async function ban(email,reason){
    let day_format = 'YYYY.MM.DD HH:mm:ss';
    let now = moment().format(day_format);
    
    try{
        let userid = await get_userid(email);
    //밴
        //banned에 userid 추가
        var user = new Banned({
            userid: userid,
            email: email,
            banned_at:now,
            reason: reason,
        });
        await user.save({ new: true });
        


        ///////////terminate
        //해당유저가 보유중인 스테이지 목록 문자열 배열화
        var result = await User_stage.findOne({userid:userid})
        var banned_user_arr =[];
            result.stage.forEach(e => {
            banned_user_arr.push(e.stage_name);
        });
        

            //스테이지 목록 배열을 이용해서 stage모델에 접근 후 terminated 박아버리기
        banned_user_arr.forEach(async e=>{
            try{
                let stage = await Stage.findOne({stage_name:e});
                let banned_user_stage_N = stage.Normal.find(n=> n.userid===userid);
                let banned_user_stage_H = stage.Hard.find(n=> n.userid===userid);
                banned_user_stage_N.terminated=false;
                banned_user_stage_H.terminated=false;
                await stage.save({new:true});
            }catch(err){
                console.log(err);
            }
        })
    }catch(err){
        console.log("에러발생")
        console.log(err);
    }
}


//playing모델 해당 유저 필드 삭제
async function delete_playing(email){
    
    await Playing.findOneAndRemove(
        {email:email},
        { new: true }
    ).setOptions({ runValidators: true });
}

//userid getter
async function get_userid(email){
    let user = await User.findOne({email:email});
    if(user === null){
        console.log("이메일이 없습니다.")
        return null;
    }else{
        let id = user.googleid;
        return id;
    }
    // 주의!!!!!!!!!!
    //이 함수 사용할 때 await 붙여야함
}

//(moment) now getter
function get_now(){
    //moment format
    let day = new Date();
    let day_format = 'YYYY.MM.DD HH:mm:ss';
    let now = moment(day).format(day_format);
    return now;
}


exports.get_now = get_now;
exports.get_userid = get_userid;
exports.ban = ban;
exports.delete_playing = delete_playing;