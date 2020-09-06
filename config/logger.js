var winston = require('winston');
var winstonDaily = require('winston-daily-rotate-file');

const logDir = 'logs';
const { combine, timestamp, printf} = winston.format;

// define log format 
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
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%_app.log`,
      maxFiles: 14,  // 14일치 로그 파일 저장
      zippedArchive: true, 
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',  // error.log 파일은 /logs/error 하위에 저장 
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
      format: 'YYYY-MM-DD HH:mm:ss',
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
      format: 'YYYY-MM-DD HH:mm:ss',
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
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports:[
    //info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/play',
      filename: `%DATE%_play.log`,
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
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
      )
    }));
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

module.exports = {logger,payment,play,userinfo};