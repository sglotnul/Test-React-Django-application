import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import axios from 'axios'; 

class Catalog extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			categories: {},
			applied_categories: [],
			updateMangaList: false,
		};
	}

	onQueryStringUpdate(){
		this.setState({updateMangaList: true});
		this.appliedCategoriesListUpdate();
	}

	categoriesListUpdate(){
		let component = this;
		return new Promise(function(resolve){
			fetch(`/api/categories/`, {
				method: 'GET',
			})
			.then(response=> response.json())
			.then(result=> {
				if(!result.result) return;
				component.setState({categories: result.data.reduce((obj, {id, ...data})=> obj[id] = data, {})});
				resolve();
			})
		})
	}

	appliedCategoriesListUpdate(){
		const categories = new URLSearchParams(window.location.search).get('categories');
		let appliedCategoriesList = [];
		for(let cat of categories ? categories.split(',') : []){
			let appliedCat = this.state.categories[+cat];
			if(appliedCat) appliedCategoriesList.push(appliedCat);
		}
		this.setState({applied_categories: appliedCategoriesList});
	}

	componentDidMount(){	
		this.categoriesListUpdate()
		.then(()=> this.onQueryStringUpdate());	
	}

	render(){
		return(
			<div className="content">
				<div className="default-page">
					<div className="catalog-menu"></div>
					<CategoriesBar Categories={this.state.applied_categories}/>
					<InfiniteScroll UpdateMangaList={this.state.updateMangaList} onMangaListUpdated={()=>this.setState({updateMangaList: false})}/>
				</div>
	        </div>
		)
	}
}

function InfiniteScroll(props){
	const [update, setUpdate] = useState(true);
	const [loading, setLoading] = useState(false);
	const [manga, setManga] = useState([]);
	const [page, setPage] = useState(1);
	const [numberOfPages, setNumberOfPages] = useState(1);
	const observer = useRef();
	const lastElemRef = useCallback(node=> {
		if(loading) return;
		if(observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver(entries=> {
			if(entries[0].isIntersecting){
				if(page >= numberOfPages) {
					return;
				};
				setPage(page + 1);
			}
		})
		if(node) observer.current.observe(node);
	}, [loading])

	useEffect(()=>{
		props.onMangaListUpdated();
		if(props.UpdateMangaList){
			setManga([]);
			setPage(1);
		};
	}, [props.UpdateMangaList])

	useEffect(()=>{
		setLoading(true);

		const params = Object.fromEntries(new URLSearchParams(window.location.search));
		let cancel;
		axios({
		    method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign({}, params, {page: page}),
		    cancelToken: new axios.CancelToken(c => cancel = c)
	    })
	    .then(result=> {
			setNumberOfPages(result.data['number of pages']);
			setManga(m=> [...m, ...result.data.data]);
			setLoading(false);
		})
		.catch(e=> {
			if(axios.isCancel(e)) return;
		})
		return cancel;
	}, [props.UpdateMangaList, page])

	return(
		<>
			<div className="container">
				{manga.map((m, index)=> <MangaCard key={index} Data={m} Ref={index + 1 === manga.length ? lastElemRef : null}/>)}
			</div>
			<p>{loading && 'LOADING...'}</p>
		</>
	)
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
				{this.props.Categories.map((cat)=> <li className="category-item" key={cat.id}>{cat.title}</li>)}
			</ul>
		)
	}
}


export default Catalog;