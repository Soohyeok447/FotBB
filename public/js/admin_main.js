



// //구글 로그인
// function onSignIn(googleUser) {
//   var profile = googleUser.getBasicProfile();
//   var id_token = googleUser.getAuthResponse().id_token;

  
//     //버튼들에 이벤트리스너 달기
//     document.querySelectorAll('#menu button').forEach((el) => {
//       let querystring = el.id;
//       el.addEventListener('click', function () {
//         //동적 form생성
//         var form = document.createElement("form");
//         form.setAttribute("charset", "UTF-8");
//         form.setAttribute("method", "Post");  //Post 방식
//         form.setAttribute("action", `/adminpage/${querystring}`); //요청 보낼 주소

//         //토큰 input
//         var hiddenField = document.createElement("input");
//         hiddenField.setAttribute("type", "hidden");
//         hiddenField.setAttribute("name", "token");
//         hiddenField.setAttribute("value", id_token);
//         form.appendChild(hiddenField);

//         //email input
//         hiddenField = document.createElement("input");
//         hiddenField.setAttribute("type", "hidden");
//         hiddenField.setAttribute("name", "email");
//         hiddenField.setAttribute("value", profile.getEmail());
//         form.appendChild(hiddenField);
//         document.body.appendChild(form);
//         // signOut();
//         form.submit();
//       });
//     })
// }