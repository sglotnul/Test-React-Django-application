import './style.css';
import './loader.svg';
import React, {Fragment, useState, useEffect} from 'react';
import {Switch, Route, Link, useLocation} from 'react-router-dom';
import Navbar from './components/navbar.jsx';
import Footer from './components/footer.jsx';
import Catalog from './components/catalog.jsx';
import Manga from './components/manga.jsx';
import useUpdateData from './components/hooks/useUpdateData.jsx';

export const UserContext = React.createContext({});

export default function App(props){
	const [conditionForUpdating, setConditionForUpdating] = useState(false);
	const {responseData: userData, loading, error} = useUpdateData(`/api/user`, [conditionForUpdating]);

	const location = useLocation();

	useEffect(()=> window.scrollTo(0, 0), [location.pathname]);

	return(
		<UserContext.Provider value={{userData, loading, error}}>
			<div id="App">
				<Switch>
					<Route path="/manga/:id" component={Manga}/>
					<Route path="/mangalist" exect component={Catalog}/>
					<Route path="" exect component={Catalog}/>
				</Switch>
				<Footer/>
				<div id="modals__app"/>
			</div>
		</UserContext.Provider>
	)
}

