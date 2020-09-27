//어떤 스테이지를 플레이하면 인기도 1 상승
//인기도는 어떻게 떨궈야 할지 고민

var express = require("express");

const router = express.Router();

var playingController = require("./playing.controllers");

//실행하면 playcount +1
router.post("/", playingController.check_modulation);

module.exports = router;