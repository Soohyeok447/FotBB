const path = require('path');

module.exports = {
    name:'wordrelay-setting',
    mode: 'development', //실서비스:production
    devtool:'eval',
    resolve:{
        extensions:['.js','.jsx']
    },
    
    
    entry:{ // 입력
        app:['./client'],
    },
    output:{// 출력
        path: path.join(__dirname,'dist'),
        filename: 'app.js'
    }
}

//목표 하나의 자바스크립트 파일을 만들어주는 것