var express = require("express");


const router = express.Router();

var badgeController = require("./badge.controllers");

//클리어 시
router.post("/", badgeController.badge);
module.exports = router;