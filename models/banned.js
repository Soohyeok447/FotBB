const mongoose = require("mongoose");

const { Schema } = mongoose;
const Banned = new Schema({
    userid:String,
    banned_at: String,
    reason: String,
    },{ 
        versionKey : false 
});


module.exports = mongoose.model(
    "Banned",
    Banned,
    "Banned"
);

