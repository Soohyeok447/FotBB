var winston = require('winston');
const appRoot = require('app-root-path'); //app root 가져오기위해 사용

var moment = require('moment');

require('dotenv').config();
require('moment-timezone');

moment.tz.setDefault("Asia/Seoul");


const { combine, timestamp, printf } = winston.format;

// // define log format 
const logFormat = printf(info => {
    return `${info.message}`;
});


////////////moment.js date,time foramt//////////
var dateformat = moment().format('YYYY-MM-DD');


////////////////////////////////// 함수 호출 시 upload 
async function fail(stage_name, failtime) {
    console.log("upload 호출됨");

    //로거
    let failLogger = winston.createLogger({
        transports: [
            new winston.transports.File({
                level: 'info',
                //dirname: logDir + '/error/' + dateformat,
                filename: `${appRoot}/logs/fail/${stage_name}/${dateformat}.log`, //로그파일을 남길 경로
                handleExceptions: true,
                json: false,
                maxsize: 5242880, //5MB
                colorize: false,
                format: combine( //로그 파일 내용
                    logFormat,
                ),
            }) //위에 설정한 옵션설정
        ],
        exitOnError: false,
    });

    failLogger.info(`${failtime}`);
}


module.exports = { fail };