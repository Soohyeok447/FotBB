import React, { useState, useRef, useEffect,memo } from 'react';


import { useFetch } from './useFetch';
import {Stage_table} from './stage_table';

const Stage = ({rendered}) => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/stage');
    const [afterban, setAfterban] = useState('');
    
    if(!rendered){
        return null;    
    }


    const onClick = (e) => {
        console.log('클리어 % 클릭 정렬하고 싶네요')
        e.preventDefault();
        let result=[];

        let list = document.getElementById('stage-list').childNodes[1].childNodes;
        for(let i=0;i<list.length;i++){
            result.push(list[i].childNodes[4]);
            
        }
        
        //정렬하고
        let sorted_list = result.sort(function(a, b) { // 내림차순
            return b.value - a.value;
        });
        console.log(sorted_list);
        //id값 기준으로 tr을 다시 붙인다~
    }


    /* render */
    return (
        <>
            {loading
                ? (
                    "Loading..."
                )
                : (
                    <table id="stage-list">
                        
                        <thead>
                            <tr>
                                <th>스테이지</th>
                                <th>플레이횟수</th>
                                <th>총 death</th>
                                <th>총 clear</th>
                                <th id="percent" onClick={onClick}>클리어 %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((x) => (
                                <Stage_table key = {x.stage_name} stages = {x}/>
                            ))}
                        </tbody>
                    </table>
                )
            }

        </>
    )
};

export default Stage;