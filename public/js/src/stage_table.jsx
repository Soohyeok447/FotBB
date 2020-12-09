import React, { useState, memo,useEffect } from 'react';



const Stage_table = ({ stages, setAfterban }) => {


    /* method */
    useEffect(() => {
        // 브라우저 API를 이용하여 문서 타이틀을 업데이트합니다.
        let select = document.getElementById(`${stages.stage_name}`);

        if(Number(select.innerHTML)<33){
            select.parentNode.setAttribute("style", "background-color:#fa8d87;"); 
        }else if (Number(select.innerHTML)<66){
            select.parentNode.setAttribute("style", "background-color:#fac184;");
        }else{
            select.parentNode.setAttribute("style", "background-color:#b8e1ff;");
        }
      });

    
    
    return (
        <tr>
            <td>{stages.stage_name}</td>
            <td>{stages.playcount}</td>
            <td>{stages.total_death}</td>
            <td>{stages.total_clear}</td>
            <td id = {stages.stage_name}>{((stages.total_clear * 100)/stages.playcount).toFixed(3)}</td>
        </tr>
    )

}

export { Stage_table };