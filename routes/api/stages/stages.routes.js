var express = require("express");

const router = express.Router();

var stagesController = require("./stages.controllers");


//메인메뉴에서 stage버튼을 누를 시 & 정렬방식 저장
router.post("/", stagesController.stages);

//스테이지 창에서 어떤 곡을 눌렀을 때
router.post("/stage", stagesController.stage);

//즐겨찾기 추가
router.post("/favorite", stagesController.favorite);

module.exports = router;