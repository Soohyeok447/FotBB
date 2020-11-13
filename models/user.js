const mongoose = require("mongoose");

const { Schema } = mongoose;
const User = new Schema({
    //구글 연동 id
    googleid: {
        type: String,
        unique: true,
        required: true,
    },
    email:String,
    //총 죽은 횟수
    total_death: {
        type: Number,
        default: 0,
    },
    //프리미엄 여부
    premium:{
        type:Boolean,
        default:false,
    },
     //로얄 크리스탈
    royal_crystal: {
        type: Number,
        default: 0,
        min: 0,
    },
    //크리스탈
    crystal: {
        type: Number,
        default: 0,
        min: 0,
    },
    //가입한 날짜
    created_date: {
        type: String
 
    },
    //최근 접속 날짜
    latest_login: {
        type: String
    },
    //어드민 여부
    admin:{
        type:Boolean,
        default: false,
    },
    country:String,
    //보유중인 벌 커스터마이징 종류
    bee_custom: [Number],
    //보유중인 벌의 탄 커스터마이징 종류
    shot_custom: [Number],
    //보유중인 뱃지 종류
    badge: [Number],

    //stages/stage api 호출 할 때 로그인 이후 한번만 호출되도록 체크하는 용도
    stage_checked :[String],

    //밴 여부, 밴 된 날짜
    banned: Boolean,
    banned_at: String,



    },{ 
        versionKey : false 
});

module.exports = mongoose.model("User", User,"User");
