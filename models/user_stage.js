const mongoose = require("mongoose");

const { Schema } = mongoose;
const User_stage= new Schema({
    //users스키마에서 가져온 id
    userid: {
        type: String,
        required: true,
    },
  
        stage1:{
            stage_unlock:{
                type:Boolean,
                default:true,
            },
            stage_N_cleartime:{ //normal
                type:Number,
                default:0,
            },
            stage_H_cleartime:{ //hard
                type:Number,
                default:0,
            }
        },
        //언락 시 도큐먼트 수정 (stage2 추가)
});

module.exports = mongoose.model(
    "User_stage",
    User_stage,
    "User_stage"
);
