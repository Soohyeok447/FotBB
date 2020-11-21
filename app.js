var createError = require('http-errors');
var express = require('express');
var path = require('path');
const ejs = require("ejs");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var helmet = require('helmet')
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




var connect = require('./models');

var app = express();
connect();  //mongoDB 와 연결


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
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval'" ); //구글 API 이용하기 위한 헤더
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
//path


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
