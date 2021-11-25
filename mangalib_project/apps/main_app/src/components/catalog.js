import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import axios from 'axios'; 
import FilterModal from './modal.js';
import Navbar from './navbar'

const history = createBrowserHistory();

class Catalog extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			categories: {},
			appliedCategories: [],
			order: '',
			orderDirection: true,
			modalStatus: false,
		};
	}

	componentDidMount(){	
		let qs = new URLSearchParams(window.location.search);
		this.categoriesListUpdate();
		this.setAppliedCategoriesList(qs);
		this.setOrdering(qs);
	}

	componentDidUpdate(prevProps, prevState){
		const {categories, appliedCategories, order, orderDirection} = this.state;
		if((prevState.appliedCategories !== appliedCategories) || (prevState.order !== order) || (prevState.orderDirection !== orderDirection)){
			this.updateQueryString();
		}
	}

	categoriesListUpdate(){
		axios({
		    method: 'GET',
		    url: '/api/categories/',
	    })
	    .then(res=> {
	    	let {result, data} = res.data;
	    	if(!result) return;
			this.setState({categories: data.reduce((obj, {id, ...d})=> Object.assign({}, obj, {[id]: d}), {})});
		})
	}

	setOrdering(queryString){
		let order = queryString.get('order_by') || 'title';
		let dir = true;
		if(order.startsWith('-')){
			order = order.slice(1);
			dir = false;
		};
		this.setState({order: order});
		this.setState({orderDirection: dir});
	}

	setAppliedCategoriesList(queryString){
		const categories = queryString.get('categories');
		this.setState({appliedCategories: [...new Set(categories ? categories.split(',') : [])]});
	}

	updateQueryString(){
		let {appliedCategories: categories, order, orderDirection} = this.state;
		let queryObj = {
			categories: categories.join(','),
			order_by: '-'.repeat(+!orderDirection) + order,
		};
		let searchParams = new URLSearchParams('');
		for(let [key, value] of  Object.entries(queryObj)){
			if(value) searchParams.set(key, value);
		}
		let queryString = searchParams.toString()
		history.replace(window.location.pathname + '?'.repeat(+!!queryString) + queryString);
	}

	render(){
		let {categories, appliedCategories, order, orderDirection} = this.state;
		return(
			<>
				<Navbar Fixed={false}>
					<div className="modal-open-arrow" onClick={()=> this.setState({modalStatus: true})}/>
				</Navbar>
				<div className="content">
					<div className="default-page">
						<div className="catalog-menu"></div>
						<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} OnUpdate={this.setState.bind(this)}/>
						<InfiniteScroll 
							AppliedCategoryList={appliedCategories} 
							Order={order} 
							OrderDir={orderDirection}
						/>
						<FilterModal 
							Status={this.state.modalStatus}
							OnUpdate={this.setState.bind(this)}
							Loading={this.state.loading}
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
}

class InfiniteScroll extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			manga: [],
			page: 1,
			numberOfPages: 1,
			loading: true,
			reset: false, //reset - это костыль. Я хз, как помимо использования Symbol объекта в зачении page, заставить это обновляться так, как мне нужно.
		};
		this.lastElemRef = node=> {
			let {page, numberOfPages} = this.state;
			if(this.observer) this.observer.disconnect();
			this.observer = new IntersectionObserver(entries=> {
				if(entries[0].isIntersecting){
					if(page.value < numberOfPages) this.setState({page: Symbol(page.value + 1)});
				}
			})
			if(node) this.observer.observe(node);
		}
	}

	componentDidUpdate(prevProps, prevState){
		const update = (prevProps.AppliedCategoryList !== this.props.AppliedCategoryList) || (prevProps.Order !== this.props.Order) || (prevProps.OrderDir !== this.props.OrderDir);
		if(update){
			this.setState({manga: []});
			this.setState({page: Symbol(1)});
			this.setState({reset: true});
		}
		if((prevState.page !== this.state.page) || (prevState.reset !== this.state.reset && this.state.reset)){
			this.setState({reset: false})
			this.updateMangaList();
		};
	}

	updateMangaList(){
		if(this.cancel) this.cancel();

		let willCancel = false;
		this.cancel = ()=> willCancel = true;

		const params = Object.fromEntries(new URLSearchParams(history.location.search));
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign({}, params, {page: this.state.page.value}),
	    })
	    .then(res=> {
	    	let {result, data, 'number of pages': number_of_pages} = res.data;
	    	if(willCancel || !result) return;
			this.setState({numberOfPages: number_of_pages});
			this.setState({manga: [...this.state.manga, ...data]});
			this.setState({loading: false});
		})
	}

	render(){
		return(
			<>
				<div className="container">
					{this.state.manga.map((m, index)=> <MangaCard key={index} Data={m} Ref={index + 1 === this.state.manga.length ? this.lastElemRef : null}/>)}
				</div>
				{this.state.loading && <div className="loading-spinner"/>}
			</>
		)
	}
}

class MangaCard extends react.Component{
	constructor(props){
		super(props);
	}

	render(){
		const data = this.props.Data;
		return(
			<Link to={{pathname: `/manga/${data.id}`, state: { fromDashboard: true }}} className="card" ref={this.props.Ref}>
				{data.title}
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
		return(
			<ul className="categories-list">
				{this.props.AppliedCategories.map(id=> {
					let category = this.props.Categories[id];
					if(category) return <li className="category-item" key={id} onClick={()=> this.onCategoryDelete(id)}>{category.title}<div className="closing-area"></div></li>;
					return null;
				})}
			</ul>
		)
	}
}


export default Catalog;