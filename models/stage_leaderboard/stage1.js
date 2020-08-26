//수정 필요

const mongoose = require("mongoose");

const { Schema } = mongoose;
const leaderboardSchema = new Schema({
    Normal: [new Schema({
        userid: Number,
        cleartime: Number,
        death: Number,
        country: String,
    })],
    Hard: [new Schema({
        userid: Number,
        cleartime: Number,
        death: Number,
        country: String,
    })],
});

module.exports = mongoose.model(
    "Leaderboard",
    leaderboardSchema,
    "leaderboard"
);

/*
 Normal or Hard 데이터 폼
 Normal:{
     userid: Number,
     cleartime: Number,
     death: Number,
     country: String,
 } (그리고 이제 cleartime을 기준으로 sort후 foreach를 이용해(?) 
    배열형태로 저장)
*/