import React, { useState, useRef,memo } from 'react';
import axios from 'axios';

const User_search = memo(() => {
    /* state */
    const [search, setSearch] = useState('');
    const [constsearch, setConstsearch] = useState('');
    const [result, setResult] = useState('');
    const [searchLoading, setSearchLoading] = useState(true);
    const inputRef = useRef(null);


    /* method */

    //밴버튼 클릭
    const onClickBan = (e) => {
        e.preventDefault()
        console.log(e);
    }

    //수정버튼 클릭
    const onClickModify = (e) => {

    }


    const onSubmitForm = (e) => {
        e.preventDefault()
        const search_email = search;
        setConstsearch(search_email);

        if (!search_email) {
            return alert('이메일을 입력하세요');
        } else {
            console.log('axios실행');
            axios.get(`https://fotbbapi.shop:2986/adminpage/user_search/${search_email}`).then(res => {
                if(res.data.user === null){
                    setResult('error')
                    setSearchLoading(true);
                }else if(res.data.user === 'banned'){
                    setResult('banned')
                    setSearchLoading(true);
                }else{
                    setResult(res.data.user);
                    setSearchLoading(false);
                }
            })
        }

        console.log('상태한번 봅시다.');
        inputRef.current.focus();
    }

    const onChangeInput = (e) => {
        setSearch(e.target.value);
    };

    /* render */
    return (
        <div id="search">
            <form id="search-form" onSubmit={onSubmitForm}>
                <input ref={inputRef} value={search} onChange={onChangeInput} placeholder="email" />
                <button id="search-button">검색</button>
            </form>

            {result === 'error'
                ?(`${constsearch} 는 없는 유저입니다.`)
                :("")
            }
            {result === 'banned'
                ?(`${constsearch} 는 밴당한 유저입니다.`)
                :("")
            }

            {(searchLoading && result !== null)
                ? (
                    ""
                )
                : (
                    <table id="user-list">
                        <thead>
                            <tr>
                                <th>닉네임</th>
                                <th>이메일</th>
                                <th>토탈데스</th>
                                <th>크리스탈</th>
                                <th>로얄크리스탈</th>
                                <th>보유 벌 커스텀</th>
                                <th>보유 뱃지</th>
                                <th>생성 날짜</th>
                                <th>최종로그인 날짜</th>
                                <th>언어</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{result.googleid}</td>
                                <td>{result.email}</td>
                                <td>{result.total_death}</td>
                                <td>{result.crystal}</td>
                                <td>{result.royal_crystal}</td>
                                <td>{result.bee_custom + ', '}</td>
                                <td>{result.badge + ', '}</td>
                                <td>{result.created_date}</td>
                                <td>{result.latest_login}</td>
                                <td>{result.country}</td>
                                <td><button id="modify">수정</button></td>
                                <td><button id="ban">밴</button></td>
                            </tr>
                        </tbody>

                    </table>
                )
            }
        </div>
    );
})


export { User_search };