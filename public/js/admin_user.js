// 사용자 로딩
function getUser() {
  console.log("getUser 시작");
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    if (xhr.status === 200) {
      
    } else {
      console.error(xhr.responseText);
    }
  };
}


window.onload = ()=>{
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const search_email = e.target.search_user.value;
  
    if (!search_email) {
      return alert('이메일을 입력하세요');
    }
  
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log("수신 완료");
        console.log(xhr.responseText);
        
        
        var result = JSON.parse(xhr.responseText);
        console.log(result.user);
        if(result.user){
          
          var tbody = document.querySelector('#user-list tbody');
          tbody.innerHTML = '';
    
    
          var row = document.createElement('tr');
          var td = document.createElement('td');
          td.textContent = result.user.googleid;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.email;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.total_death;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.crystal;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.customizing;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.created_date;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.latest_login;
          row.appendChild(td);
          td = document.createElement('td');
          td.textContent = result.user.country;
          row.appendChild(td);





          var edit = document.createElement('button');
          edit.textContent = '수정';
          edit.addEventListener('click', function () { // 수정 클릭 시
            // var xhr = new XMLHttpRequest();
            // xhr.onload = function () {
            //   if (xhr.status === 200) {
            //     console.log(xhr.responseText);
            //     getComment(id);
            //   } else {
            //     console.error(xhr.responseText);
            //   }
            // }

            //모달창 키기
            



          });

          td = document.createElement('td');
          td.appendChild(edit);
          row.appendChild(td);





          td = document.createElement('td');
          td.innerHTML = '<button id="ban">밴</button>';
          row.appendChild(td);
    
          tbody.appendChild(row);
        
        }else{
          console.log("수신 못했어")
          
          var result = JSON.parse(xhr.responseText);
          console.log(result.error);
  
          var span = document.querySelector('#error');
          span.innerHTML='';

          var error = document.createElement('p');
          error.textContent = "존재하지 않는 유저입니다.";
  
          span.appendChild(error);
        }
      }
    };
    xhr.open('POST', '/adminpage/user_ajax');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ search_email: search_email }));
    e.target.search_user.value = '';
  });
}
