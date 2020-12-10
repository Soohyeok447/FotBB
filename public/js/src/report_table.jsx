import React, { useState, memo } from "react";
import axios from "axios";

var nick_obj = {
    "noun":[
      "개구리",
      "아메리카노",
      "아이스아메리카노",
      "솜뭉치",
      "다람쥐",
      "병아리",
      "노숙자",
      "곰탱이",
      "병아리",
    "물총새",
    "새끼손가락",
    "새끼발가락",
    "바위",
    "호빵",
    "새우튀김",
    "강아지",
    "고양이",
    "고추장",
    "공중전화",
    "발가락",
    "변호사",
    "아저씨",
    "새끼발가락",
    "외국인",
    "호랑이",
    "사자",
    "물개",
    "가재",
    "돼지",
    "수달",
    "친칠라",
    "흑돼지",
    "조랑말",
    "나무늘보",
    "참새",
    "닭",
    "메추라기",
    "올빼미",
    "거북이",
    "목도리도마뱀",
    "구렁이",
    "악어",
    "뱀장어",
    "흰동가리",
    "아기상어",
    "새우",
    "소라게",
    "투구게",
    "그리마",
    "물방개",
    "꿀벌",
    "하늘소",
    "모기",
    "나비",
      "불가사리",
      "해파리",
      "문어",
      "달팽이"
    ],
    "adj":[
      "포근한",
      "귀여운",
      "멋진",
      "잘생긴",
      "자신감넘치는",
      "예의바른",
      "야생의",
      "용감한",
      "야심있는",
      "출세한",
      "가식적인",
      "이기적인",
      "엉뚱한",
      "사나운",
      "피곤한",
      "우아한",
      "화려한",
      "소중한",
      "난데없는",
      "노란",
      "무시무시한",
      "비싼",
      "빠른",
      "성가신",
      "슬픈",
      "아픈",
      "어린",
      "엄청난",
      "예쁜",
      "즐거운",
      "짓궂은",
      "탐스러운",
      "느닷없는",
      "너그러운",
      "깨끗한",
      "게으른",
      "자신없는",
      "감각적인",
      "진취적인",
      "말랑한",
      "섹시한",
      "따뜻한",
      "시원한",
      "어두운",
      "덤덤한"
    ]
  };

