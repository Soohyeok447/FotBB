//수정 필요

const mongoose = require("mongoose");


const { Schema } = mongoose;
const Stage = new Schema({
    stage_name:String,
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
    })],
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