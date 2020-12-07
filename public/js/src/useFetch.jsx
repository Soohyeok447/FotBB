import {useState, useEffect} from 'react';
import axios from 'axios';

function useFetch(url){
    console.log('useFetch Hook');
    const [data,setData] = useState([]);
    const [loading,setLoading] = useState(true);
    async function fetchUrl(){
        await axios.get(url).then(res => {
            console.log('url:',url);
            console.log(res);
            const bowl = res.data.users.map(x => x);
            setData(bowl);
        });
        setLoading(false);
    }
    useEffect(()=>{
        fetchUrl();
    },[]);
    return [data,loading]
}

export {useFetch};