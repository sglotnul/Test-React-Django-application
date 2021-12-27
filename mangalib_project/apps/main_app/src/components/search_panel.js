import react,{Fragment, useState, useEffect, useCallback, useMemo} from 'react';
import axios from 'axios'; 
import {MangaSearchModal} from './modal.js';
import useUpdateMangaList from './hooks/useUpdateMangaList.js';

function useQueryUpdate(query){
	const [completedQuery, setComplitedQuery] = useState('');

	useEffect(()=> {
		let willCancel = false;
		let cancel = ()=> willCancel = true;
		if(query){
			setTimeout(()=> {
				if(willCancel) return;
				setComplitedQuery(query);
			}, 600);
		}
		return cancel;
	}, [query])

	return {completedQuery};
}

export default function SearchPanel(props){
	const [query, setQuery] = useState('');
	const [modalStatus, setModalStatus] = useState(false);
	const [loadingMask, setLoadingMask] = useState(false);
	const [errorMask, setErrorMask] = useState(false);

	const {completedQuery} = useQueryUpdate(query);

	const queryObject = useMemo(()=> {
		return {
			search: completedQuery,
		}
	}, [completedQuery]);
	const {mangaList, numberOfPages, loading, error} = useUpdateMangaList(1, queryObject, modalStatus);

	useEffect(()=> {
		setModalStatus(false);
		setQuery(props.Search);
	}, [props.Search]);

	useEffect(()=> {
		setLoadingMask(true);
		setErrorMask(false);
	}, [query]);
	useEffect(()=> {
		setLoadingMask(loading);
		setErrorMask(error);
	}, [loading, error]);
	
	const closeModal = useCallback(()=> setModalStatus(false), []);
	const onInputChange = useCallback(e=> {
		setQuery(e.target.value);
		setModalStatus(!!e.target.value);
	}, []);
	const onSubmit = useCallback(e=> {
		e.preventDefault();
		props.OnSearch(query);
	}, [query]);

	return(
		<div className="search-panel" id={modalStatus && "active"}>
			<MangaSearchModal 
				Status={modalStatus} 
				Data={mangaList} 
				NumberOfPages={numberOfPages}
				Loading={loadingMask} 
				Error={errorMask}
				CloseModal={closeModal}
			/>
			<form onSubmit={onSubmit}>
				<input type="text" value={query} onChange={onInputChange}/>
				<button type="submit">Поиск</button>
			</form>
		</div>
	)
}


class earchPanel extends react.Component{
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
	    	let {result, data, number_of_pages} = res.data;
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
