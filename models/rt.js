const mongoose = require("mongoose");
const ttl = require('mongoose-ttl');

const { Schema } = mongoose;
const Rt = new Schema({
    //구글 연동 id
    email:String,
    rt:String,
    },{ 
        versionKey : false 
});
//Rt.plugin(ttl, { ttl: 86400000, reap: true, interval:43200000 });
module.exports = mongoose.model("Rt", Rt,"Rt");
