const mongoose = require("mongoose");

const { Schema } = mongoose;
const User = new Schema({
    //_id 자동으로 생성하되, 구글 연동 id를 파인드해서 거기서 이 _id변수를뽑고
    //그걸 변수에 담고 그걸로 쿼리작업을해서 다른 스키마 다루면 될 듯

    //구글 연동 id
    googleid: {
        type: String,
        unique: true,
        required: true,
    },
    //전체랭킹
    global_rank: {
        type: Number,
        default: 0,
    },
    //토탈스코어 (아직 미사용)
    total_score:{
        type:Number,
        default: 0,
    },
    //총 죽은 횟수
    total_death: {
        type: Number,
        default: 0,
    },
    //플레이타임
    playtime: {
        type: Number,
        default: 0,
    },
    /*
    //인 게임 비행시간
    flight_time:{
        type: Number,
        default: 0,
    } */
    //프리미엄 여부
    premium:{
        type:Boolean,
        default:false,
    },
    //크리스탈
    crystal: {
        type: Number,
        default: 0,
        min: 0,
    },
    //가입한 날짜
    created_date: {
        type: Date,
        default: Date.now,
    },
    //최근 접속 날짜
    latest_login: {
        type: Date,
    },
    //어드민 여부
    admin:{
        type:Boolean,
        default: false,
    },
    //이 밑은 로컬파일로 저장되면 필요없음
    //옵션
    option: {
        //음량
        sound:{
            type:Number,
            default:100,
            max: 100,
            min: 0,
        },
        //국가(언어)
        language: String,
    },
    //보유중인 커스터마이징 종류
    customizing: [String],
    //사용자 클라이언트의 버전
    version: {
        type: String,
    },
    //스테이지 즐겨찾기 목록
    favorite:[String],
    //스테이지 정렬 방식
    sort_method:{
        type:String,
        default:"descend",
    }},{ 
        versionKey : false 
});

//구글아이디로 찾는 메서드 
User.statics.findByGoogleid = function(userid) {
    return this.findOne({'googleid': userid}); //.exec() 지웠음
};

User.methods.addCustomize = function (info) {
    this.customizing.push({customizing: info.customizing},{upsert:true});
    return this.save();
};

module.exports = mongoose.model("User", User,"User");
