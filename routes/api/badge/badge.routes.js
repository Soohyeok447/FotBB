var express = require("express");

//middleware
var { verifyToken } = require("../middleware/function");

const router = express.Router();

var badgeController = require("./badge.controllers");

//클리어 시
router.post("/",verifyToken ,badgeController.badge);
module.exports = router;