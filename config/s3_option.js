var winston = require('winston');
const AWS = require('aws-sdk');
const appRoot = require('app-root-path'); //app root 가져오기위해 사용
const fs  = require('fs');
var moment = require('moment');

var EventEmitter = require('events');

//컨트롤러들 불러오는 부분
var clear = require('./../routes/api/clear/clear.controllers');
var fail = require('./../routes/api/fail/fail.controllers');
var stages = require('./../routes/api/stages/stages.controllers');
var user = require('./../routes/api/user/user.controllers');
var play = require('./../routes/api/play/play.controllers');

var location = [clear,fail,stages,user,play];



require('dotenv').config();
require('moment-timezone');


moment.tz.setDefault("Asia/Seoul");
const logDir = 'logs';

const { combine, timestamp, printf} = winston.format;

// // define log format 
const logFormat = printf(info =>{
return `${info.timestamp} [${info.level}] ${info.message}`;
});


////////////moment.js date,time foramt//////////

var dateformat = moment().format('YYYY-MM-DD');

var tomorrow = moment();
tomorrow.add(1, 'days');
tomorrow.format('YYYY-MM-DD'); 
var timeformat;

//timeformat이 처음에 생성되고 고정되는 것 같으니까 계속 갱신해 줄 필요 있어보임
timer = new EventEmitter();


var sec = 1;
setInterval(function(){
    timer.emit('tick');
}, sec*1000);
timer.on('tick', ()=>{
    timeformat = moment().format('HH시mm분ss초');
});




////////////////////////////


//////////////////////s3 sdk 기본설정/////////
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2'
});





let promise_upload = new Promise((resolve, reject) => {  

});

////////////////////////////////// 함수 호출 시 upload 
function upload(err,location){
    return new Promise((resolve, reject) => {  
        console.log("upload 호출됨");
        //로거
        var s3_error_logger = winston.createLogger({
            transports:[
                new winston.transports.File({
                    level:'error',
                    //dirname: logDir + '/error/' + dateformat,
                    filename: `${appRoot}/logs/error/${dateformat}/${timeformat}_error.log`, //로그파일을 남길 경로
                    handleExceptions: true,
                    json:false,
                    maxsize:5242880, //5MB
                    colorize:false,
                    format: combine( //로그 파일 내용
                        timestamp({
                        format: moment().format('YYYY-MM-DD HH:mm:ss')
                        }),
                        logFormat,
                    ),
                }) //위에 설정한 옵션설정
            ],
            exitOnError:false,
        });
        s3_error_logger.error(`[${location}]에서 에러발생! | 에러내용 - ${[err]}`);

        resolve('success');
    })
}
upload(err,location).then(
    ()=>{
        /////// s3 어디에 어떤형식으로 올릴건지 설정
        var s3_error = {
            'Bucket':'kotbb-log',
            'Key': 'error/'+dateformat+`/${timeformat}_error.log`,
            'ACL':'public-read',
            'Body':fs.createReadStream(`${appRoot}/logs/error/${dateformat}/${timeformat}_error.log`),
            'ContentType':'text/plain'
        }
        //업로드 메서드
        s3.upload(s3_error, (err, data)=>{
            if(err){
            s3_error_logger.error(`[s3] error로그 저장 실패 | 에러내용 - ${err}`);
            }else{
            s3_error_logger.info(`[s3] error로그 저장 성공`);
            }
        });
    }
)
upload(err,location).catch((err)=>{
    console.log("프로미스가 이상해요")
})


    





    
module.exports = {upload};