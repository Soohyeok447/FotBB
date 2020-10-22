var express = require("express");
const router = express.Router();




var userController = require("./user.controllers");

//접속 처리 라우터 (클라이언트 접속 시 동기화용)
router.post("/",userController.user_login);

//크리스탈 처리 라우터 (크리스탈 구매)
router.post("/crystal",userController.crystal );

//유저 커스터마이징 저장 라우터
router.post("/customizing",userController.customizing);

//stage인 앱 구매 (크리스탈)
router.post("/stage",userController.stage);

//premium 구매 라우터
router.post("/premium", userController.premium);

//부적절 유저 닉네임 신고 라우터
router.post("/report", userController.report);

//유저 닉네임 변경
router.post("/change", userController.id_change);

//테스트
router.post("/test", userController.test);




module.exports = router;
