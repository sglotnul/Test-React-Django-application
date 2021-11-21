import './style.css'
import react, {Fragment} from 'react';
import Navbar from './components/navbar.js';
import Footer from './components/footer.js';
import Catalog from './components/catalog.js';
import Manga from './components/manga.js';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

class App extends react.Component{
	constructor(props){
		super(props);
	}

	componentDidMount(){
		Object.defineProperty(Symbol.prototype, "value", {
	    get(){
	    	return parseInt(this.description) || 1;
    	}
    });
	}

	render(){
		return (
			<Router history={history}>
				<Navbar/>
				<Switch>
					<Route path="/manga/:id" component={Manga}/>
					<Route path="/mangalist" exect component={Catalog}/>
					<Route path="" exect component={Catalog}/>
				</Switch>
				<Footer/>
				<div id="modals__app"/>
			</Router>
		);
	}
}

export default App;
