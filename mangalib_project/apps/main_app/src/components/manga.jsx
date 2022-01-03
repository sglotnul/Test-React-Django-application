import {Fragment, useState, useEffect} from 'react';
import {Route, Switch, Link} from 'react-router-dom';
import axios from 'axios'; 
import Navbar from './navbar.jsx';
import MangaReader from './manga_reader.jsx';
import Loader from './loader.jsx';
import NotFoundError from './not_found.jsx';

export default function Manga(props){
	const id = props.match.params.id;

	const [mangaData, setMangaData] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(()=> {
		setLoading(true);
		axios({
		    method: 'GET',
		    url: `/api/manga/${id}`,
	    })
	    .then(({data})=> {
	    	if(!data.result) throw new Error('not found');
	    	setMangaData(data.data);
		})
		.catch(()=> setError(true))
		.finally(()=> setLoading(false))
	}, []);

	return(
		<Switch>
			<Route path={`/manga/${id}/read`} render={()=> <MangaReader Err={error} Loading={loading} Data={mangaData}/>}/>
			<Route path={`/manga/${id}`} render={()=> <MangaMainPage Err={error} Loading={loading} Data={mangaData}/>}/>
		</Switch>
	)
}

function MangaMainPage(props){
	const {Data, Loading, Err} = props;

	return(
		<>
			<Navbar/>
			<div className="content">
				<div className="default-page">
					{!Loading && !Err && <DataSection Data={Data}/>}
					{Loading && <Loader/>}
					{Err && <NotFoundError/>}
				</div>
			</div>
		</>
	)
}

function DataSection(props){
	const {Data} = props;

	return(
		<div className="data-section">
			<img src={Data.preview}/>
			<span>{Data.description}</span>
			<Link to={{pathname: `/manga/${Data.id}/read`, state: { fromDashboard: true }}}>READ!</Link>
		</div>
	)
}