const Report_table = ({ users }) => {
  const [selectedRow, setSelectedRow] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  /* method */

  // Element 에 style 한번에 오브젝트로 설정하는 함수 추가
  Element.prototype.setStyle = function (styles) {
    for (var k in styles) this.style[k] = styles[k];
    return this;
  };

  //밴버튼 클릭 (모달창 띄우기)
  const onClickban = (e) => {
    console.log("밴 버튼 클릭");
    e.preventDefault();

    function promise(cb) {
      return new Promise((resolve, reject) => {
        //table의 선택한 row의 데이터 전부 가져오기 (밴버튼 수정버튼 제외)
        let tr = cb.target.parentNode.parentNode;
        var children = tr.childNodes;
        console.log(children);
        //이거 안쓰일지도
        resolve(children[1].innerText);
      });
    }

    promise(e)
      .then((res) => {
        return res;
      })
      .then((res) => {
        var zIndex = 9999;
        var user_ban_modal = document.getElementById("user_ban_modal");
        let email = res;

        // 모달 div 뒤에 희끄무레한 레이어
        var bg = document.createElement("div");
        bg.setStyle({
          position: "fixed",
          zIndex: zIndex,
          left: "0px",
          top: "0px",
          width: "100%",
          height: "100%",
          overflow: "auto",
          // 레이어 색갈은 여기서 바꾸면 됨
          backgroundColor: "rgba(0,0,0,0.4)",
        });
        document.body.append(bg);

        // 닫기 버튼 처리, 시꺼먼 레이어와 모달 div 지우기
        user_ban_modal
          .querySelector(".modal_close_btn")
          .addEventListener("click", function () {
            bg.remove();
            user_ban_modal.style.display = "none";
            email = "";
          });

        user_ban_modal.setStyle({
          position: "fixed",
          display: "block",
          boxShadow:
            "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",

          // 시꺼먼 레이어 보다 한칸 위에 보이기
          zIndex: zIndex + 1,

          // div center 정렬
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          msTransform: "translate(-50%, -50%)",
          webkitTransform: "translate(-50%, -50%)",
        });

        user_ban_modal.querySelector(".final_check").innerText = res;

        function click() {
          console.log("밴 버튼에서 확인 클릭");

          axios({
            method: "post",
            url: "https://fotbbapi.shop:2986/adminpage/report_ban",
            data: {
              email: email,
            },
          })
            .then(function (res) {
              bg.remove();
              user_ban_modal.style.display = "none";
              // setAfterban(true);
              // setAfterban('');
            })
            .catch(function (error) {
              //handle error
              console.log(error);
            });
        }
        user_ban_modal
          .querySelector("#ban_btn")
          .addEventListener("click", click);
      });
  };

  //id변경 버튼 클릭 (모달창 띄우기)
  const onClickIdChange = (e) => {
    console.log("강제닉변 버튼 클릭");
    e.preventDefault();

    function promise(cb) {
      return new Promise((resolve, reject) => {
        //table의 선택한 row의 데이터 전부 가져오기 (밴버튼 수정버튼 제외)
        let tr = cb.target.parentNode.parentNode;
        var children = tr.childNodes;
        console.log(children);
        //이거 안쓰일지도

        resolve(children);
      });
    }
    
    promise(e)
      .then((res) => {
        var zIndex = 9999;
        var report_modal = document.getElementById("report_modal");
        let email = res[1].innerText;

        // 모달 div 뒤에 희끄무레한 레이어
        var bg = document.createElement("div");
        bg.setStyle({
          position: "fixed",
          zIndex: zIndex,
          left: "0px",
          top: "0px",
          width: "100%",
          height: "100%",
          overflow: "auto",
          // 레이어 색갈은 여기서 바꾸면 됨
          backgroundColor: "rgba(0,0,0,0.4)",
        });
        document.body.append(bg);

        // 닫기 버튼 처리, 시꺼먼 레이어와 모달 div 지우기
        report_modal
          .querySelector(".modal_close_btn")
          .addEventListener("click", function () {
            bg.remove();
            report_modal.style.display = "none";
            email = "";
          });

          report_modal.setStyle({
          position: "fixed",
          display: "block",
          boxShadow:
            "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",

          // 시꺼먼 레이어 보다 한칸 위에 보이기
          zIndex: zIndex + 1,

          // div center 정렬
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          msTransform: "translate(-50%, -50%)",
          webkitTransform: "translate(-50%, -50%)",
        });


        let changedId = generator();
        report_modal.querySelector("#original_id").innerText = res[0].innerText;
        report_modal.querySelector("#changed_id").innerText = changedId;


        function click() {
          console.log("강제 닉변 버튼에서 확인 클릭");

          axios({
            method: "post",
            url: "https://fotbbapi.shop:2986/adminpage/report_changeid",
            data: {
              email: email,
              new_id:changedId,
            },
          })
            .then(function (res) {
              bg.remove();
              report_modal.style.display = "none";
            })
            .catch(function (error) {
              //handle error
              console.log(error);
            });
        }
        report_modal
          .querySelector("#changeid_btn")
          .addEventListener("click", click);
      });
  };


  return (
    <tr>
      <td>{users.id}</td>
      <td>{users.email}</td>
      <td>{users.count}</td>
      <td>{users.changed_id_by_force}</td>
      <td>
        <button id="ban" onClick={onClickban}>
          밴
        </button>
      </td>
      <td>
        <button id="idChange" onClick={onClickIdChange}>강제 닉변</button>
      </td>
    </tr>
  );
};

export { Report_table };



//여기에다가 닉변함수
function generator() {
    let adj;
    let noun;
    let rand_int;
    let combined_nickname;
    const max_int = 10000;

    //<형용사>
    //형용사 객체 개수를 length로 구하고
    let adj_max = nick_obj.adj.length;

    //랜덤으로 객체(형용사)를 정한다.
    let rand_adj = Math.floor(Math.random() * adj_max);


    //객체 필드 접근으로 형용사를 뽑는다.
    adj = nick_obj.adj[rand_adj];
    //console.log("형용사",adj);

    //<명사>
    //명사 객체 개수를 length로 구하고
    let noun_max = nick_obj.noun.length;

    //랜덤으로 객체(명사)를 정한다.
    let rand_noun = Math.floor(Math.random() * noun_max);

    //객체 필드 접근으로 명사를 뽑는다.
    noun = nick_obj.noun[rand_noun];
    //console.log("명사",noun);

    //랜덤 숫자를 뽑는다/
    rand_int = Math.floor(Math.random() * max_int);
    //console.log("랜덤숫자",rand_int);

    //닉네임을 조합한다.
    combined_nickname = adj + noun + rand_int;

    return combined_nickname;
}