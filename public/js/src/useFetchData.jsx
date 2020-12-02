import {useState, useEffect} from 'react';
import axios from 'axios';

//이건 post로 수정해야겠다 밴이랑 정보수정을 위해서

function useFetchData(url){
    console.log('useFetch Hook 실행');
    const [data,setData] = useState([]);
    const [loading,setLoading] = useState(true);
    async function fetchUrl(){
        await axios.get(url,{ params: { email: search_email } }).then(res => {
            console.log('useFetch Hook속 fetchUrl함수실행');
            console.log('url:',url);
            console.log(res);
            setData(res.data.user);
        });
        setLoading(false);
    }
    useEffect(()=>{
        fetchUrl();
    },[]);
    return [data,loading]
}

export {useFetchData};