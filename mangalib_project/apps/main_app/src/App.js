import './style.css';
import './loader.svg';
import {Fragment, useEffect} from 'react';
import Navbar from './components/navbar.js';
import Footer from './components/footer.js';
import Catalog from './components/catalog.js';
import Manga from './components/manga.js';
import {BrowserRouter as Router, Switch, Route, Link, useHistory} from 'react-router-dom';

export default function App(props){
	const history = useHistory();

	useEffect(()=> {
		Object.defineProperty(Symbol.prototype, "value", {
			get(){
				return parseInt(this.description);
			}
		})
	}, []);

	return(
		<Router>
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

