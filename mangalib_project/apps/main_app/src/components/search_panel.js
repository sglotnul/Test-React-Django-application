import react,{Fragment, useState, useEffect, useCallback, useMemo} from 'react';
import axios from 'axios'; 
import {MangaSearchModal} from './modal.js';
import useUpdateMangaList from './hooks/useUpdateMangaList.js';
import useQueryUpdate from './hooks/useQueryUpdate.js';

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