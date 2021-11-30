import react, {Fragment} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

class Navbar extends react.Component{
	constructor(props){
		super(props)
		this.state = {
			hidden: false,
		}
	}

	onScroll(){
		let prevScroll = window.pageYOffset;
		return function(e){
			if(!this.props.Slide){
				this.setState({hidden: window.pageYOffset > prevScroll});
			} else{
				this.setState({hidden: true});
				this.props.OnSlide();
			}
			prevScroll = window.pageYOffset;
		}.bind(this);
	}

	componentDidMount(){
		window.onscroll = this.onScroll();
	}

	componentDidUpdate(prevProps){
		if(prevProps.Slide !== this.props.Slide){
			if(this.props.Slide) window.scrollTo(0, 70);
		}
	}

	render(){
		return(
			<header id={this.state.hidden && this.props.WillHide && 'hidden'}>
				HEADER
				{this.props.children}
			</header>
		)
	}
}

export default Navbar;