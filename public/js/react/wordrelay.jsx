const React = require('react');
const {Component}= React;

class WordRelay extends Component {
    state = {
        text: 'Hello, webpack 저는 설정이 복잡합니다ㅎㅎ',
    };

    render(){
    return <h1>{this.state.text}</h1>
    }
}

module.exports = WordRelay;