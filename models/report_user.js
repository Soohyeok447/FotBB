const mongoose = require("mongoose");

const { Schema } = mongoose;

const Report= new Schema({
    //users스키마에서 가져온 id
    email: String,
    id:String,
    count: Number,
    changed_id_by_force: Number,
},{ 
        versionKey : false 
});

module.exports = mongoose.model(
    "Report",
    Report,
    "Report"
);

