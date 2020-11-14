var express = require('express');
var router = express.Router();


var Controller = require("./controllers");

router.get("/",Controller.login);

// //구글 로그인 이후 확인 라우터
// router.post("/login",Controller.auth);

//메인 헤더
router.post("/main",Controller.main);

//로그인관리 페이지
router.post("/user",Controller.user);
//로그인관리 ajax
router.post("/user_ajax",Controller.user_ajax);
//스테이지관리 페이지
router.post("/stage",Controller.stage);
//밴유저관리 페이지
router.post("/ban",Controller.ban);
//신고유저관리 페이지
router.post("/report",Controller.report);
// //로그관리 페이지
// router.post("/log",Controller.log);




//리액트연습
router.post("/react",Controller.react);

// router.get('/auth/google',Controller.auth_google);
// router.get('/auth/google/callback',Controller.auth_google_callback);

module.exports = router;