var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var helmet = require('helmet')
const passport = require('passport');
const session = require('express-session');
var flash = require('connect-flash');

require('dotenv').config();

      //// 라우터
//API
var User_router = require('./routes/api/user/user.routes');
var Version_router = require('./routes/api/version');
var Result_router = require('./routes/api/result/result.routes');
var Stage_router = require("./routes/api/stages/stages.routes");
var Playing_router = require("./routes/api/playing/playing.routes");
var Badge_router = require("./routes/api/badge/badge.routes");
var Auth_router = require("./routes/api/auth/auth.routes");

//API 테스트
//var test = require("./routes/api/middleware/test");

//관리자 페이지
var adminPage = require("./routes/adminPage/index");

//passport config
// const passportConfig = require('./config/passport');


var app = express(); 
var connect = require('./models');
const { env } = require('process');
connect();  //mongoDB 와 연결
// passportConfig(passport); //passport 연결

var port = 8901;
app.set('port', port);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


if(process.env.NODE_ENV === 'production'){ //배포환경
  app.use(morgan('combined', {
    skip: (req, res)=>{ return res.statusCode < 400 } //에러 말고는 콘솔에 안찍겠다.
  }))
}else{ //개발환경
  app.use(morgan('dev'));
  

}
app.use(express.static(path.join(__dirname, 'public')));
//helmet
app.use(helmet());
app.use(function(req, res, next) {
  res.setHeader("Content-Security-Policy",  "script-src 'self' https://apis.google.com 'unsafe-inline' 'unsafe-eval' " ); //구글 API 이용하기 위한 헤더
  return next();
});
//내장된 body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//body-parser
app.use(bodyParser.raw());
app.use(bodyParser.text());
//cookie-parser
app.use(cookieParser());

//express-session
app.set('trust proxy', 1) // trust first proxy
app.use(session({ //세션 관리용 미들웨어 (로그인할 때 유용)
  secret: process.env.COOKIE_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { 
    maxAge: 60 * 60 * 1000,
    store:true,
    secure:'auto',
    httpOnly:true,
    // domain:'fotbbapi.shop:2986',
  },
}));
app.use(flash());



//passport
app.use(passport.initialize()); //패스포트 설정을 초기화
app.use(passport.session()); // req.session 객체에 passport 정보를 저장




// app.get('/admin',function(req,res){
//   res.render("admin_login",{});
// })
//라우팅
app.use('/api/version',Version_router);
app.use('/api/user', User_router);
app.use('/api/result',Result_router);
app.use('/api/stages',Stage_router);
app.use('/api/playing',Playing_router);
app.use('/api/badge',Badge_router);
app.use('/api/auth',Auth_router);

//app.use('/api/middleware/test',test);

app.use('/adminPage',adminPage);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, (req,res) => {
  // console.log(`Example app listening at http://localhost:${port}`)
  //console.log("얍");

})

module.exports = app;
