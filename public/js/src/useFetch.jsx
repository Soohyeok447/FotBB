import {useState, useEffect} from 'react';
import axios from 'axios';

function useFetch(url){
    const [data,setData] = useState([]);
    const [loading,setLoading] = useState(true);
    async function fetchUrl(){
        await axios.get(url).then(res => {
            let bowl;
            if(res.data.users){
                bowl = res.data.users.map(x => x);
            }else if(res.data.stages){
                bowl = res.data.stages.map(x => x);
            }else if (res.data.banned){
                bowl = res.data.banned.map(x => x);
            }
            
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