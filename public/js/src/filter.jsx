import React, { useState, useRef, useEffect, memo } from 'react';
import axios from "axios";
import { useFetch } from './useFetch';

const Filter = ({ rendered }) => {
    const [db, setDb] = useState('');
    const inputRef = useRef(null);
    /* state */

    if (!rendered) {
        return null;
    }
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/filter');



    const onclickSubmit = (e) => {
        e.preventDefault();
        console.log('전송 눌렀다.');
        axios({
            method: "post",
            url: "https://fotbbapi.shop:2986/adminpage/modify_filter",
            data: {
                db: db,
            },
        })
            .then(function (res) {
                console.log(res);
            })
            .catch(function (error) {
                //handle error
                console.log(error);
            });
        inputRef.current.focus();
    }

    const onChangeInput = (e) => {
        setDb(e.target.value);
    };

    useEffect(() => {
        document.getElementById('filter').innerText = data;
    })

    /* render */
    return (
        <>
            <div id="db_box">
                {data}
            </div>

            <div>
                <label>필터링 DB - 추가할 때 '단어1|(추가할 단어)' 이렇게 적어주세요~</label>
            </div>
            <div className="textwrapper">
                <form id='filter_form' onSubmit={onclickSubmit}>
                    <textarea id="filter" rows="10" onChange={onChangeInput} ref={inputRef} />
                    <button id="modify_db">DB수정</button>
                </form>
            </div>
        </>
    )
};

export default Filter;