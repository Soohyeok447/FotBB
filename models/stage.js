const mongoose = require("mongoose");

//나중에 다시 볼 때 까먹을까봐 적어두는건데
//Stage 모델은 유저가 랭킹 등록하기 전에 모델이 전부 
//(전부까진 아니지만 테스트할 때 편하다.) 있어야하고
//배열 안에 유저 객체가 초기화 되어있어야한다. 그래야 저장 및 갱신이 됨

const { Schema } = mongoose;
const Stage = new Schema({
    stage_name:{
        type:String,
        index : true,
    },
    composer:String,
    playcount:Number,
    total_death:Number,
    total_clear:Number,
    Normal: [new Schema({
        userid: String,
        cleartime: Number,
        ranking:{
            type:Number,
            default: '',
        },
        death: Number,
        country: String,
        used_bee_custom:Number,
        used_badge:Number,
        renewed_at:String,
        terminated: Boolean,
    })],
    },{ 
        versionKey : false 
});



module.exports = mongoose.model(
    "Stage",
    Stage,
    "Stage"
);
