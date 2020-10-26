//playing 스키마새로 생성 id와 now_time을 저장

const mongoose = require("mongoose");

const { Schema } = mongoose;
const Playing = new Schema({
    userid: String,
    email:String,
    now_time:Number,
    start_at:String,
    },{ 
        versionKey : false 
});


module.exports = mongoose.model(
    "Playing",
    Playing,
    "Playing"
);

