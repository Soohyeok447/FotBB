const webpack = require('webpack');

module.exports = {
    name:'wordrelay-setting',
    mode: 'development', //실서비스:production
    devtool:'eval',
    resolve:{
        extensions:['.jsx','.js']
    },
    
    
    entry:{ // 입력
        app:['./client','./gugudan'],
    },

    module:{ // loaders
        rules:[{ //rules는 여러가지 규칙을 적용 시킬 수 있기에 배열
            test: /\.jsx?/, //js나 jsx파일들에 룰 적용   (규칙을 적용시킬 파일들)
            loader: 'babel-loader', //바벨로더의 룰을 적용
                                   //js나 jsx파일에 바벨을 적용해서 호환성을 만들겠다.
            options: {
                presets: [
                    ['@babel/preset-env',{
                        targets:{
                            browsers:['> 5% in KR'], //browserslist
                        },
                        debug:true,
                    }],
                    '@babel/preset-react'
                ], //설치한 바벨 프리셋 적용
                plugins: ['@babel/plugin-proposal-class-properties']
            },
        }],
    }, //엔트리에 있는 파일을 읽고 모듈을 적용한 후 출력
                //사실 순서는 중요하지 않은데 흐름을 위해 여기다가 삽입

    plugins:[
        new webpack.LoaderOptionsPlugin({debug:true}),
    ],
    output:{// 출력
        path: '/root/Fotbb/public/js/react/dist',
        filename: 'react_app.js'
    }
}

//목표 하나의 자바스크립트 파일을 만들어주는 것