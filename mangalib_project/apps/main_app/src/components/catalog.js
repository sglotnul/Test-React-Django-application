import react, {Fragment, useState, useEffect, useCallback, useRef} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import axios from 'axios'; 
import {FilterModal} from './modal.js';
import Navbar from './navbar';
import SearchPanel from './search_panel.js';
import Loader from './loader.js';
import NotFoundError from './not_found.js';

const history = createBrowserHistory();

function turnIntoUrlFormat(categories, order, orderDirection, search){
	return{
		categories: categories.join(','),
		order_by: '-'.repeat(+!orderDirection) + order,
		search: search,
	}
}

function categoriesListUpdate(updateCategoriesFunc){
	axios({
	    method: 'GET',
	    url: '/api/categories/',
    })
    .then(res=> {
    	let {result, data} = res.data;
    	if(!result) return;
		updateCategoriesFunc(data.reduce((obj, {id, ...otherData})=> Object.assign({}, obj, {[id]: otherData}), {}));
	})
}

function setOrdering(queryString, updateOrderFunc, updateOrderDirectionFunc){
	let order = queryString.get('order_by') || 'title';
	let dir = true;
	if(order.startsWith('-')){
		order = order.slice(1);
		dir = false;
	};
	updateOrderFunc(order);
	updateOrderDirectionFunc(dir);
}

function setAppliedCategoriesList(queryString, updateAppliedCategoriesFunc){
	const categories = queryString.get('categories');
	const categoriesSet = new Set(categories ? categories.split(',') : []);
	updateAppliedCategoriesFunc(Array.from(categoriesSet));
}

function setSearchString(queryString, updateSearchFunc){
	const searchString = queryString.get('search') || '';
	updateSearchFunc(searchString);
}

function updateQueryString(categories, order, orderDirection, search){
	let queryObj = turnIntoUrlFormat(categories, order, orderDirection, search);
	let searchParams = new URLSearchParams('');
	for(let [key, value] of  Object.entries(queryObj)){
		if(value) searchParams.set(key, value);
	}
	let queryString = searchParams.toString()
	history.replace(window.location.pathname + '?'.repeat(+!!queryString) + queryString);
}

export default function Catalog(props){
	const [categories, setCategories] = useState({});
	const [appliedCategories, setAppliedCategories] = useState([]);
	const [order, setOrder] = useState('');
	const [orderDirection, setOrderDirection] = useState(1);
	const [search, setSearch] = useState('');
	const [modalStatus, setModalStatus] = useState(false);

	useEffect(()=> {
		const qs = new URLSearchParams(window.location.search);
		categoriesListUpdate(setCategories);
		setAppliedCategoriesList(qs, setAppliedCategories);
		setOrdering(qs, setOrder, setOrderDirection);
		setSearchString(qs, setSearch);
	}, []);

	useEffect(()=> {
		updateQueryString(appliedCategories, order, orderDirection, search);
	}, [appliedCategories, order, orderDirection, search]);

	return(
		<>
			<SearchPanel Search={search} OnSearch={s=> setSearch(s)}/>
			<Navbar>
				<div className="modal-open-arrow" onClick={()=> setModalStatus(true)}/>
			</Navbar>
			<div className="content">
				<div className="default-page">
					<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} OnUpdate={()=> null}/>
					<InfiniteScroll 
						AppliedCategoryList={appliedCategories} 
						Order={order} 
						OrderDir={orderDirection}
						Search={search}
					/>
					<FilterModal 
						Status={modalStatus}
						OnUpdate={()=> setModalStatus(false)}
						CategoryList={categories} 
						AppliedCategoryList={appliedCategories} 
						Order={order} 
						OrderDir={orderDirection}
					/>
				</div>
	        </div>
        </>
	)
}

function useUpdateMangaList(page, ...params) {
	const [mangaList, setMangaList] = useState([]);
	const [numberOfPages, setNumberOfPages] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(setMangaList.bind(null, []), [...params]);

	useEffect(()=> {
		const queryParams = Object.fromEntries(new URLSearchParams(history.location.search));
		let cancel;
		setLoading(true);
		setError(false);
		axios({
			method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign(queryParams, {page: page}),
		    cancelToken: new axios.CancelToken(c=> cancel = c),
		}).then(res => {
			let {data: manga, number_of_pages} = res.data;
	    	if(!number_of_pages) throw new Error('not found');
	    	setNumberOfPages(number_of_pages);
	    	setMangaList(prevMangaList=> [...prevMangaList, ...manga]);
		}).catch(e => {
			if(axios.isCancel(e)) return;
			setError(true);
		}).finally(()=> setLoading(false));
		return cancel;
	}, [page, ...params]);

	return {loading, error, mangaList, numberOfPages};
}

function InfiniteScroll(props){
	const [page, setPage] = useState([]);

	const {AppliedCategoryList, Order, OrderDir, Search} = props;
	const {loading, error, mangaList, numberOfPages} = useUpdateMangaList(page, AppliedCategoryList, Order, OrderDir, Search);

	const observer = useRef();
	const lastElemRef = useCallback(node=> {
		if(observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries, observer)=> {
			if(entries[0].isIntersecting){
				if(page < numberOfPages) setPage(page + 1);
			}
		})
		if(node) observer.current.observe(node);
	});

	useEffect(setPage.bind(null, 1), [AppliedCategoryList, Order, OrderDir, Search]);

	return(
		<div className="container">
			{mangaList.map((m, index)=> <MangaCard key={index} Data={m} Ref={index + 1 == mangaList.length ? lastElemRef : null}/>)}
			{loading && <Loader/>}
			{error && <NotFoundError/>}
		</div>
	)
}

class MangaCard extends react.Component{
	constructor(props){
		super(props);
	}

	render(){
		const {Data, Ref} = this.props;

		return(
			<Link to={{pathname: `/manga/${Data.id}`, state: {fromDashboard: true}}} className="card" ref={Ref}>
				{Data.title}
			</Link>
		)
	}
}

class CategoriesBar extends react.Component{
	constructor(props){
		super(props);
	}

	onCategoryDelete(id){
		let newCatList = this.props.AppliedCategories.reduce((list, cat)=> {
			if(cat == id){
				return list;
			}
			return [...list, cat];
		}, [])
		this.props.OnUpdate({appliedCategories: newCatList});
	}

	render(){
		const {AppliedCategories, Categories} = this.props;

		return(
			<ul className="categories-list">
				{AppliedCategories.map(id=> {
					let category = Categories[id];
					if(category) return <li className="category-item" key={id} onClick={()=> this.onCategoryDelete(id)}>{category.title}<div className="closing-area"/></li>;
					return null;
				})}
			</ul>
		)
	}
}