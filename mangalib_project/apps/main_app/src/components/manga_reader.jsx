import react, {Fragment, useState, useEffect, useRef, useCallback, useMemo} from 'react';
import reactDOM from 'react-dom';
import {Link, useLocation, useHistory} from 'react-router-dom';
import axios from 'axios'; 
import Navbar from './navbar.jsx';
import Loader from './loader.jsx';
import NotFoundError from './not_found.jsx';
import useObserverCallback from './hooks/useObserverCallback.jsx';
import useUpdateData from './hooks/useUpdateData.jsx';

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

function getNumericParam(name, queryObj){
	return +queryObj.get(name) || 1;
}

function scrollToTotalPage(page){
	const elem = document.getElementById(page);
	if(elem) document.getElementById(page).scrollIntoView(true);
}

function getNavbarState(prevScroll, func){
	return function(){
		func(window.pageYOffset > prevScroll.current);
		prevScroll.current = window.pageYOffset;
	}
}

function hideNavbarForcibly(ref, callback){
	let prevRef = ref.current;
	ref.current = -1;
	callback(true);
}

function getTotalPage(page, number_of_pages, func){
	let totalPage = page;
	let cancel;
	return function(){
		if(cancel) cancel();
		let canceled = false;
		cancel = ()=> canceled = true;
		setTimeout(()=> {
			let nextPage = totalPage;
			let totalPageElem = document.getElementById(nextPage);
			if(!totalPageElem || canceled || !number_of_pages) return;
			let totalPageElemTopCoords = totalPageElem.getBoundingClientRect().top;
			if(totalPageElemTopCoords > 0){
				while(nextPage > 1){
					let e = document.getElementById(nextPage - 1);
					if(!e) break;
					let margin = e.getBoundingClientRect().top;
					if(margin > 0){
						nextPage--;
					} else break;
				}
			} else if(totalPageElemTopCoords < 0){
				while(nextPage < number_of_pages){
					let e = document.getElementById(nextPage + 1);
					if(!e) break;
					let margin = e.getBoundingClientRect().top;
					if(margin < document.documentElement.clientHeight){
						nextPage++;
					} else break;
				}
			}
			totalPage = nextPage
			func(nextPage);
		}, 200);
	}
}

