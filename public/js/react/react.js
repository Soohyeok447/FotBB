const React = require('react');
const ReactDom = require('react-dom');

const GuGuDan = ()=>{
    const[first,setFirst] = React.useState(Math.ceil(Math.random()*9));
    const[second,setSecond] = React.useState(Math.ceil(Math.random()*9));
    const[value,setValue] = React.useState('');
    const[result,setResult] = React.useState('');
    const inputRef = React.useRef(null);

    const onChangeInput = (e) =>{
        setValue(e.target.value);
    }

    const onSubmitInput = (e) =>{
        e.preventDefault();
        if (parseInt(value) === first * second) {
            setResult('정답: ' + value);
            setFirst(Math.ceil(Math.random() * 9));
            setSecond(Math.ceil(Math.random() * 9));
            setValue('');
            
            
            inputRef.current.focus();
        } else {
            setResult('땡');
            setValue('');


            inputRef.current.focus();
        }

    }

    return (
    <React.Fragment>
        <div>{first} 곱하기 {second} 은?</div>
        <form onSubmit={onSubmitInput}>
            <input ref = {inputRef} onChange={onChangeInput} value={value} />
            <button>입력!</button>
        </form>
        <div id="result">{result}</div>
    </React.Fragment>
    )
    
}


class Gugudan extends React.Component { //구구단 컴포넌트
    //constructor
    state = { //바뀌는 부분을 state로
        //속성으로 추가해주면 됨
        first: Math.ceil(Math.random() * 9),
        second: Math.ceil(Math.random() * 9),
        state: '',
        value: '',
        result: '',
    };


    //method
    onSubmit = (e) => {
        e.preventDefault();
        let result = parseInt(this.state.value);
        if (result === this.state.first * this.state.second) {
            this.setState((prevState) => {
                return {
                    result: '정답: ' + prevState.value,
                    first: Math.ceil(Math.random() * 9),
                    second: Math.ceil(Math.random() * 9),
                    value: ''
                };
            })
            this.input.focus();
        } else {
            this.setState({
                result: '땡',
                value: ''
            })
            this.input.focus();
        }
    }

    onChange = (e) => {
        this.setState({ value: e.target.value })
    }

    //참조를 위한 변수 선언 
    input;

    //render
    render() {
        return (
            <React.Fragment>
                <div>{this.state.first}곱하기{this.state.second}는?</div>
                <form onSubmit={this.onSubmit}>
                    <input ref={(c) => { this.input = c; }} type="number" value={this.state.value} onChange={this.onChange} />
                    <button>입력</button>
                </form>
                <div>{this.state.result}</div>
            </React.Fragment>
        );
    }
}


ReactDom.render(
    <div><Gugudan /><Gugudan /><Gugudan /></div>,
    document.querySelector('#gugudan_class')
);
ReactDom.render(
    <div><GuGuDan /></div>,
    document.querySelector('#gugudan_Hooks')
);