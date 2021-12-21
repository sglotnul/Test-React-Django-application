import './style.css';
import './loader.svg';
import react, {Fragment, useEffect} from 'react';
import Navbar from './components/navbar.js';
import Footer from './components/footer.js';
import Catalog from './components/catalog.js';
import Manga from './components/manga.js';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';

const history = createHistory();

export default function App(props){
	useEffect(()=> {
		Object.defineProperty(Symbol.prototype, "value", {
			get(){
				return parseInt(this.description) || 1;
			}
		})
	}, []);

	return(
		<Router history={history}>
			<Switch>
				<Route path="/manga/:id" component={Manga}/>
				<Route path="/mangalist" exect component={Catalog}/>
				<Route path="" exect component={Catalog}/>
			</Switch>
			<Footer/>
			<div id="modals__app"/>
		</Router>
	)
}

