var express = require("express");
const router = express.Router();



//middleware
var { verifyToken } = require("../middleware/function");
var userController = require("./user.controllers");

//접속 처리 라우터 (클라이언트 접속 시 동기화용)
router.post("/",verifyToken,userController.user_login);

//가입한 유저인지 체크하는 라우터
router.post("/check",verifyToken,userController.check_exist_user);

//닉네임 유효성체크 라우터
router.post("/validation",verifyToken,userController.check_validation)

//닉네임 생성기 라우터
router.post("/generator",verifyToken,userController.nickname_generator);

//크리스탈 처리 라우터 (크리스탈 구매)
router.post("/crystal",verifyToken,userController.crystal );

//유저 커스터마이징 저장 라우터
router.post("/customizing",verifyToken,userController.customizing);

//stage인 앱 구매 (크리스탈)
router.post("/stage",verifyToken,userController.stage);

//premium 구매 라우터
router.post("/premium",verifyToken ,userController.premium);

//부적절 유저 닉네임 신고 라우터
router.post("/report",verifyToken ,userController.report);

//유저 닉네임 변경
router.post("/change",verifyToken ,userController.id_change);


//테스트
router.post("/test" ,userController.test);
router.post("/test2" ,userController.test2);
router.post("/test3" ,userController.test3);




module.exports = router;
