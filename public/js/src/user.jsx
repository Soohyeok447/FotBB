import React, { useState, useRef, useEffect,memo } from 'react';


import { useFetch } from './useFetch';
import {User_search} from './user_search';
import {User_table} from './user_table';

const User = () => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/user');
    const [afterban, setAfterban] = useState('');
    
    

    /* render */
    return (
        <>
            <User_search/>
            {loading
                ? (
                    "Loading..."
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
                                <th>보유 샷 커스텀</th>
                                <th>보유 뱃지</th>
                                <th>생성 날짜</th>
                                <th>최종로그인 날짜</th>
                                <th>언어</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((x) => (
                                <User_table key = {x.googleid} users={x} setAfterban={setAfterban}/>
                            ))}
                        </tbody>
                    </table>
                )
            }

        </>
    )
};

export default User;