const mongoose = require("mongoose");

const { Schema } = mongoose;
const Rt = new Schema({
    //구글 연동 id
    email:String,
    rt:String,
    },{ 
        versionKey : false 
});

module.exports = mongoose.model("Rt", Rt,"Rt");
