import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Route, Switch, Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import axios from 'axios'; 

const history = createBrowserHistory();

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
	    	this.setState({data: data.data})
		})
		.catch(()=> this.setState({error: true}))
		.finally(()=> this.setState({loading: false}));
	}

	render(){
		let {data, loading, error} = this.state;
		return(
			<div className="content">
				<div className="default-page">
					{this.state.data.slug ? 
						<Switch>
							<Route path={`/manga/${this.props.match.params.id}/read`} exect component={()=> <MangaReader Data={data}/>}/>
							<Route path={`/manga/${this.props.match.params.id}`} component={()=> <MangaMainPage Data={data}/>}/>
						</Switch>
						: null
					}
					{loading && <div className="loading-spinner"/>}
					{error && <p>not found</p>}
				</div>
			</div>
		)
	}
}

class MangaMainPage extends react.Component{
	render(){
		return(
			<div className="data-section">
				<img src={this.props.Data.preview}/>
				<span>{this.props.Data.description}</span>
			</div>
		)
	}
}

class MangaReader extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			page: 0,
			chapterNumber: 0,
			chapter: {},
			loading: true,
			error: false,
		}
	}

	getChapterData(){
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: `/api/manga/${this.props.Data.id}/chapter/${this.state.chapterNumber}`,
	    })
	    .then(res=> {
	    	let {result, data} = res.data;
	    	if(!data.number_of_pages) throw new Error('not found')
	    	this.setState({chapter: data});
	    	if(this.state.page > data.number_of_pages) this.setState({page: 1});
	    	localStorage.setItem(this.props.Data.slug, data.number);
		})
		.catch(()=> this.setState({error: true}))
		.finally(()=> this.setState({loading: false}));
	}

	componentDidMount(){
		let data = this.props.Data;
		let qs = new URLSearchParams(window.location.search);
		let chapter = qs.get('chapter') || JSON.parse(localStorage.getItem(data.slug)) || 1;
		let page = Math.max(qs.get('page') || 1, 1);
		this.setState({chapterNumber: chapter});
		this.setState({page: page});
	}

	componentDidUpdate(prevProps, prevState){
		if(prevState.chapterNumber !== this.state.chapterNumber) this.getChapterData();
		if((prevState.chapterNumber !== this.state.chapterNumber) || (prevState.page !== this.state.page)){
			history.replace(window.location.pathname + `?chapter=${this.state.chapterNumber}&page=${this.state.page}`)
		};
	}

	render(){
		let {page, chapter, loading, error} = this.state;
		let data = this.props.Data;
		return(
			<div>
				{chapter.number && (
					<>
						<div className="page-change-arrow" onClick={()=> this.setState({page: Math.max(page - 1, 1)})}/>
						<img className="page-image" src={`/media/chapters/${data.slug}/${chapter.number}/${page}.jpg`}/>
						<div className="page-change-arrow" onClick={()=> this.setState({page: Math.min(page + 1, data.count_of_pages)})}/>
					</>)
				}
				{loading && <div className="loading-spinner"/>}
				{error && <p>not found</p>}
			</div>
		)
	}
}