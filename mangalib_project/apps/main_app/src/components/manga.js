import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Route, Switch, Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import axios from 'axios'; 
import Navbar from './navbar';

const history = createBrowserHistory();

export default class Manga extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			data: {},
			loading: true,
			error: false,
			fixNavbar: false,
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
			<>
				<Navbar Fixed={this.state.fixNavbar}>
				</Navbar>
				<div className="content">
					<div className="default-page">
						{!error && (history.location.pathname.indexOf('read') !== -1 ? <MangaReader Data={data} OnMount={this.setState.bind(this, {fixNavbar: true})}/> : <MangaMainPage Loading={loading} Data={data} OnMount={this.setState.bind(this, {fixNavbar: false})}/>)}
						{error && <p>not found</p>}
					</div>
				</div>
			</>
		)
	}
}

class MangaMainPage extends react.Component{

	componentDidMount(){
		this.props.OnMount();
	}

	render(){
		return(
			<>
				<div className="data-section">
					<img src={this.props.Data.preview}/>
					<span>{this.props.Data.description}</span>
				</div>
				{this.props.Loading && <div className="loading-spinner"/>}
			</>
		)
	}
}

class MangaReader extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			page: 1,
			chapterNumber: Symbol(1),
			chapter: {},
			loading: true,
			error: false,
		}
	}

	getChapterData(prevNumber){
		this.setState({error: false});
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: `/api/manga/${this.props.Data.id}/chapter/${this.state.chapterNumber.value}`,
	    })
	    .then(res=> {
	    	let {data} = res.data;
	    	this.setState({page: prevNumber <= data.number ? 1 : data.number_of_pages});
	    	if(!data.number_of_pages) throw new Error('not found')
	    	this.setState({chapter: data});
	    	localStorage.setItem(this.props.Data.slug, data.number);
		})
		.catch(()=> this.setState({error: true}))
		.finally(()=> this.setState({loading: false}));
	}

	componentDidMount(){
		this.props.OnMount();
	}

	componentDidUpdate(prevProps, prevState){
		let data = this.props.Data;
		if(prevProps.Data !== data){
			let qs = new URLSearchParams(window.location.search);
			this.setState({chapterNumber: Symbol(+qs.get('chapter') || JSON.parse(localStorage.getItem(data.slug)) || 1)});
			this.setState({page: Math.max(+qs.get('page') || 1, 1)});
		}
		if(prevState.chapterNumber !== this.state.chapterNumber) this.getChapterData(prevState.chapterNumber.value);
		if((prevState.chapterNumber !== this.state.chapterNumber) || (prevState.page !== this.state.page)){
			history.replace(window.location.pathname + `?chapter=${this.state.chapterNumber.value}&page=${this.state.page}`);
			window.scrollTo(0 ,0);
		};
	}

	slidePage(page){
		let totalChapter = this.state.chapterNumber.value;
		if(page > this.state.chapter.number_of_pages){
			if(totalChapter >= this.props.Data.number_of_chapters) return;
			return this.setState({chapterNumber: Symbol(totalChapter + 1)});
		} 
		if(page < 1){
			if(totalChapter <= 1) return;
			return this.setState({chapterNumber: Symbol(totalChapter - 1)});
		};
		this.setState({page: page});
	}

	render(){
		let {page, chapter, loading, error} = this.state;
		let data = this.props.Data
		return(
			<div>
				{error || loading ? null : (
					<>
						<div className="page-change-arrow" onClick={()=> this.slidePage(page - 1)}/>
							<img className="page-image" src={`/media/chapters/${data.slug}/${chapter.number}/${page}.png`}/>
						<div className="page-change-arrow" onClick={()=> this.slidePage(page + 1)}/>
					</>
				)}
				{loading && <div className="loading-spinner"/>}
				{error && <p>not found</p>}
			</div>
		)
	}
}