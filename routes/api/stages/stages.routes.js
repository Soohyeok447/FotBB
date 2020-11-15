var express = require("express");
//middleware
var { verifyToken } = require("../middleware/function");
const router = express.Router();

var stagesController = require("./stages.controllers");

//스테이지 창에서 어떤 곡을 눌렀을 때 국가랭킹 응답
router.post("/", verifyToken,stagesController.leaderboard);

module.exports = router;