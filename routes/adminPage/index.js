var express = require('express');
var router = express.Router();


// 패스포트 관련
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//DB, 미들웨어
const User = require('../../models/user');
var Controller = require("./controllers");
const { isLoggedIn, isNotLoggedIn } = require('./middleware');
require('dotenv').config();


// 라우터
router.get("/", isNotLoggedIn, Controller.login);


/*

                        구글 로그인        

*/
router.get("/login/google", passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','https://www.googleapis.com/auth/userinfo.email'] }));
router.get("/login/google/callback", passport.authenticate('google', ({ failureRedirect: '/adminpage' ,failureFlash: true})),
	function (req, res) {
		console.log('\n\n성공을 해서 /main으로 리다이렉트 시키겠습니다.')
		res.redirect('https://fotbbapi.shop:2986/adminpage/main');
	}
)
router.get('/logout',isLoggedIn,(req,res)=>{
    req.logout();
    req.session.destroy();
    res.redirect('/adminpage');
})
//구글전략
passport.use(new GoogleStrategy({
    clientID: process.env.GCP_CLIENT_ID,
    clientSecret: process.env.GCP_PASSWORD,
    callbackURL: "https://fotbbapi.shop:2986/adminpage/login/google/callback",
},
    async (accessToken, refreshToken, profile, cb) => {
        try {
            console.log('구글로그인을 했습니다. 구글전략이 실행됩니다.')
            console.log('이 밑은 로그인을 해서 얻은 profile입니다.')
            console.log(profile);

            console.log('자 그럼이제 구글전략안에 있는 콜백을 실행시켜보겠습니다.\n\n')
            const exUser = await User.findOne({ email: profile._json.email })
            if (exUser) {
                console.log(exUser);
                console.log('유저가 DB에 존재');
                if (exUser.admin === true) {
                    console.log('게다가 어드민 맞음. 로그인 성공');
                    return cb(null, exUser)
                } else {
                    console.log('어드민이 아니네 로그인 실패')
                    return cb(null, false, { message: 'no admin' });
                }
            } else {
                console.log('DB에 없는 유저입니다.')
                return cb(null, false, { message: 'no data' })
            }
        } catch (error) {
            return cb(error)
        }
    }
)
)
//패스포트
passport.serializeUser((user, done) => {
    console.log('serializeUser입니다. 이 밑은 구글전략에서 넘겨받은 data입니다.',user);
    console.log('\n\n');
    console.log('serializeuser메서드 안에서 done을 실행시키겠습니다. req.session에 저장되며, deserializeUser에는 user.email을 넘기겠습니다.')
    
    let obj= {};
    obj.id = user.googleid;
    obj.email = user.email;
    console.log(obj);
    done(null, obj); //구글 이메일을 req.session 객체에 넘김
});

passport.deserializeUser((Obj, done) => {
    console.log('\n\ndeserializeUser입니다. serializeuser에서 받은 obj가 여기서 req.user에 저장됩니다.',Obj);
    done(null, Obj); // 여기의 user가 req.user가 됨
});

////////////////////////////////////////////////

//메인 헤더
router.get("/main", isLoggedIn, Controller.main);

//로그인관리 페이지
router.get("/user", isLoggedIn,Controller.user);
//로그인관리 ajax
router.get("/user_search/:email", isLoggedIn,Controller.user_search);
//유저 밴 ajax
router.post("/user_ban", isLoggedIn,Controller.user_ban);
//유저 정보수정 ajax
router.post("/user_modify", isLoggedIn,Controller.user_modify);
//스테이지관리 페이지
router.get("/stage", isLoggedIn,Controller.stage);
//밴유저관리 페이지
router.get("/ban", isLoggedIn,Controller.ban);
//신고유저관리 페이지
router.get("/report", isLoggedIn,Controller.report);
// //로그관리 페이지
// router.get("/log",Controller.log);




//리액트연습
router.post("/react", Controller.react);

// router.get('/auth/google',Controller.auth_google);
// router.get('/auth/google/callback',Controller.auth_google_callback);

module.exports = router;