import React from 'react';
import ReactDom  from 'react-dom';


import User_count from './src/user_count';
import User from './src/user';
import Stage from './src/stage';



//currentUserCounter
ReactDom.render(<User_count />,document.querySelector('#user_count'));


document.getElementById("btn_user").onclick = function() {
    console.log('user버튼 클릭');

    ReactDom.render(<User rendered = {true}/>,document.querySelector('#user_component'));
    ReactDom.render(<Stage rendered = {false}/>,document.querySelector('#stage_component'));

    
}

document.getElementById("btn_stage").onclick = function() {
    console.log('stage버튼 클릭');

    ReactDom.render(<User rendered = {false}/>,document.querySelector('#user_component'));
    ReactDom.render(<Stage rendered = {true}/>,document.querySelector('#stage_component'));

    
}

document.getElementById("btn_ban").onclick = function() {
    console.log('ban버튼 클릭');

    ReactDom.render(<User rendered = {false}/>,document.querySelector('#user_component'));
    ReactDom.render(<Stage rendered = {false}/>,document.querySelector('#stage_component'));

    
}

document.getElementById("btn_report").onclick = function() {
    console.log('report버튼 클릭');

    ReactDom.render(<User rendered = {false}/>,document.querySelector('#user_component'));
    ReactDom.render(<Stage rendered = {false}/>,document.querySelector('#stage_component'));

    
}