var express = require("express");

const router = express.Router();

var failController = require("./fail.controllers");


//죽으면 death갱신
router.post("/", failController.death_up);

module.exports = router;