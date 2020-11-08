var winston = require('winston');
const AWS = require('aws-sdk');
const appRoot = require('app-root-path'); //app root 가져오기위해 사용
const fs  = require('fs');
var moment = require('moment');


require('dotenv').config();
require('moment-timezone');

var {get_userid} = require("../routes/api/middleware/function");

moment.tz.setDefault("Asia/Seoul");
const logDir = 'logs';

const { combine, timestamp, printf} = winston.format;

// // define log format 
const logFormat = printf(info =>{
return `${info.timestamp} [${info.level}] ${info.message}`;
});


////////////moment.js date,time foramt//////////

var dateformat = moment().format('YYYY-MM-DD');

var timeformat;

//timeformat이 처음에 생성되고 고정되는 것 같으니까 계속 갱신해 줄 필요 있어보임 (5초? 15초? 30초?)
function set_time(){
    timeformat = moment().add(3,"m").add(40,"s").format("HH시mm분ss초");
    console.log(timeformat);
    return timeformat;
}

//////////////////////s3 sdk 기본설정/////////
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2'
});



//userid getter
async function get_userid(email){
    let user = await User.findOne({email:email});
    let id = user.googleid;
    return id;
}


////////////////////////////////// 함수 호출 시 upload 
async function upload(email,location,err){
    console.log("upload 호출됨");
    timeformat = set_time();

    if(email=''){
        id='';
    }

    //id 값 find
    let id = await get_userid(email);


    //로거
    let s3_error_logger = winston.createLogger({
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
    
    s3_error_logger.error(`email : '${email}', id : '${id}' - [${location}]에서 에러발생! | 에러내용 - ${[err]}`);
    
    function s3upload(){
        console.log("s3upload 실행됨")
        
        /////// s3 어디에 어떤형식으로 올릴건지 설정
        var s3_error = {
            'Bucket':'fotbb-log',
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
            }
        });
    }
    //1초뒤에 s3에 저장되도록
    setTimeout(s3upload, 1000);
    

    
    ///////////////aws sns
    AWS.config.loadFromPath(`${appRoot}/config/config.json`);

    var params = {
        Message:`fotbb api error! [${location}]에서 에러발생!`,
        PhoneNumber: '+821089012986',
    };

    var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    //Handle promise's fulfilled/rejected statses

    publishTextPromise.then(
        function(data){
        }).catch(
        function(err){
        console.error(err,err.stack);
    })
    
}

function report_notice(id,email,count){
    console.log("함수실행");
    
    //aws sns
    AWS.config.loadFromPath(`${appRoot}/config/config.json`);

    var params = {
        Message:`${id} -> ${count}회 : ${email}`,
        PhoneNumber: '+821089012986',
    };

    var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    //Handle promise's fulfilled/rejected statses

    publishTextPromise.then(
        function(data){
        }).catch(
        function(err){
        console.error(err,err.stack);
    })
    
}

  



module.exports = {upload,report_notice};