import react, {Fragment, useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {Link, useHistory, useLocation} from 'react-router-dom';
import axios from 'axios'; 
import {FilterModal} from './modal.jsx';
import Navbar from './navbar';
import SearchPanel from './search_panel.jsx';
import Loader from './loader.jsx';
import NotFoundError from './not_found.jsx';
import useUpdateMangaList from './hooks/useUpdateMangaList.jsx';
import useObserverCallback from './hooks/useObserverCallback.jsx';

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

function updateQueryString(history, queryObj){
	const location = useLocation;
	const searchParams = new URLSearchParams(turnObjectElementsIntoUrlFormat(queryObj));
	history.replace({
		pathname: location.pathname,
		search: searchParams.toString(),
	});
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

function getCallback(func1, func2){
	return function(state){
		func1(state);
		func2(1);
	}
}

export default function Catalog(props){
	const [page, setPage] = useState(0);
	const [categories, setCategories] = useState({});
	const [appliedCategories, setAppliedCategories] = useState([]);
	const [order, setOrder] = useState('');
	const [orderDirection, setOrderDirection] = useState(1);
	const [search, setSearch] = useState('');
	const [modalStatus, setModalStatus] = useState(false);

	const history = useHistory();

	const queryObject = useMemo(()=> {
		return {
			appliedCategories, 
			order,
			orderDirection,
			search,
		}
	}, [appliedCategories, order, orderDirection, search])

	const {mangaList, numberOfPages, loading, error} = useUpdateMangaList(page, queryObject, !!page);

	const updatePageNumber = useCallback(()=> {
		if(page < numberOfPages) setPage(page + 1);
	}, [mangaList])
	const lastElemRef = useObserverCallback(updatePageNumber);

	const showModal = useCallback(()=> setModalStatus(true), []);
	const closeModal = useCallback(()=> setModalStatus(false), []);

	const changeAppliedCategories = useCallback(getCallback(setAppliedCategories, setPage), []);
	const changeOrder = useCallback(getCallback(setOrder, setPage), []);
	const changeOrderDirection = useCallback(getCallback(setOrderDirection, setPage), []);
	const changeSearch = useCallback(getCallback(setSearch, setPage), []);

	const chageState = (callback, ...state)=> {
		return function(){
			callback(...state);
		}
	}

	useEffect(()=> {
		setPage(1);
		categoriesListUpdate(setCategories);
		getParamsFromUrl(setAppliedCategories, setOrder, setOrderDirection, setSearch);
	}, []);

	useEffect(()=> updateQueryString(history, queryObject), [queryObject]);

	return(
		<>
			<Navbar>
				<SearchPanel Search={search} OnSearch={changeSearch}/>
				<div className="modal-open-arrow" onClick={showModal}/>
			</Navbar>
			<div className="content">
				<div className="default-page">
					<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} ChangeAppliedCategoryList={changeAppliedCategories}/>
					<div className="container">
						{mangaList.map((manga, index)=> <MangaCard key={index} Data={manga} Ref={(index + 1 == mangaList.length) ? lastElemRef : null}/>)}
						{loading && <Loader/>}
						{error && <NotFoundError/>}
					</div>
					<FilterModal 
						Status={modalStatus}
						CategoryList={categories} 
						AppliedCategoryList={appliedCategories} 
						Order={order} 
						OrderDir={orderDirection}
						CloseModal={closeModal}
						ChangeAppliedCategoryList={changeAppliedCategories}
						ChangeOrdering={changeOrder}
						ChangeOrderingDirection={changeOrderDirection}
					/>
				</div>
	        </div>
        </>
	)
}

function MangaCard(props){
	const {Data, Ref} = props;

	return(
		<Link to={{pathname: `/manga/${Data.id}`, state: {fromDashboard: true}}} className="card" ref={Ref} id={Data.id}>
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