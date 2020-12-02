import React,{memo} from 'react';


const User_table = memo(({users}) =>{

    return (
        <tr>
            <td>{users.googleid}</td>
            <td>{users.email}</td>
            <td>{users.total_death}</td>
            <td>{users.crystal}</td>
            <td>{users.royal_crystal}</td>
            <td>{users.bee_custom+', '}</td>
            <td>{users.shot_custom+', '}</td>
            <td>{users.badge+', '}</td>
            <td>{users.created_date}</td>
            <td>{users.latest_login}</td>
            <td>{users.country}</td>
            <td><button id="modify">수정</button></td>
            <td><button id="ban">밴</button></td>
        </tr>
    )
    
})

export {User_table};