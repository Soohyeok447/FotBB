import React, { useState, memo } from 'react';
import axios from 'axios';


const User_table = ({ users, setAfterban }) => {
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    /* method */

    // Element 에 style 한번에 오브젝트로 설정하는 함수 추가
    Element.prototype.setStyle = function (styles) {
        for (var k in styles) this.style[k] = styles[k];
        return this;
    };

    //밴버튼 클릭 (모달창 띄우기)
    const onClickBan = (e) => {
        console.log('밴버튼 클릭')
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
            var user_ban_modal = document.getElementById('user_ban_modal');
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
            user_ban_modal.querySelector('.modal_close_btn').addEventListener('click', function () {
                bg.remove();
                user_ban_modal.style.display = 'none';
                email = '';
            });

            user_ban_modal.setStyle({
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


            user_ban_modal.querySelector('.final_check').innerText = res;

            function click(){
                console.log('밴버튼에서 확인 클릭');
                console.log(res);
                axios({
                    method: 'post',
                    url: 'https://fotbbapi.shop:2986/adminpage/user_ban',
                    data: {
                        email: email
                    }
                }).then(function (res) {
                    bg.remove();
                    modal.style.display = 'none';
                    // setAfterban(true);
                    // setAfterban('');
                })
                    .catch(function (error) {
                        //handle error
                        console.log(error);

                    })
            }
            user_ban_modal.querySelector('#ban_btn').addEventListener('click', click);
        })
    }





    //수정버튼 클릭
    const onClickModify = (e) => {
        e.preventDefault();
        //table의 선택한 row의 데이터 전부 가져오기 (밴버튼 수정버튼 제외)
        let tr = e.target.parentNode.parentNode;
        var children = tr.childNodes;
        let selectedRowArr = [];
        for (let i = 0; i < children.length - 2; i++) {
            selectedRowArr.push(children[i].innerText);
        }
        setSelectedRow(selectedRowArr);


        var zIndex = 9999;
        var user_modify_modal = document.getElementById('user_modify_modal');

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
        user_modify_modal.querySelector('.modal_close_btn').addEventListener('click', function () {
            bg.remove();
            user_modify_modal.style.display = 'none';

        });

        user_modify_modal.setStyle({
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

        console.log(selectedRowArr);
        user_modify_modal.querySelector('#googleid').value = selectedRowArr[0];
        let original_email = user_modify_modal.querySelector('#email').value = selectedRowArr[1];
        user_modify_modal.querySelector('#crystal').value = selectedRowArr[3];
        user_modify_modal.querySelector('#royal_crystal').value = selectedRowArr[4];
        user_modify_modal.querySelector('#bee_custom').value = selectedRowArr[5];
        user_modify_modal.querySelector('#badge').value = selectedRowArr[6];
        user_modify_modal.querySelector('#country').value = selectedRowArr[9];


        function click(){
            let googleid = user_modify_modal.querySelector('#googleid').value;
            let crystal = user_modify_modal.querySelector('#crystal').value;
            let royal_crystal = user_modify_modal.querySelector('#royal_crystal').value;
            let bee_custom = user_modify_modal.querySelector('#bee_custom').value;
            let badge = user_modify_modal.querySelector('#badge').value;
            let modified_email = user_modify_modal.querySelector('#email').value;
            let country = user_modify_modal.querySelector('#country').value;

            console.log('수정버튼에서 확인 클릭');
            axios({
                method: 'post',
                url: 'https://fotbbapi.shop:2986/adminpage/user_modify',
                data: {
                    googleid:googleid,
                    original_email:original_email,
                    modified_email:modified_email,
                    crystal:crystal,
                    royal_crystal:royal_crystal,
                    bee_custom:bee_custom,
                    badge:badge,
                    country:country,
                }
            }).then(function (res) {
                bg.remove();
                modal.style.display = 'none';
            })
                .catch(function (error) {
                    //handle error
                    console.log(error);

                })
        }

        user_modify_modal.querySelector('#modify_btn').addEventListener('click', click)



    }

    //수정할 데이터 post
    //띄운 모달창에 연동후 확인 버튼 누르면 수정되게


    return (
        <tr>
            <td>{users.googleid}</td>
            <td>{users.email}</td>
            <td>{users.total_death}</td>
            <td>{users.crystal}</td>
            <td>{users.royal_crystal}</td>
            <td>{users.bee_custom + ', '}</td>
            <td>{users.badge + ', '}</td>
            <td>{users.created_date}</td>
            <td>{users.latest_login}</td>
            <td>{users.country}</td>
            <td><button id="modify" onClick={onClickModify}>수정</button></td>
            <td><button id="ban" onClick={onClickBan}>밴</button></td>
        </tr>
    )

}

export { User_table };