import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import axios from 'axios'; 
import Navbar from './navbar.js';

const history = createBrowserHistory();

class Range{
	constructor(from=0, to, step=1){
		this.current = from;
		this.to = to;
		this.step = step;
		this.ascending = from < to;
	}
	[Symbol.iterator](){
		return this;
	}
	next(){
		if(this.ascending){
			if(this.current <= this.to){
				let current = this.current;
				this.current = current + this.step;
				return {
					done: false,
					value: current,
				}
			}
		} else{
			if(this.current >= this.to){
				let current = this.current;
				this.current = current - this.step;
				return {
					done: false,
					value: current,	
				}
			}
		}
		return {done: true};
	}
}

class MangaReader extends react.Component{
	#_prevScroll = document.documentElement.clientHeight + 1;

	constructor(props){
		super(props);
		this.state = {
			displayAsList: 1,
			page: 1,
			visiblePages: [],
			chapterNumber: 1,
			chapter: {},
			loading: true,
			error: false,
			hideNavbar: false,
		}
	}

	setObservers(){
		this.unObservePages();
		this.imgObserver = new IntersectionObserver((entries, observer)=> {
			entries.forEach(entry=> {
				if(entry.isIntersecting){
					let elem = entry.target;
					let id = +elem.id;
					let {visiblePages, page} = this.state;
					elem.onload = function(e){
						if(this.getBoundingClientRect().top < 0) this.scrollIntoView(true);
					}
					this.setState({visiblePages: [...visiblePages, id]});
					observer.unobserve(elem);
				}
			})
		}, {rootMargin: '-10px',});
	}

	observePages(){
		this.setObservers();
		document.querySelectorAll('.page-wrapper').forEach(e=> this.imgObserver.observe(e));
	}

	unObservePages(){
		if(this.imgObserver) this.imgObserver.disconnect();
	}

	scrollToTotalPage(page){
		const elem = document.getElementById(page);
		if(elem) document.getElementById(page).scrollIntoView(true);
	}

	getTotalPage(){
		let {page, chapter} = this.state;
		let totalPageElem = document.getElementById(page);
		if(!totalPageElem) return;
		let totalPageElemTopCoords = totalPageElem.getBoundingClientRect().top;
		let nextPage = page;
		if(totalPageElemTopCoords > 0){
			while(nextPage > 1){
				let e = document.getElementById(nextPage - 1);
				if(!e) break;
				let margin = e.getBoundingClientRect().top;
				if(margin >= 0){
					nextPage--;
				} else break;
			}
		} else if(totalPageElemTopCoords < 0){
			while(nextPage < chapter.number_of_pages){
				let e = document.getElementById(nextPage + 1);
				if(!e) break;
				let margin = e.getBoundingClientRect().top;
				if(margin <= document.documentElement.clientHeight){
					nextPage++;
				} else break;
			}
		}
		this.setState({page: nextPage});
	}

	totalPageObserve(){
		if(!this.state.displayAsList) return;
		if(this.onScrollRepeat) this.onScrollRepeat();
		let cancel = false;
		this.onScrollRepeat = ()=> cancel = true;
		setTimeout(()=> {
			if(cancel) return;
			this.getTotalPage();
		}, 75);
	}

	navbarObserve(){
		this.setState({hideNavbar: window.pageYOffset > this.#_prevScroll});
		this.#_prevScroll = window.pageYOffset;
	}

	getChapterData(){
		window.scrollTo(0 ,0);
		if(this.props.Data.id === undefined) return;
		this.setState({error: false});
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: `/api/manga/${this.props.Data.id}/chapter/${this.state.chapterNumber}`,
	    })
	    .then(res=> {
	    	let {data} = res.data;
	    	let {chapter, page} = this.state;
	    	if(!data.number_of_pages) throw new Error('not found');
	    	this.setState({
	    		chapter: data,
	    		page: chapter.number > data.number ? data.number_of_pages : Math.min(Math.max(page, 1), data.number_of_pages),
	    	});
		})
		.catch(()=> {
			this.setState({error: true})
		})
		.finally(()=> this.setState({loading: false}));
	}

