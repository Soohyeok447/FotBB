import React, { useState, useRef, memo } from "react";
import axios from "axios";

const Report_search = memo(() => {
  /* state */
  const [search, setSearch] = useState("");
  const [constsearch, setConstsearch] = useState("");
  const [result, setResult] = useState("");
  const [searchLoading, setSearchLoading] = useState(true);
  const inputRef = useRef(null);

  /* method */

  const onSubmitForm = (e) => {
    e.preventDefault();
    const search_email = search;
    setConstsearch(search_email);

    if (!search_email) {
      return alert("이메일을 입력하세요");
    } else {
      console.log("axios실행");
      axios
        .get(
          `https://fotbbapi.shop:2986/adminpage/report_search/${search_email}`
        )
        .then((res) => {
          if (res.data.user === null) {
            setResult("error");
            setSearchLoading(true);
          } else {
            setResult(res.data.user);
            setSearchLoading(false);
          }
        });
    }

    inputRef.current.focus();
  };

  const onChangeInput = (e) => {
    setSearch(e.target.value);
  };

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




  /* render */
  return (
    <div id="search">
      <form id="search-form" onSubmit={onSubmitForm}>
        <input
          ref={inputRef}
          value={search}
          onChange={onChangeInput}
          placeholder="email"
        />
        <button id="search-button">검색</button>
      </form>

      {result === "error" ? `${constsearch} 는 신고당한 유저가 아닙니다.` : ""}

      {searchLoading && result !== null ? (
        ""
      ) : (
        <table id="user-list">
          <thead>
            <tr>
              <th>아이디</th>
              <th>이메일</th>
              <th>신고 당한 횟수</th>
              <th>강제 닉변 횟수</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{result.id}</td>
              <td>{result.email}</td>
              <td>{result.count}</td>
              <td>{result.changed_id_by_force}</td>
              <td>
                <button id="ban" onClick={onClickban}>
                  밴
                </button>
              </td>
              <td>
                <button id="idChange" onClick={onClickIdChange}>
                  강제 닉변
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
});

export { Report_search };
