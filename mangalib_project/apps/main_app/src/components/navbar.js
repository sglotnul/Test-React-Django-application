import react, {Fragment} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

class Navbar extends react.Component{
	constructor(props){
		super(props)
	}

	render(){
		console.log('navbar');
		return(
			<header id={this.props.Hide && 'hidden'}>
				HEADER
				{this.props.children}
			</header>
		)
	}
}

export default Navbar;