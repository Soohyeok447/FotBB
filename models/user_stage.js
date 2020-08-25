/*
유저 스테이지 N,H 클리어여부(걸린시간) 및 언락여부 콜렉션
만약 유저가 스테이지를 클리어하면 다음 스테이지 관련 필드객체가 생성돼야 하고,
크리스탈 등으로 언락을 할 경우에도 그 스테이지 관련 필드객체가 생성돼야 함.
 */

const mongoose = require("mongoose");

const { Schema } = mongoose;

const stage = new Schema({
    
})

const User_stage= new Schema({
    //users스키마에서 가져온 id
    userid: {
        type: String,
        required: true,
    },
    stage:[Schema.Types.Mixed],
    /*  stage 데이터 폼
        stage_number: Number,
        unlock: Boolean, (필요없어보여서 우선 제거)
        N_cleartime: Number, //Normal
        H_cleartime: Number, //hard
        death:Number
    */

    //언락 시 도큐먼트 수정 (stage필드 추가)
});

module.exports = mongoose.model(
    "User_stage",
    User_stage,
    "User_stage"
);