export default function MangaReader(props){
	const [displayAsList, setDisplayMode] = useState(1);
	const [page, setPage] = useState(1);
	const [visiblePages, setVisiblePages] = useState([]);
	const [chapterNumber, setChapterNumber] = useState(null);
	const [hideNavbar, setHideNavbar] = useState(false);

	const history = useHistory();
	const location = useLocation();

	const prevScroll = useRef(document.documentElement.clientHeight);

	const {Data: mangaData} = props;
	const {responseData: chapterData, loading, error} = useUpdateData(`/api/manga/${mangaData.id}/chapter/${chapterNumber}`, [chapterNumber, mangaData], !!chapterNumber && !!mangaData.id);

	const showPage = useCallback((entry, observer)=> {
		let elem = entry.target;
		let id = +elem.id;
		elem.onload = function(e){
			const node = e.target;
			if(node.getBoundingClientRect().top < 0) node.scrollIntoView(true);
		}
		setVisiblePages(prevPages=> [...prevPages, id]);
		observer.unobserve(elem);
	}, [chapterData]);
	const observePage = useObserverCallback(showPage, {rootMargin: '-10px',});
	const observePageRef = useCallback(node=> {
		if(!node) return;
		if(node.id == page) scrollToTotalPage(page);
		observePage(node);
	}, [observePage]);

	const slideNext = useCallback(()=> {
		if((page == chapterData.number_of_pages) || displayAsList){
			setPage(1);
			setChapterNumber(Math.min(chapterData.number + 1, mangaData.number_of_chapters));
		} else setPage(page + 1);
	}, [page, chapterData, mangaData, displayAsList]);

	const slidePrevious = useCallback(()=> {
		if((page == 1) || displayAsList){
			setPage(1);
			setChapterNumber(Math.max(chapterData.number - 1, 1));
		} else setPage(page - 1);
	}, [page, chapterData, mangaData, displayAsList]);

	const changeDisplayMode = useCallback(()=> setDisplayMode(prevMode=> !prevMode), []);

	const totalPageObserve = useCallback(getTotalPage(page, chapterData.number_of_pages, setPage), [chapterData]);

	useEffect(()=> {
		const setNavbarState = getNavbarState(prevScroll, setHideNavbar);
		window.addEventListener('scroll', setNavbarState);

		const qs = new URLSearchParams(location.search);
		setChapterNumber(getNumericParam('chapter'));
		setPage(getNumericParam('page'));
		return ()=> window.removeEventListener('scroll', setNavbarState);
	}, []);

	useEffect(()=> {
		window.scrollTo(0, 0);
		setVisiblePages([]);
	}, [chapterNumber, mangaData]);

	useEffect(()=> {
		if(!chapterNumber) return;
		scrollToTotalPage(page);
		const iBegUToHideIt = ()=> hideNavbarForcibly(prevScroll, setHideNavbar);
		setTimeout(iBegUToHideIt); //AAAAAAAAAAAAA
	}, [displayAsList]);

	useEffect(()=> {
		if(!displayAsList){
			scrollToTotalPage(page);
			hideNavbarForcibly(prevScroll, setHideNavbar);
		};
		if(chapterNumber !== null){
			const qs = new URLSearchParams({
				chapter: chapterNumber,
				page: page,
			});
			history.replace({
				pathname: location.pathname,
				search: qs.toString(),
			});
		}
	}, [chapterData, page]);

	useEffect(()=> {
		const onScroll = totalPageObserve;
		if(displayAsList) window.addEventListener('scroll', onScroll);
		return ()=> window.removeEventListener('scroll', onScroll);
	}, [chapterData, displayAsList]);

	const errorWasRised = error || props.Error;
	const dataStillLoading = loading || props.Loading;

	return(
		<>
			<LinkToManga Manga={mangaData}/>
			<Navbar Hide={hideNavbar}>
				<button onClick={changeDisplayMode}>Изменить режим чтения</button>
			</Navbar>
			<div className="content">
				<div className="manga-page">
					{!errorWasRised && !dataStillLoading && <PageList
						Page={page}
						Chapter={chapterData}
						Data={mangaData}
						DisplayAsList={displayAsList}
						VisiblePages={visiblePages}
						SlideNext={slideNext}
						SlidePrevious={slidePrevious}
						Ref={observePageRef}
					/>}
					{dataStillLoading && !props.Error && <Loader/>}
					{errorWasRised && <NotFoundError/>}
				</div>
			</div>
		</>
	)
}

function LinkToManga(props){
	const {Manga} = props;
	const container = document.querySelector('.first-header-menu');
	if(!container) return null;
	return reactDOM.createPortal(
		<Link to={{pathname: `/manga/${Manga.id}`}}>{Manga.title}</Link>
	, container)
}

function PageList(props){
	const {Page, Chapter, Data, DisplayAsList, VisiblePages, SlideNext, SlidePrevious, Ref} = props;
	const getSrc = index=> VisiblePages.includes(index) && `/media/chapters/${Data.slug}/${Chapter.number}/${index}.jpg`;
	const getImageContainerClassName = index=> 'page-wrapper' + ((!DisplayAsList && (index !== Page)) ? ' hidden' : '');
	const getDataCurentAttribute = index=> (index == Page) ? {['data-current']: "true"} : {};
	const onImageLoad = e=> delete e.target.closest('div').dataset.loaded;
	const range = useMemo(()=> Array.from(new Range(1, Chapter.number_of_pages)), [Chapter]);

	return(
		<div className="page-list" id={DisplayAsList && "incolumn"}>
			{range.map((number, index)=> (
				<div 
					{...getDataCurentAttribute(number)} 
					className={getImageContainerClassName(number)} 
					id={number} 
					data-loaded="false" 
					onLoad={onImageLoad}
					ref={Ref}
				>
					<img className="page-image" src={getSrc(number)}/>
				</div>						
			))}
			<ReaderMenu
				DisplayAsList={DisplayAsList}
				SlidePrevious={SlidePrevious}
				SlideNext={SlideNext}
			/>
		</div>
	)
}

function ReaderMenu(props){
	const {DisplayAsList, SlideNext, SlidePrevious} = props;

	return(
		<div className={'reader-menu' + (!DisplayAsList ? ' absolute' : '')}>
			<div className={`page-change-${DisplayAsList ? 'btn' : 'area'}`} onClick={SlidePrevious}/>
			<div className={`page-change-${DisplayAsList ? 'btn' : 'area'}`} onClick={SlideNext}/>
		</div>
	)
}
