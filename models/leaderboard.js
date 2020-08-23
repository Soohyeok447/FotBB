//수정 필요

const mongoose = require("mongoose");

const { Schema } = mongoose;
const leaderboardSchema = new Schema({
    userid:{
        type: Schema.Types.ObjectId,
        
    }
});

module.exports = mongoose.model(
    "Leaderboard",
    leaderboardSchema,
    "leaderboard"
);
