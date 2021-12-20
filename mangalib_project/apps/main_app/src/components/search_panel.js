import react, {Fragment} from 'react';
import axios from 'axios'; 
import {MangaSearchModal} from './modal.js';

class SearchPanel extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			search: '',
			manga: [],
			moreThatOnePage: false,
			loading: false,
			error: false,
			modalStatus: false,
		}
	}

	componentDidUpdate(prevProps, prevState){
		if(prevProps.Search !== this.props.Search){
			if(this.cancel) this.cancel();
			this.setState({
				modalStatus: false,
				search: this.props.Search,
			});
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
	    	this.setState({
	    		moreThatOnePage: number_of_pages > 1,
	    		manga: data,
	    		loading: false,
	    	});
		})
		.catch(e=> {
			if(axios.isCancel(e)) return;
			this.setState({
				loading: false,
				error: true,
			});
		})
	}

	onSubmit(e){
		e.preventDefault();
		this.props.OnSearch(this.state.search);
	}

	onInputChange(e){
		if(this.cancel) this.cancel();
		if(this.cancelRequest) this.cancelRequest();
		let value = e.target.value;
		let willCancel = false;
		this.cancel = ()=> willCancel = true;
		this.setState({
			search: value,
			loading: true,
			error: false,
			modalStatus: !!value,
		});
		if(value){
			setTimeout(()=> {
				if(willCancel) return;
				this.updateMangaList();
			}, 800);
		}
	}

	render(){
		const {search, modalStatus, manga, moreThatOnePage, loading, error} = this.state;

		return(
			<div className="search-panel" id={modalStatus && "active"}>
				<MangaSearchModal 
					Status={modalStatus} 
					Data={manga} 
					MoreThatOnePage={moreThatOnePage}
					Loading={loading} 
					Error={error}
					OnUpdate={this.setState.bind(this)}
				/>
				<form onSubmit={this.onSubmit.bind(this)}>
					<input type="text" value={search} onChange={this.onInputChange.bind(this)}/>
					<button type="submit">Поиск</button>
				</form>
			</div>
		)
	}
}

export default SearchPanel;