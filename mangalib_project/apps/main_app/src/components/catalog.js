import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import createBrowserHistory from 'history/createBrowserHistory'
import axios from 'axios'; 
import FilterModal from './modal.js';

const history = createBrowserHistory();

class Catalog extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			queryString: '',
			categories: {},
			appliedCategories: {},
			order: '',
			orderDirection: true,
		};
	}

	componentDidMount(){	
		this.categoriesListUpdate();
		this.setState({queryString: new URLSearchParams(window.location.search).toString()});
	}

	componentDidUpdate(prevProps, prevState){
		if(prevState.categories !== this.state.categories){
			this.setOrdering();
			this.setAppliedCategoriesList();
		};
		if((prevState.appliedCategories !== this.state.appliedCategories) || (prevState.order !== this.state.order) || (prevState.orderDirection !== this.state.orderDirection)){
			this.updateQueryString();
		}
	}

	categoriesListUpdate(){
		fetch(`/api/categories/`, {
			method: 'GET',
		})
		.then(response=> response.json())
		.then(result=> {
			if(!result.result) return;
			this.setState({categories: result.data.reduce((obj, {id, ...data})=> Object.assign({}, obj, {[id]: data}), {})});
		})
	}

	setOrdering(){
		let order = new URLSearchParams(this.state.queryString).get('order_by') || '';
		let dir = true;
		if(order.startsWith('-')){
			order = order.slice(1);
			dir = false;
		};
		this.setState({order: order});
		this.setState({orderDirection: dir});
	}

	setAppliedCategoriesList(){
		const categories = new URLSearchParams(this.state.queryString).get('categories');
		let appliedCategoriesList = {};
		for(let cat of categories ? categories.split(',') : []){
			let appliedCat = this.state.categories[cat];
			if(appliedCat) appliedCategoriesList[cat] = appliedCat;
		}
		this.setState({appliedCategories: appliedCategoriesList});
	}

	updateQueryString(){
		let {appliedCategories: categories, order, orderDirection} = this.state;
		let queryObj = {
			categories: Object.keys(categories).join(','),
			order_by: (orderDirection ? '' : '-') + order,
		};
		let searchParams = new URLSearchParams('');
		for(let [key, value] of  Object.entries(queryObj)){
			if(value) searchParams.set(key, value);
		}
		let queryString = searchParams.toString();
		this.setState({queryString: queryString});
		history.replace(window.location.pathname + (queryString ? '?' + queryString : ''));
	}

	render(){
		let {categories, appliedCategories, order, orderDirection} = this.state;
		return(
			<div className="content">
				<div className="default-page">
					<div className="catalog-menu"></div>
					<CategoriesBar Categories={appliedCategories}/>
					<InfiniteScroll QueryString={this.state.queryString}/>
					<FilterModal 
						OnUpdate={this.setState.bind(this)}
						CategoryList={categories} 
						AppliedCategoryList={appliedCategories} 
						Order={order} 
						OrderDir={orderDirection}
					/>
				</div>
	        </div>
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
			loading: false,
		};
		this.lastElemRef = node=> {
			let {page, numberOfPages} = this.state;
			if(this.observer) this.observer.disconnect();
			this.observer = new IntersectionObserver(entries=> {
				if(entries[0].isIntersecting){
					if(page < numberOfPages) this.setState({page: page + 1});
				}
			})
			if(node) this.observer.observe(node);
		}
	}

	componentDidMount(){
		this.updateMangaList();
	}

	componentDidUpdate(prevProps, prevState){
		if(prevProps.QueryString !== this.props.QueryString){
			if(this.cancelFunc) this.cancelFunc();
			this.setState({page: 1});
			this.setState({manga: []});
		}
		if((prevProps.QueryString !== this.props.QueryString) || (prevState.page !== this.state.page)) this.updateMangaList();
	}

	updateMangaList(){
		const params = Object.fromEntries(new URLSearchParams(this.props.QueryString));
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign({}, params, {page: this.state.page}),
		    cancelToken: new axios.CancelToken(c=> this.cancelFunc = c)
	    })
	    .then(result=> {
			this.setState({numberOfPages: result.data['number of pages']});
			this.setState({manga: [...this.state.manga, ...result.data.data]});
			this.setState({loading: false});
			this.setState({})
		})
		.catch(e=> {
			if(axios.isCancel(e)) return;
		})
	}

	render(){
		return(
			<>
				<div className="container">
					{this.state.manga.map((m, index)=> <MangaCard key={index} Data={m} Ref={index + 1 === this.state.manga.length ? this.lastElemRef : null}/>)}
				</div>
				<p>{this.state.loading && 'LOADING...'}</p>
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
			<div className="card" ref={this.props.Ref}>
				{data.title}
			</div>
		)
	}
}

class CategoriesBar extends react.Component{
	constructor(props){
		super(props);
	}

	render(){
		return(
			<ul className="categories-list">
				{Object.entries(this.props.Categories).map(([id, data])=> <li className="category-item" key={id}>{data.title}</li>)}
			</ul>
		)
	}
}


export default Catalog;