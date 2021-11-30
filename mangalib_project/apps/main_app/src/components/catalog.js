import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import axios from 'axios'; 
import {FilterModal, MangaSearchModal} from './modal.js';
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
			search: '',
			modalStatus: false,
		};
	}

	componentDidMount(){	
		let qs = new URLSearchParams(window.location.search);
		this.categoriesListUpdate();
		this.setAppliedCategoriesList(qs);
		this.setOrdering(qs);
		this.setSearchString(qs);
	}

	componentDidUpdate(prevProps, prevState){
		const {categories, appliedCategories, order, orderDirection, search} = this.state;
		if((prevState.appliedCategories !== appliedCategories) || (prevState.order !== order) || (prevState.orderDirection !== orderDirection) || (prevState.search !== search)){
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

	setSearchString(queryString){
		const by_title = queryString.get('title');
		const by_description = queryString.get('description');
		this.setState({search: by_title || by_description || ''});
	}

	updateQueryString(){
		let {appliedCategories: categories, order, orderDirection, search} = this.state;
		let queryObj = {
			categories: categories.join(','),
			order_by: '-'.repeat(+!orderDirection) + order,
			search: search,
		};
		let searchParams = new URLSearchParams('');
		for(let [key, value] of  Object.entries(queryObj)){
			if(value) searchParams.set(key, value);
		}
		let queryString = searchParams.toString()
		history.replace(window.location.pathname + '?'.repeat(+!!queryString) + queryString);
	}

	render(){
		let {categories, appliedCategories, order, orderDirection, search} = this.state;
		return(
			<>
				<SearchPanel Search={this.state.search} OnSearch={s=> this.setState({search: s})}/>
				<Navbar>
					<div className="modal-open-arrow" onClick={()=> this.setState({modalStatus: true})}/>
				</Navbar>
				<div className="content">
					<div className="default-page">
						<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} OnUpdate={this.setState.bind(this, {modalStatus: false})}/>
						<InfiniteScroll 
							AppliedCategoryList={appliedCategories} 
							Order={order} 
							OrderDir={orderDirection}
							Search={search}
						/>
						<FilterModal 
							Status={this.state.modalStatus}
							RemoveModal={this.setState.bind(this, {modalStatus: false})}
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
			error: false,
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
		const update = (prevProps.AppliedCategoryList !== this.props.AppliedCategoryList) || (prevProps.Order !== this.props.Order) || (prevProps.OrderDir !== this.props.OrderDir) || (prevProps.Search !== this.props.Search);
		if(update){
			this.setState({manga: []});
			this.setState({page: Symbol(1)});
		}
		if(prevState.page !== this.state.page){
			this.updateMangaList();
		};
	}

	updateMangaList(){
		if(this.cancel) this.cancel();

		let willCancel = false;

		this.cancel = ()=> willCancel = true;

		const params = Object.fromEntries(new URLSearchParams(history.location.search));
		this.setState({error: false});
		this.setState({loading: true});
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign({}, params, {page: this.state.page.value}),
	    })
	    .then(res=> {
	    	let {result, data, 'number of pages': number_of_pages} = res.data;
	    	if(willCancel || !number_of_pages) throw new Error('not found');
			this.setState({numberOfPages: number_of_pages});
			this.setState({manga: [...this.state.manga, ...data]});
			this.setState({loading: false});
		})
		.catch(e=>{
			this.setState({loading: false});
			this.setState({error: true});
		})
	}

	render(){
		return(
			<>
				<div className="container">
					{this.state.manga.map((m, index)=> <MangaCard key={index} Data={m} Ref={index + 1 === this.state.manga.length ? this.lastElemRef : null}/>)}
					{this.state.loading && <div className="loading-spinner"/>}
					{this.state.error && <p>not found</p>}
				</div>
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

class SearchPanel extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			search: '',
			modalStatus: false,
			manga: [],
			moreThatOnePage: false,
			loading: false,
			error: false,
		}
	}

	componentDidUpdate(prevProps, prevState){
		if(prevProps.Search !== this.props.Search){
			if(this.cancel) this.cancel();
			this.setState({modalStatus: false});
			this.setState({search: this.props.Search});
		}
		if(prevState.search !== this.state.search){
			if(this.cancel) this.cancel();
			if(this.cancelRequest) this.cancelRequest();
			let willCancel = false;
			this.cancel = ()=> willCancel = true;
			this.setState({loading: true});
			this.setState({error: false});
			setTimeout(()=> {
				if(willCancel) return;
				if(this.state.search){
					this.setState({modalStatus: true});
					this.updateMangaList();
				} else{
					this.setState({loading: false});
					this.setState({manga: []});
				};
			}, 800);
		}
	}

	updateMangaList(){
		this.setState({manga: []});
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: {search: this.state.search, page: 1},
		    cancelToken: new axios.CancelToken(c=> this.cancelRequest = c),
	    })
	    .then(res=> {
	    	let {result, data, 'number of pages': number_of_pages} = res.data;
	    	if(!number_of_pages) throw new Error('not found');
	    	this.setState({moreThatOnePage: number_of_pages > 1});
			this.setState({loading: false});
			this.setState({manga: data});
		})
		.catch(e=> {
			if(axios.isCancel(e)) return;
			this.setState({loading: false});
			this.setState({error: true});
		})
	}

	onSubmit(e){
		e.preventDefault();
		this.props.OnSearch(this.state.search);
	}

	render(){
		let {modalStatus, manga, moreThatOnePage, loading, error} = this.state;
		return(
			<div className="search-panel" id={modalStatus && "active"}>
				<MangaSearchModal 
					Status={modalStatus} 
					Data={manga} 
					MoreThatOnePage={moreThatOnePage}
					Loading={loading} 
					Error={error}
					OnSearch={this.onSubmit.bind(this)}
					RemoveModal={this.setState.bind(this, {modalStatus: false})}
				/>
				<form onSubmit={this.onSubmit.bind(this)}>
					<input type="text" value={this.state.search} onChange={e=> this.setState({search: e.target.value})}/>
					<button type="submit">Поиск</button>
				</form>
			</div>
		)
	}
}

export default Catalog;