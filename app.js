var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var helmet = require('helmet')


var Stage = require("./models/stage");

var User_router = require('./routes/api/user/user.routes');
var Version_router = require('./routes/api/version');
var Clear_router = require('./routes/api/clear/clear.routes');
var Fail_router = require("./routes/api/fail/fail.routes");
var Stage_router = require("./routes/api/stages/stages.routes");
var Play_router = require("./routes/api/play/play.routes");

var connect = require('./models');



var app = express();
connect();  //mongoDB 와 연결


var port = 8901;
app.set('port', port);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
//helmet
app.use(helmet());

//내장된 body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//body-parser
app.use(bodyParser.raw());
app.use(bodyParser.text());
//cookie-parser
app.use(cookieParser());
//path
app.use(express.static(path.join(__dirname, 'public')));


/*
var initialize = async(req,res,next)=>{
  const stages = {startmusic,song1,song2}
  for(song in stages){
    let stage = new Stage({
      stage_name:song,
    })
    await stage.save({ new: true });
  }
  console.log("진입");
  next();
}
//stage 모델 초기화
app.use(initialize)
 */

//라우팅
app.use('/api/version',Version_router);
app.use('/api/user', User_router);
app.use('/api/clear',Clear_router);
app.use('/api/fail',Fail_router);
app.use('/api/stages',Stage_router);
app.use('/api/play',Play_router);


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
})

module.exports = app;
