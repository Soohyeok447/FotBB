import React, { useState, useRef, useEffect,memo } from 'react';


import { useFetch } from './useFetch';
import {Banned_search} from './banned_search';
import {Banned_table} from './banned_table';

const Banned = ({rendered}) => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/ban');
    
    if(!rendered){
        return null;    
    }
    
    /* render */
    return (
        <>
            <Banned_search/>
            {loading
                ? (
                    "Loading..."
                )
                : (
                    <table id="user-list">
                        
                        <thead>
                            <tr>
                                <th>아이디</th>
                                <th>이메일</th>
                                <th>밴 날짜</th>
                                <th>밴 사유</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((x) => (
                                <Banned_table key = {x.email} users={x}/>
                            ))}
                        </tbody>
                    </table>
                )
            }

        </>
    )
};

export default Banned;