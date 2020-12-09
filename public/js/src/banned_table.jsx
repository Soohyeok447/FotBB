import React, { useState, memo } from 'react';
import axios from 'axios';


const Banned_table = ({ users }) => {
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    /* method */

    // Element 에 style 한번에 오브젝트로 설정하는 함수 추가
    Element.prototype.setStyle = function (styles) {
        for (var k in styles) this.style[k] = styles[k];
        return this;
    };

    //밴버튼 클릭 (모달창 띄우기)
    const onClickUnban = (e) => {
        console.log('밴해제 버튼 클릭')
        e.preventDefault();

        function promise(cb) {
            return new Promise((resolve, reject) => {
                //table의 선택한 row의 데이터 전부 가져오기 (밴버튼 수정버튼 제외)
                let tr = cb.target.parentNode.parentNode;
                var children = tr.childNodes;
                console.log(children);
                //이거 안쓰일지도
                resolve(children[1].innerText);
            })
        }

        promise(e)
        .then((res) => {
            return res;
            
        })
        .then((res)=>{
            var zIndex = 9999;
            var unban_modal = document.getElementById('unban_modal');
            let email = res;

            // 모달 div 뒤에 희끄무레한 레이어
            var bg = document.createElement('div');
            bg.setStyle({
                position: 'fixed',
                zIndex: zIndex,
                left: '0px',
                top: '0px',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                // 레이어 색갈은 여기서 바꾸면 됨
                backgroundColor: 'rgba(0,0,0,0.4)'
            });
            document.body.append(bg);

            // 닫기 버튼 처리, 시꺼먼 레이어와 모달 div 지우기
            unban_modal.querySelector('.modal_close_btn').addEventListener('click', function () {
                bg.remove();
                unban_modal.style.display = 'none';
                email = '';
            });

            unban_modal.setStyle({
                position: 'fixed',
                display: 'block',
                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',

                // 시꺼먼 레이어 보다 한칸 위에 보이기
                zIndex: zIndex + 1,

                // div center 정렬
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                msTransform: 'translate(-50%, -50%)',
                webkitTransform: 'translate(-50%, -50%)'
            });


            unban_modal.querySelector('.final_check').innerText = res;

            function click(){
                console.log('언밴버튼에서 확인 클릭');

                axios({
                    method: 'post',
                    url: 'https://fotbbapi.shop:2986/adminpage/user_unban',
                    data: {
                        email: email
                    }
                }).then(function (res) {
                    bg.remove();
                    unban_modal.style.display = 'none';
                    // setAfterban(true);
                    // setAfterban('');
                })
                    .catch(function (error) {
                        //handle error
                        console.log(error);

                    })
            }
            unban_modal.querySelector('#unban_btn').addEventListener('click', click);
        })
    }




    //수정할 데이터 post
    //띄운 모달창에 연동후 확인 버튼 누르면 수정되게


    return (
        <tr>
            <td>{users.userid}</td>
            <td>{users.email}</td>
            <td>{users.banned_at}</td>
            <td>{users.reason}</td>
            <td><button id="unban" onClick={onClickUnban}>밴 해제</button></td>
        </tr>
    )

}

export { Banned_table };