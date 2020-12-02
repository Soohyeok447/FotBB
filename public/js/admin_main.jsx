import React from 'react';
import ReactDom  from 'react-dom';


import User from './src/user';
import User_count from './src/user_count';


let user,stages,ban,report = false;

//currentUserCounter
ReactDom.render(<User_count />,document.querySelector('#user_count'));

document.getElementById("btn_user").onclick = function() {
    console.log('user버튼 클릭');
    stages = ban = report = false;
    user = true;
    if(user){
        ReactDom.render(<User />,document.querySelector('#user_component'));
    }
}


