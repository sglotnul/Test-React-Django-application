import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Route, Switch, Link} from 'react-router-dom';
import axios from 'axios'; 
import Navbar from './navbar.js';
import MangaReader from './manga_reader.js';

export default class Manga extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			data: {},
			loading: true,
			error: false,
		}
	}

	componentDidMount(){
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: `/api/manga/${this.props.match.params.id}`,
	    })
	    .then(({data})=> {
	    	if(!data.result) throw new Error('not found');
	    	this.setState({data: data.data});
		})
		.catch(()=> {
			this.setState({error: true});
		})
		.finally(()=> {
			this.setState({loading: false});
		})
	}

	render(){
		let {data, loading, error} = this.state;
		return(		
			<Switch>
				<Route path={`/manga/${this.props.match.params.id}/read`} render={()=> <MangaReader Error={error} Loading={loading} Data={data}/>}/>
				<Route path={`/manga/${this.props.match.params.id}`} render={()=> <MangaMainPage Error={error} Loading={loading} Data={data}/>}/>
			</Switch>
		)
	}
}

class MangaMainPage extends react.Component{
	render(){
		return(
			<>
				<Navbar/>
				<div className="content">
					<div className="default-page">
						{!this.props.Loading && !this.props.Error && (
							<div className="data-section">
								<img src={this.props.Data.preview}/>
								<span>{this.props.Data.description}</span>
								<Link to={{pathname: `/manga/${this.props.Data.id}/read`, state: { fromDashboard: true }}}>READ!</Link>
							</div>
						)}
						{this.props.Loading && <div className="loading-spinner centered"/>}
						{this.props.Error && <p>not found</p>}
					</div>
				</div>
			</>
		)
	}
}