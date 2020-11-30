// //만약에 리다이렉팅됐는데 error가 forbidden이나 noadmin이면 으악당신누구야
// window.onload = ()=>{
//   console.log('로드됐습니다.');
//   console.log(res.body);
//   let {error} = res.body;
//   switch(error){
//     case 'forbidden':{
//       document.body.innerHTML = '<div class="g-signin2" data-onsuccess="onSignIn"></div>';
//       let text = document.createElement('p');
//       text.textContent='당신 누구야'
//       document.body.appendChild = text;
//       break;
//     }
//     case 'noadmin':{
//       document.body.innerHTML = '<div class="g-signin2" data-onsuccess="onSignIn"></div>';
//       let text = document.createElement('p');
//       text.textContent='당신 누구야 어드민이 아닌데?'
//       document.body.appendChild = text;
//       break;
//     }
//     default: break;
//   }
// }

//구글 로그인
async function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var id_token = googleUser.getAuthResponse().id_token;
    // console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    // console.log('Name: ' + profile.getName());
    // console.log('Image URL: ' + profile.getImageUrl());
    // console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    
    //동적 form생성
    var form = document.createElement("form");
    form.setAttribute("charset", "UTF-8");
    form.setAttribute("method", "GET");  //Post 방식
    form.setAttribute("action", "/adminpage/login/google"); //요청 보낼 주소

    //토큰 input
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "token");
    hiddenField.setAttribute("value", id_token);
    form.appendChild(hiddenField);

    //email input
    hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "email");
    hiddenField.setAttribute("value", profile.getEmail());
    form.appendChild(hiddenField);
    document.body.appendChild(form);
    form.submit();
}

// //구글로그아웃
// function signOut() {
//     var auth2 = gapi.auth2.getAuthInstance();
//     auth2.signOut().then(function () {
//       console.log('User signed out.');
//     });
// }