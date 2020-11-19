const mongoose = require("mongoose");

const { Schema } = mongoose;
const Rt_blacklist = new Schema({
    rt:String,
    exp:Number,
    email:{
        type:String,
        index:true,
    },
    },{ 
        versionKey : false 
});

module.exports = mongoose.model("Rt_blacklist", Rt_blacklist,"Rt_blacklist");
