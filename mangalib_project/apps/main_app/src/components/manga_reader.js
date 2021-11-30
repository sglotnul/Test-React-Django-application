import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import axios from 'axios'; 
import Navbar from './navbar.js';

const history = createBrowserHistory();

class MangaReader extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			page: 1,
			chapterNumber: Symbol(1),
			chapter: {},
			loading: true,
			error: false,
			slidePage: false,
		}
		this.imgRef = react.createRef();
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
	    	if(!data.number_of_pages) throw new Error('not found');
	    	this.setState({page: prevNumber > data.number ? data.number_of_pages : Math.min(this.state.page, data.number_of_pages)});
	    	this.setState({chapter: data});
	    	localStorage.setItem(this.props.Data.slug, data.number);
		})
		.catch(()=> {
			this.setState({error: true})
		})
		.finally(()=> this.setState({loading: false}))
	}

	onDataLoad(){
		if(this.props.Loading) return;
		window.scrollTo(0, 0);
		let data = this.props.Data;
		let qs = new URLSearchParams(window.location.search);
		this.setState({chapterNumber: Symbol(+qs.get('chapter') || JSON.parse(localStorage.getItem(data.slug)) || 1)});
		this.setState({page: Math.max(+qs.get('page') || 1, 1)});
	}

	componentDidMount(){
		this.onDataLoad();
	}

	componentDidUpdate(prevProps, prevState){
		let data = this.props.Data;
		if(prevProps.Data !== data) this.onDataLoad();
		if(prevState.chapterNumber !== this.state.chapterNumber) this.getChapterData(prevState.chapterNumber.value);
		if((prevState.chapterNumber !== this.state.chapterNumber) || (prevState.page !== this.state.page)){
			history.replace(window.location.pathname + `?chapter=${this.state.chapterNumber.value}&page=${this.state.page}`);
		};
	}

	slidePage(page){
		let totalChapter = this.state.chapterNumber.value;
		let changePage = p=>{
			this.setState({slidePage: true});
			this.setState({chapterNumber: Symbol(p)});
			this.setState({page: 1});
		}			
		if(page > this.state.chapter.number_of_pages){
			if(totalChapter < this.props.Data.number_of_chapters) changePage(totalChapter + 1)
		} else if(page < 1){
			if(totalChapter > 1) changePage(totalChapter - 1);
		} else{
			this.setState({page: page});
			this.imgRef.current.onload = ()=> this.setState({slidePage: true});
		}
	}

	render(){
		let {page, chapter, loading, error} = this.state;
		let data = this.props.Data
		return(
			<>
				<Navbar WillHide={history.location.pathname.indexOf('read') !== -1} Slide={this.state.slidePage} OnSlide={this.setState.bind(this, {slidePage: false})}>
					<Link to={{pathname: `/manga/${data.id}`, state: { fromDashboard: true }}}>{data.title}</Link>
				</Navbar>
				<div className="content">
					<div className="manga-page">
						{!error && !loading && !this.props.Error && (
							<>
								<div className="page-change-arrow" onClick={()=> this.slidePage(page - 1)}/>
								<img className="page-image" src={`/media/chapters/${data.slug}/${chapter.number}/${page}.jpg`} ref={this.imgRef}/>
								<div className="page-change-arrow" onClick={()=> this.slidePage(page + 1)}/>
							</>
						)}
						{loading && !this.props.Error && <div className="loading-spinner"/>}
						{(error || this.props.Error) && <p>not found</p>}
					</div>
				</div>
			</>
		)
	}
}

export default MangaReader;