import react,{Fragment, useState, useEffect, useCallback, useMemo} from 'react';
import axios from 'axios'; 
import {MangaSearchModal} from './modal.jsx';
import useUpdateMangaList from './hooks/useUpdateMangaList.jsx';
import useQueryUpdate from './hooks/useQueryUpdate.jsx';

export default function SearchPanel(props){
	const [input, setInput] = useState('');
	const [modalStatus, setModalStatus] = useState(false);
	const [loadingMask, setLoadingMask] = useState(false);
	const [errorMask, setErrorMask] = useState(false);

	const query = useQueryUpdate(input);

	const queryObject = useMemo(()=> {
		return {
			search: query,
		}
	}, [query]);
	const {mangaList, numberOfPages, loading, error} = useUpdateMangaList(1, queryObject, modalStatus && query !== '')

	useEffect(()=> {
		setModalStatus(false);
		setInput(props.Search);
	}, [props.Search]);

	useEffect(()=> {
		setLoadingMask(true);
		setErrorMask(false);
	}, [input]);
	useEffect(()=> {
		setLoadingMask(loading);
		setErrorMask(error);
	}, [loading, error]);

	const closeModal = useCallback(()=> setModalStatus(false), []);
	const onInputChange = useCallback(e=> {
		const {value} = e.target;
		setInput(value);
		setModalStatus(!!value && value !== props.Search);
	}, [props.Search]);
	const onSubmit = useCallback(e=> {
		e.preventDefault();
		props.OnSearch(input);
	}, [input]);

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
				<input type="text" value={input} onChange={onInputChange}/>
				<button type="submit">Поиск</button>
			</form>
		</div>
	)
}