	componentDidMount(){
		const qs = new URLSearchParams(window.location.search);
		this.setState({
			chapterNumber: +qs.get('chapter') || 1,
			page: +qs.get('page') || 1,
		});

		window.addEventListener('scroll', this.totalPageObserve.bind(this));
		window.addEventListener('scroll', this.navbarObserve.bind(this));
		this.getChapterData();
	}

	componentDidUpdate(prevProps, prevState){
		let data = this.props.Data;
		let {displayAsList, chapterNumber, page, visiblePages, chapter} = this.state;
		
		if((prevState.chapterNumber !== chapterNumber) || (prevProps.Data !== data)){
			this.setState({visiblePages: []});
			this.getChapterData();
		};
		if((prevState.chapter !== chapter) || (prevState.displayAsList !== displayAsList)){
			setTimeout(()=> {
				this.scrollToTotalPage(page);
				this.observePages();
			});
		};
		if((prevState.chapter !== chapter) || (prevState.page !== page)){
			if(!displayAsList) this.scrollToTotalPage(page);
			if(chapter.number) this.setState({visiblePages: [...visiblePages, page]});
			history.replace(window.location.pathname + `?chapter=${chapterNumber}&page=${page}`);
		};
	}

	slideNext(){
		let {page, chapter, displayAsList} = this.state;
		this.#_prevScroll = -1;
		if((page == chapter.number_of_pages) || displayAsList){
			this.setState({
				page: 1,
				chapterNumber: Math.min(chapter.number + 1, this.props.Data.number_of_chapters),
			})
		} else this.setState({page: page + 1});
	}

	slidePrevious(){
		let {page, chapter, displayAsList} = this.state;
		this.#_prevScroll = -1;
		if((page == 1) || displayAsList){
			this.setState({
				chapterNumber: Math.max(chapter.number - 1, 1),
			})
		} else this.setState({page: page - 1});
	}

	render(){
		let {displayAsList, page, visiblePages, chapter, loading, error, hideNavbar} = this.state;
		let data = this.props.Data;
		let range = Array.from(new Range(1, chapter.number_of_pages));
		return(
			<>
				<Navbar Hide={hideNavbar}>
					<Link to={{pathname: `/manga/${data.id}`, state: {fromDashboard: true}}}>{data.title}</Link>
					<button onClick={()=> this.setState({displayAsList: +!this.state.displayAsList})}></button>
				</Navbar>
				<div className="content">
					<div className="manga-page">
						{!error && !loading && !this.props.Error && (
							<>
								<div className="page-list" id={displayAsList && "incolumn"}>
									{range.map(index=> (
										<div className={'page-wrapper' + ((!displayAsList && (index !== page )) ? ' hidden' : '')} id={index} data-loaded="false" {...((index == page) ? {['data-initial']: "true"} : {})} onLoad={e=> delete e.target.closest('div').dataset.loaded}>
											<img className="page-image" src={visiblePages.includes(index) && `/media/chapters/${data.slug}/${chapter.number}/${index}.jpg`}/>
										</div>						
									))}
									<div className={'reader-menu' + (!displayAsList ? ' absolute' : '')}>
										<div className={`page-change-${displayAsList ? 'btn' : 'area'}`} onClick={this.slidePrevious.bind(this)}/>
										<div className={`page-change-${displayAsList ? 'btn' : 'area'}`} onClick={this.slideNext.bind(this)}/>
									</div>
								</div>
							</>
						)}
						{(loading || this.props.Loading) && !this.props.Error && <div className="loading-spinner centered"/>}
						{(error || this.props.Error) && <p>not found</p>}
					</div>
				</div>
			</>
		)
	}
}

export default MangaReader;