import React, { useState, useRef, useEffect,memo } from 'react';
import axios from "axios";
import { useFetch } from './useFetch';

const Filter = ({rendered}) => {
    const [db, setDb] = useState(''); 
    const inputRef = useRef(null);
    /* state */

    if(!rendered){
        return null;    
    }
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/filter');

    

    const onclickSubmit = (e) =>{
        e.preventDefault();
        axios({
            method: "post",
            url: "https://fotbbapi.shop:2986/adminpage/modify_filter",
            data: {
              db: db,
            },
          })
          inputRef.current.focus();
    }

    const onChangeInput = (e) => {
        setDb(e.target.value);
    };

    /* render */
    return (
        <>
            <div id = "db_box">
                {data}
            </div>

            <form id='filter_form'>
                <div>
                    <label>필터링 DB</label>
                </div>
                <div className="textwrapper"><textarea cols="2" rows="10" id="filter" value={data} onChange={onChangeInput} ref={inputRef}/></div>
            
                <button onClick={onclickSubmit}>전송</button>
            </form>
            

        </>
    )
};

export default Filter;