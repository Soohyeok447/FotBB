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
        required: true,
        default: 0,
    },
    //토탈스코어
    total_score:{
        type:Number,
        required: true,
        default: 0,
    },
    //총 죽은 횟수
    total_death: {
        type: Number,
        required: true,
        default: 0,
    },
    //플레이타임
    playtime: {
        type: Number,
        required: true,
        default: 0,
    },
    //크리스탈
    crystal: {
        type: Number,
        required: true,
        default: 0,
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
    admin:{
        type:Boolean,
        default: false,
    },
    //이 밑은 로컬파일로 저장되면 필요없음
    //옵션
    option: {
        type: Schema.Types.Mixed
    }, //String이 맞는지도 모르겠다
    //보유중인 커스터마이징 종류
    customizing: {
        type: Schema.Types.Mixed,
    },
    //사용자 클라이언트의 버전
    version: {
        type: String,
    },
});

//메소드
User.statics.findById = function(userid) {
    return this.findOne({'googleid': userid}).exec();
};

module.exports = mongoose.model("User", User,"User");
