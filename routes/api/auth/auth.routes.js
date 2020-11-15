var express = require("express");


const router = express.Router();

var authController = require("./auth.controllers");

//구글 gpgs 인증 후 토큰 발급용
router.post("/", authController.auth);
module.exports = router;