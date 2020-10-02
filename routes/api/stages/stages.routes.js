var express = require("express");

const router = express.Router();

var stagesController = require("./stages.controllers");


//스테이지 창에서 어떤 곡을 눌렀을 때
router.post("/", stagesController.stages);


module.exports = router;