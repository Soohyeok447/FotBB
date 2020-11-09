var express = require('express');
var router = express.Router();


var Controller = require("./controllers");

router.get("/",Controller.login);

//구글 로그인 이후 확인 라우터
router.post("/login",Controller.auth);

router.post("/main",Controller.main);

module.exports = router;