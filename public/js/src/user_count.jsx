import React from 'react';
import { useFetch } from './useFetch';

const User_count = () => {
    /* state */
    const [data, loading] = useFetch('https://fotbbapi.shop:2986/adminpage/user');

    console.log(data);
    /* render */
    return (
        <>
            {loading
                ?(
                    ""
                )
                :(
                <div id="current-user">이용중인 유저 {data.length} 명 밴 당한 유저 {data.length} 명</div>
                )
            }
        </>
    )
};

export default User_count;