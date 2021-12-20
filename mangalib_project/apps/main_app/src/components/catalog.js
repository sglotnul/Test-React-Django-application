import react, {Fragment} from 'react';
import {Link} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import axios from 'axios'; 
import {FilterModal} from './modal.js';
import Navbar from './navbar';
import SearchPanel from './search_panel.js';

const history = createBrowserHistory();

function turnIntoUrlFormat(categories, order, orderDirection, search){
	return{
		categories: categories.join(','),
		order_by: '-'.repeat(+!orderDirection) + order,
		search: search,
	}
}

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
		this.setState({
			order: order,
			orderDirection: dir,
		});
	}

	setAppliedCategoriesList(queryString){
		const categories = queryString.get('categories');
		this.setState({appliedCategories: [...new Set(categories ? categories.split(',') : [])]});
	}

	setSearchString(queryString){
		const searchString = queryString.get('search');
		this.setState({search: searchString || ''});
	}

	updateQueryString(){
		let {appliedCategories: categories, order, orderDirection, search} = this.state;
		let queryObj = turnIntoUrlFormat(categories, order, orderDirection, search);
		let searchParams = new URLSearchParams('');
		for(let [key, value] of  Object.entries(queryObj)){
			if(value) searchParams.set(key, value);
		}
		let queryString = searchParams.toString()
		history.replace(window.location.pathname + '?'.repeat(+!!queryString) + queryString);
	}

	render(){
		const {modalStatus, categories, appliedCategories, order, orderDirection, search, loading} = this.state;

		return(
			<>
				<SearchPanel Search={this.state.search} OnSearch={s=> this.setState({search: s})}/>
				<Navbar>
					<div className="modal-open-arrow" onClick={()=> this.setState({modalStatus: true})}/>
				</Navbar>
				<div className="content">
					<div className="default-page">
						<CategoriesBar Categories={categories} AppliedCategories={appliedCategories} OnUpdate={this.setState.bind(this)}/>
						<InfiniteScroll 
							AppliedCategoryList={appliedCategories} 
							Order={order} 
							OrderDir={orderDirection}
							Search={search}
						/>
						<FilterModal 
							Status={modalStatus}
							OnUpdate={this.setState.bind(this)}
							Loading={loading}
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
			this.observer = new IntersectionObserver((entries, observer)=> {
				if(entries[0].isIntersecting){
					if(page < numberOfPages) this.setState({page: page + 1});
				}
			})
			if(node) this.observer.observe(node);
		}
	}

	componentDidUpdate(prevProps, prevState){
		const update = (prevProps.AppliedCategoryList !== this.props.AppliedCategoryList) || (prevProps.Order !== this.props.Order) || (prevProps.OrderDir !== this.props.OrderDir) || (prevProps.Search !== this.props.Search);
		if(update){
			this.setState({
				manga: [],
				page: 1,
			}, this.updateMangaList.bind(this));
		}
		if(prevState.page !== this.state.page){
			this.updateMangaList();
		};
	}

	updateMangaList(){
		if(this.cancel) this.cancel();

		const params = Object.fromEntries(new URLSearchParams(history.location.search));
		this.setState({
			error: false,
			loading: true,
		});
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign(params, {page: this.state.page}),
		    cancelToken: new axios.CancelToken(c=> this.cancel = c),
	    })
	    .then(res=> {
	    	let {result, data, 'number of pages': number_of_pages} = res.data;
	    	if(!number_of_pages) throw new Error('not found');
			this.setState({
				numberOfPages: number_of_pages,
				manga: [...this.state.manga, ...data],
				loading: false,
			});
		})
		.catch(e=>{
			if(axios.isCancel(e)) return
			this.setState({
				loading: false,
				error: true
			});
		})
	}

	render(){
		const {manga, loading, error} = this.state;
		const getRef = index=> index + 1 === manga.length ? this.lastElemRef : null;

		return(
			<div className="container">
				{manga.map((m, index)=> <MangaCard key={index} Data={m} Ref={getRef(index)}/>)}
				{loading && <div className="loading-spinner"/>}
				{error && <p>not found</p>}
			</div>
		)
	}
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

export default Catalog;