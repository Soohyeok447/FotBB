var express = require("express");

const router = express.Router();

var stagesController = require("./stages.controllers");


//스테이지 창에서 어떤 곡을 눌렀을 때 글로벌랭킹 응답
router.post("/global", stagesController.global);

//스테이지 창에서 어떤 곡을 눌렀을 때 국가랭킹 응답
router.post("/country", stagesController.country);

module.exports = router;