import react, {Fragment} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'

const history = createBrowserHistory();

class Navbar extends react.Component{
	constructor(props){
		super(props)
		this.state = {
			fixed: false
		}
	}

	componentDidMount(){
		window.onscroll = ()=> {
			this.setState({fixed: window.pageYOffset !== 0})
		}
	}

	render(){
		console.log(this.props.Fixed)
		return(
			<header id={(this.state.fixed || this.props.Fixed) && 'fixed'}>
				HEADER
				{this.props.children}
			</header>
		)
	}
}

export default Navbar;