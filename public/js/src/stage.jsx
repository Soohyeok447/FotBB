import React, { useState, useRef, useEffect,memo } from 'react';


import { useFetch } from './useFetch';
import {Stage_table} from './stage_table';

const Stage = ({rendered}) => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/stage');
    const [afterban, setAfterban] = useState('');
    // const [list, setList] = useState([]);

    if(!rendered){
        return null;    
    }

    // let result;
    // let list;

    let toggle = 1;

    const onClick = (e) => {
        console.log('클리어 % 클릭 정렬하고 싶네요')
        e.preventDefault();

        let result = [];

        let list = document.getElementById('stage-list').childNodes[1].childNodes;
        for(let i=0;i<list.length;i++){
            result.push(list[i].childNodes[4]);
            
        }
        
        //정렬하고
        let sorted_list = sort_list(result,toggle);
        if(toggle){
            toggle = 0;
        }else{
            toggle = 1;
        }
        //id값 기준으로 tr을 다시 붙인다~
        var tbody = document.querySelector('#stage-list tbody');
        tbody.innerHTML = '';

        for(let j=0;sorted_list.length;j++){
            let tr = sorted_list[j].parentNode.childNodes;
            
            //tr
            var row = document.createElement('tr');

            //스테이지
            var td = document.createElement('td');
            td.textContent = tr[0].textContent;
            row.appendChild(td);

            //플레이횟수
            td = document.createElement('td');
            td.textContent = tr[1].textContent;
            row.appendChild(td);

            //총 death
            td = document.createElement('td');
            td.textContent = tr[2].textContent;
            row.appendChild(td);

            //총 clear
            td = document.createElement('td');
            td.textContent = tr[3].textContent;
            row.appendChild(td);

            //클리어 %
            td = document.createElement('td');
            td.textContent = tr[4].textContent;
            td.setAttribute("id",`${tr[4].id}`);
            row.appendChild(td);

            

            tbody.appendChild(row);

            let select = document.getElementById(`${tr[4].id}`);

            if(Number(select.innerHTML)<33){
                select.parentNode.setAttribute("style", "background-color:#fa8d87;"); 
            }else if (Number(select.innerHTML)<66){
                select.parentNode.setAttribute("style", "background-color:#fac184;");
            }else{
                select.parentNode.setAttribute("style", "background-color:#b8e1ff;");
            }
        }
    }

    
    function sort_list(array,toggle) {
        let sorted_ranking;
        if(toggle){
            // cleartime 기준으로 정렬
            sorted_ranking = array.sort((a, b) => {
                if (Number(b.textContent) > Number(a.textContent)) {
                    return 1;
                }
                if (Number(b.textContent) < Number(a.textContent)) {
                    return -1;
                }
                // 동률
                return 0;
            });

        }else{
            // cleartime 기준으로 정렬
            sorted_ranking = array.sort((b, a) => {
                if (Number(b.textContent) > Number(a.textContent)) {
                    return 1;
                }
                if (Number(b.textContent) < Number(a.textContent)) {
                    return -1;
                }
                // 동률
                return 0;
            });
        }


        return sorted_ranking
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