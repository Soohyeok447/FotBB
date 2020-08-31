//수정 필요

const mongoose = require("mongoose");

//나중에 다시 볼 때 까먹을까봐 적어두는건데
//Stage 모델은 유저가 랭킹 등록하기 전에 모델이 전부 
//(전부까진 아니지만 테스트할 때 편하다.) 있어야하고
//배열 안에 유저 객체가 초기화 되어있어야한다. 그래야 저장 및 갱신이 됨

const { Schema } = mongoose;
const Stage = new Schema({
    stage_name:String,
    composer:String,
    popularity:Number,
    Normal: [new Schema({
        userid: String,
        cleartime: Number,
        death: Number,
        country: String,
    })],
    Hard: [new Schema({
        userid: String,
        cleartime: Number,
        death: Number,
        country: String,
    })]},{ 
        versionKey : false 
});


module.exports = mongoose.model(
    "Stage",
    Stage,
    "Stage"
);

/*
 Normal or Hard 데이터 폼
 Normal:{
     userid: Number,
     cleartime: Number,
     death: Number,
     country: String,
 } (그리고 이제 cleartime을 기준으로 sort하고 저장
    배열형태로 저장)
*/