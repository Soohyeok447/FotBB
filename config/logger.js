var winston = require('winston');
var winstonDaily = require('winston-daily-rotate-file');
var moment = require('moment');
const appRoot = require('app-root-path'); //app root 가져오기위해 사용
const schedule = require('node-schedule');// 일정 시간마다 이벤트 발생

const AWS = require('aws-sdk');

 
const fs  = require('fs');
const { transports } = require('winston');
require('dotenv').config();


/*
s3 윈스턴 로그파일 format수정하고 s3에 연동 (daily, error폴더)
Docker 인강

*/
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const logDir = 'logs';
const { combine, timestamp, printf} = winston.format;

// // define log format 
const logFormat = printf(info =>{
return `${info.timestamp} [${info.level}] ${info.message}`;
});


/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */

const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: moment().format('YYYY-MM-DD HH:mm:ss')
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/all',
      filename: `%DATE%_app.log`,
      maxFiles: 14,  // 14일치 로그 파일 저장
      zippedArchive: true, 
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/all' + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%_error.log`,
      maxFiles: 14,
      zippedArchive: true,
    }),
  ],
})

//payment
const userinfo = winston.createLogger({
  format: combine(
    timestamp({
      format: moment().format('YYYY-MM-DD HH:mm:ss')
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/userinfo',
      filename: `%DATE%_app.log`,
      maxFiles: 14,  // 14일치 로그 파일 저장
      zippedArchive: true, 
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/userinfo' + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%_error.log`,
      maxFiles: 14,
      zippedArchive: true,
    }),
  ],
})

//payment
const payment = winston.createLogger({
  format: combine(
    timestamp({
      format: moment().format('YYYY-MM-DD HH:mm:ss')
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/payment',
      filename: `%DATE%_app.log`,
      maxFiles: 14,  // 14일치 로그 파일 저장
      zippedArchive: true, 
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/payment' + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%_error.log`,
      maxFiles: 14,
      zippedArchive: true,
    }),
  ],
})

//play
const play = winston.createLogger({
  format: combine(
    timestamp({
      format: moment().format('YYYY-MM-DD HH:mm:ss')
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/play',
      filename: `%DATE%_app.log`,
      maxFiles: 14,  // 14일치 로그 파일 저장
      zippedArchive: true, 
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/play' + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%_error.log`,
      maxFiles: 14,
      zippedArchive: true,
    }),
  ],
})

// Production 환경이 아닌 경우(dev 등) 
if (process.env.NODE_ENV !== 'production') {
  userinfo.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
    )
  }));
  payment.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
    )
  }));
  play.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
    )
  }));
}


////////////////////////// 매일 밤 23시 55분 마다 daily-rotaion 로그 파일 저장
schedule.scheduleJob('00 59 23 * * 1-7', ()=>{ //매일 밤 23시 55분에 실행됨
  s3_daily_upload();   
      
});

//upload 과정을 담은 함수 (s3 초기화부터 업로드까지)
function s3_daily_upload(){
    console.log("s3에 daily 저장");
    ///////////////////////////////////////// S3 저장용
    //////// s3 객체 생성
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region : 'ap-northeast-2'
    });



    var dateformat = moment().format('YYYY-MM-DD');

    var tomorrow = moment();
    tomorrow.add(1, 'days');
    tomorrow.format('YYYY-MM-DD'); 

    var timeformat = moment().format('HH:mm:ss');
    //userinfo
    var s3_userinfo = {
      'Bucket':'kotbb-log',
      'Key': `daily/userinfo/${dateformat}_app.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/userinfo/${dateformat}_app.log`),
      'ContentType':'text/plain'
    }
    var s3_userinfo_err = {
      'Bucket':'kotbb-log',
      'Key': `daily/userinfo/error/${dateformat}_error.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/userinfo/error/${dateformat}_error.log`),
      'ContentType':'text/plain'
    }
    //payment
    var s3_payment = {
      'Bucket':'kotbb-log',
      'Key': `daily/payment/${dateformat}_app.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/payment/${dateformat}_app.log`),
      'ContentType':'text/plain'
    }
    var s3_payment_err = {
      'Bucket':'kotbb-log',
      'Key': `daily/payment/error/${dateformat}_error.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/payment/error/${dateformat}_error.log`),
      'ContentType':'text/plain'
    }
    //play
    var s3_play = {
      'Bucket':'kotbb-log',
      'Key': `daily/play/${dateformat}_app.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/play/${dateformat}_app.log`),
      'ContentType':'text/plain'
    }
    var s3_play_err = {
      'Bucket':'kotbb-log',
      'Key': `daily/play/all/error/${dateformat}_error.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/play/error/${dateformat}_error.log`),
      'ContentType':'text/plain'
    }
    //total
    var s3_total = {
      'Bucket':'kotbb-log',
      'Key': `daily/all/${dateformat}_app.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/all/${dateformat}_app.log`),
      'ContentType':'text/plain'
    }
    var s3_total_err = {
      'Bucket':'kotbb-log',
      'Key': `daily/all/error/${dateformat}_error.log`,
      'ACL':'public-read',
      'Body':fs.createReadStream(`${appRoot}/logs/all/error/${dateformat}_error.log`),
      'ContentType':'text/plain'
    }
  ///////////////s3에 upload하는 부분
    //userinfo
    s3.upload(s3_userinfo, (err, data)=>{
      if(err){
        logger.error(`[s3] userinfo 저장 실패`);
      }else{
        logger.info(`[s3] userinfo 저장 성공`);
      }
    });
    s3.upload(s3_userinfo_err, (err, data)=>{
      if(err){
        logger.error(`[s3] userinfo_err 저장 실패`);
      }else{
        logger.info(`[s3] userinfo_err 저장 성공`);
      }
      });
    //payment
    s3.upload(s3_payment, (err, data)=>{
      if(err){
        logger.error(`[s3] payment 저장 실패`);
      }else{
        logger.info(`[s3] payment 저장 성공`);
      }
      });
    s3.upload(s3_payment_err, (err, data)=>{
      if(err){
        logger.error(`[s3] payment_err 저장 실패`);
      }else{
        logger.info(`[s3] payment_err 저장 성공`);
      }
      });
    //play
    s3.upload(s3_play, (err, data)=>{
      if(err){
        logger.error(`[s3] play 저장 실패`);
      }else{
        logger.info(`[s3] play 저장 성공`);
      }
      });
    s3.upload(s3_play_err, (err, data)=>{
      if(err){
        logger.error(`[s3] play_err 저장 실패`);
      }else{
        logger.info(`[s3] play_err 저장 성공`);
      }
      });
    //total
    s3.upload(s3_total, (err, data)=>{
      if(err){
        logger.error(`[s3] total 저장 실패`);
      }else{
        logger.info(`[s3] total 저장 성공`);
      }
      });
    s3.upload(s3_total_err, (err, data)=>{
      if(err){
        logger.error(`[s3] total_err 저장 실패`);
      }else{
        logger.info(`[s3] total_err 저장 성공`);
      }
    });
}


////////////////////////////에러 생성될 때 마다 s3 에러폴더에 저장

module.exports = {logger,payment,play,userinfo};
