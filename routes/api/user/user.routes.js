var express = require("express");
const router = express.Router();

var userController = require("./user.controllers");

//접속 처리 라우터 (클라이언트 접속 시 동기화용)
router.post("/", userController.user_login);

//크리스탈 처리 라우터 (크리스탈 구매)
router.post("/crystal",userController.crystal );

//옵션 처리 라우터
router.post("/option",userController.option )

//유저 커스터마이징 저장 라우터
router.post("/customizing",userController.customizing);


//총 플레이 타임 갱신 (수정 해야 할 수 있음)
// (총 비행 시간)으로 변경 가능
router.post("/playtime", userController.playtime);

//stage인 앱 구매 (크리스탈)
router.post("/stage",userController.stage);

//premium 구매 라우터
router.post("/premium", userController.premium);



module.exports = router;
