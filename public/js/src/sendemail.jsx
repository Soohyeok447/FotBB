import React, { useState, useRef, useEffect,memo } from 'react';
import axios from "axios";
import { useFetch } from './useFetch';


const Sendemail = ({rendered}) => {
    /* state */

    if(!rendered){
        return null;    
    }

    /* render */
    return (
        <>
            <form id='sendemail_form'>
                <div>
                    <label>전제 발송</label>
                </div>
                <textarea name="sendemail" cols="40" rows="8" >
                    안녕하세요 왕벌의 비행입니다.
                    2079년 11월 03일 서비스 종료 예정입니다.
                    감사합니다.
                </textarea>
                <button>전송</button>
            </form>
            

        </>
    )
};

export default Sendemail;