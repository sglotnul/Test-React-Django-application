import './style.css'
import react, {Fragment} from 'react';
import Navbar from './components/navbar.js';
import Footer from './components/footer.js';
import Catalog from './components/catalog.js';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

class App extends react.Component{
	constructor(props){
		super(props);
	}
	render(){
		return (
			<Router history={history}>
				<Navbar/>
				<Switch>
					<Route path="/manga" component={Catalog}/>
					<Route path="" component={Catalog}/>
				</Switch>
				<Footer/>
				<div id="modals__app"/>
			</Router>
		);
	}
}

export default App;
