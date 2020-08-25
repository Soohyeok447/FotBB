//수정 필요
//전체 리더보드 
//(점수 산출하는 식으로 산출한 점수로 모든 유저의 랭킹을 보여준다.)

const mongoose = require("mongoose");

const { Schema } = mongoose;
const leaderboardSchema = new Schema({
    //users스키마에서 가져온 id
    userid: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model(
    "Leaderboard",
    leaderboardSchema,
    "leaderboard"
);
