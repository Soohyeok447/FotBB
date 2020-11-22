const React = require('react');
const { useState, useRef }= React;

const WordRelay = () => {
    /* state */
    const [word,setWord] = useState('기러기');
    const [value,setValue] = useState('');
    const [result,setResult] = useState('');
    const inputRef = useRef(null);

    /* method */
    const onSubmitForm = (e) =>{
        e.preventDefault();
        if(word[word.length -1 ]=== value[0]){
            setResult('딩동댕');
            setWord(value);
            value('');            
            inputRef.current.focus();
        }else{
            setResult('땡');
            setValue('');
            inputRef.current.focus();
        }
    };

    
    const onChangeInput = (e)=>{
        setValue(e.target.value);
    };


    /* render */
    return (
        <>
            <div>{word}</div>
            <form onSubmit= {onSubmitForm}>
                <input ref={inputRef} value={value} onChange={onChangeInput} />
                <button>입력!</button>
            </form>
            <div>{result}</div>
        </>
    )
}

module.exports = WordRelay;