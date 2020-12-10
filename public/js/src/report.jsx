import React, { useState, useRef, useEffect,memo } from 'react';

import { useFetch } from './useFetch';
import {Report_search} from './report_search';
import {Report_table} from './report_table';

const Report = ({rendered}) => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/report');
    
    if(!rendered){
        return null;    
    }

    /* render */
    return (
        <>
            <Report_search/>
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
                                <th>신고 당한 횟수</th>
                                <th>강제 닉변 횟수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((x) => (
                                <Report_table key = {x.email} users={x}/>
                            ))}
                        </tbody>
                    </table>
                    
                )
            }
            

        </>
    )
};

export default Report;