import react, {Fragment, useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {Link, useHistory} from 'react-router-dom';
import axios from 'axios'; 
import {FilterModal} from './modal.js';
import Navbar from './navbar';
import SearchPanel from './search_panel.js';
import Loader from './loader.js';
import NotFoundError from './not_found.js';
import useUpdateMangaList from './hooks/useUpdateMangaList.js';
import useObserverCallback from './hooks/useObserverCallback.js';

export function turnObjectElementsIntoUrlFormat({appliedCategories, order, orderDirection, search}){
	let queryObj = {
		categories: appliedCategories ? appliedCategories.join(',') : [],
		order_by: order ? '-'.repeat(+!orderDirection) + order : '',
		search: search.trim(),
	};

	Object.entries(queryObj).forEach(([key, value])=> {
		if(!value) delete queryObj[key];
	})

	return queryObj;
}

function getQueryString(...params){
	let queryObj = turnObjectElementsIntoUrlFormat(...params);
	let searchParams = new URLSearchParams('');
	for(let [key, value] of  Object.entries(queryObj)){
		if(value) searchParams.set(key, value);
	}
	return searchParams.toString()
}

function updateQueryString(history, queryObj){
	const queryString = getQueryString(queryObj);
	history.replace(window.location.pathname + '?'.repeat(+!!queryString) + queryString);
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
	let dir = 1;
	if(order.startsWith('-')){
		order = order.slice(1);
		dir = 0;
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

function getParamsFromUrl(setCategoryList, setOrder, setOrderDirection, setSearch){
	const qs = new URLSearchParams(window.location.search);
	setAppliedCategoriesList(qs, setCategoryList);
	setOrdering(qs, setOrder, setOrderDirection);
	setSearchString(qs, setSearch);
}

export default function Catalog(props){
	const [categories, setCategories] = useState({});
	const [appliedCategories, setAppliedCategories] = useState([]);
	const [order, setOrder] = useState('');
	const [orderDirection, setOrderDirection] = useState(1);
	const [search, setSearch] = useState('');
	const [modalStatus, setModalStatus] = useState(false);

	const history = useHistory();

	const showModal = useCallback(()=> setModalStatus(true), []);
	const closeModal = useCallback(()=> setModalStatus(false), []);

	const chageState = (callback, ...state)=> {
		return function(){
			callback(...state);
		}
	}

	const queryObject = useMemo(()=> {
		return {
			appliedCategories, 
			order,
			orderDirection,
			search,
		}
	}, [appliedCategories, order, orderDirection, search])

	useEffect(()=> {
		categoriesListUpdate(setCategories);
		getParamsFromUrl(setAppliedCategories, setOrder, setOrderDirection, setSearch);
	}, []);

	useEffect(()=> updateQueryString(history, queryObject), [queryObject])

	return(
		<>
			<SearchPanel Search={search} OnSearch={setSearch}/>
			<Navbar>
				<div className="modal-open-arrow" onClick={showModal}/>
			</Navbar>
			<div className="content">
				<div className="default-page">
					<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} ChangeAppliedCategoryList={setAppliedCategories}/>
					<InfiniteScroll 
						Query={queryObject}
					/>
					<FilterModal 
						Status={modalStatus}
						CategoryList={categories} 
						AppliedCategoryList={appliedCategories} 
						Order={order} 
						OrderDir={orderDirection}
						CloseModal={closeModal}
						ChangeAppliedCategoryList={setAppliedCategories}
						ChangeOrdering={setOrder}
						ChangeOrderingDirection={setOrderDirection}
					/>
				</div>
	        </div>
        </>
	)
}

function InfiniteScroll(props){
	const [page, setPage] = useState(1);

	const haveUrlParamsReceived = useRef(false);
	
	const {Query: query} = props;
	const {mangaList, numberOfPages, loading, error} = useUpdateMangaList(page, query, haveUrlParamsReceived.current);

	const lastElemRef = useObserverCallback(()=> {
		if(page < numberOfPages) setPage(page + 1);
	}, [page, numberOfPages]);

	useEffect(()=> {
		haveUrlParamsReceived.current = true;
		setPage(1);
	}, [query]);

	return(
		<div className="container">
			{mangaList.map((manga, index)=> <MangaCard key={index} Data={manga} Ref={(index + 1 == mangaList.length) ? lastElemRef : null}/>)}
			{loading && <Loader/>}
			{error && <NotFoundError/>}
		</div>
	)
}

function MangaCard(props){
	const {Data, Ref} = props;

	return(
		<Link to={{pathname: `/manga/${Data.id}`, state: {fromDashboard: true}}} className="card" ref={Ref}>
			{Data.title}
		</Link>
	)
}

function CategoriesBar(props){
	const {Categories, AppliedCategories, ChangeAppliedCategoryList} = props;

	const onCategoryDelete = useCallback(event=> {
		const id = parseInt(event.target.closest('li').id);
		let newCatList = AppliedCategories.reduce((list, cat)=> {
			if(cat == id){
				return list;
			}
			return [...list, cat];
		}, [])
		ChangeAppliedCategoryList(newCatList);
	}, [Categories, AppliedCategories]);

	return(
		<ul className="categories-list">
			{AppliedCategories.map(id=> {
				let category = Categories[id];
				if(!category) return null;
				return <li className="category-item" key={id} id={id}>{category.title}<div className="closing-area" onClick={onCategoryDelete}/></li>;
			})}
		</ul>
	)
}
