var express = require("express");

//middleware
var { verifyToken } = require("../middleware/function");
const router = express.Router();

var authController = require("./auth.controllers");

//구글 gpgs 인증 후 토큰 발급용
router.post("/", authController.auth);

//로그아웃 시 리프레시토큰 블랙리스트에 넣기
router.post("/logout" ,authController.logout);


//만료된 리프레시토큰 전부 지우기
router.post("/clear" ,authController.clearRt);
module.exports = router;