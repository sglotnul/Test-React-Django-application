import react, {Fragment} from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

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
				HEADER
				<Router>
					<Switch>
						<Route path="/manga" component={()=> <div className="modal-open-arrow" onClick={()=> window.dispatchEvent(new Event('open-filter-modal'))}>=</div>}/>
					</Switch>
				</Router>
			</header>
		)
	}
}

export default Navbar;