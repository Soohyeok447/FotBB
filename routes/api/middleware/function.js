require('dotenv').config();
var User = require("../../../models/user");
var Playing = require("../../../models/playing");
var Banned = require("../../../models/banned");


var {logger,playing,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");

// 밴용 moment
var moment = require('moment');

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");



    
//밴
async function ban(id){
    var day_format = 'YYYY.MM.DD HH:mm:ss';
    var now = moment().format(day_format);

//밴
    //banned에 userid 추가
    var user = new Banned({
        userid: id,
        banned_at:now
    });
    await user.save({ new: true });
    


    ///////////terminate
    try{
       //해당유저가 보유중인 스테이지 목록 문자열 배열화
    var result = await User_stage.find({userid:id})
    var banned_user_arr =[];
    result[0].stage.forEach(e => {
        banned_user_arr.push(e.stage_name);
    });
    

        //스테이지 목록 배열을 이용해서 stage모델에 접근 후 terminated 박아버리기
    banned_user_arr.forEach(async e=>{
        let stage = await Stage.findOne({stage_name:e});
        let banned_user_stage_N = stage.Normal.find(n=> n.userid===id);
        let banned_user_stage_H = stage.Hard.find(n=> n.userid===id);
        banned_user_stage_N.terminated=true;
        banned_user_stage_H.terminated=true;
        await stage.save({new:true});
    })
    }catch(err){
        console.log(err);
    }
}


//playing모델 해당 유저 필드 삭제
async function delete_playing(id){
    
    await Playing.findOneAndRemove(
        {userid:id},
        { new: true }
    ).setOptions({ runValidators: true });
}

exports.ban = ban;
exports.delete_playing = delete_playing;