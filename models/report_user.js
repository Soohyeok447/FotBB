const mongoose = require("mongoose");

const { Schema } = mongoose;

const stage = new Schema({
    
})

const Report= new Schema({
    //users스키마에서 가져온 id
    email: String,
    count: Number,
},{ 
        versionKey : false 
});

module.exports = mongoose.model(
    "Report",
    Report,
    "Report"
);

