import react, {Fragment} from 'react';

class Navbar extends react.Component{
	constructor(props){
		super(props)
		this.state = {
			fixed: false
		}
	}

	componentDidMount(){
		window.addEventListener('scroll', e=> this.setState({fixed: document.documentElement.getBoundingClientRect().top < 0})) 
	}

	render(){
		return(
			<header id={this.state.fixed && 'fixed'}>
				
			</header>
		)
	}
}

export default Navbar;