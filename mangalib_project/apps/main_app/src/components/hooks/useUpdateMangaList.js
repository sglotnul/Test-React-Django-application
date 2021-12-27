import {useState, useEffect, useRef} from 'react';
import axios from 'axios'; 
import useStateWithCallback from './useStateWithCallback.js';

function turnObjectElementsIntoUrlFormat({appliedCategories=[], order='', orderDirection=1, search}){
	let queryObj = {
		categories: appliedCategories.join(','),
		order_by: '-'.repeat(+!orderDirection) + order,
		search: search,
	};

	Object.entries(queryObj).forEach(([key, value])=> {
		if(!value) delete queryObj[key];
	})

	return queryObj;
}

export default function useUpdateMangaList(page, queryObj, permission=true){
	const [mangaList, setMangaList] = useStateWithCallback([]);
	const [numberOfPages, setNumberOfPages] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const cancelPrevRequest = useRef();

	const updateMangaList = (page=1)=> {
		if(!permission) return;
		if(cancelPrevRequest.current) cancelPrevRequest.current();
		const queryParams = turnObjectElementsIntoUrlFormat(queryObj);
		setLoading(true);
		setError(false);
		axios({
			method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign(queryParams, {page}),
		    cancelToken: new axios.CancelToken(c=> cancelPrevRequest.current = c),
		}).then(res=> {
			let {data: manga, number_of_pages} = res.data;
	    	if(!number_of_pages) throw new Error('not found');
	    	setNumberOfPages(number_of_pages);
	    	setMangaList(prevMangaList=> [...prevMangaList, ...manga]);
	    	setLoading(false);
		}).catch(e=> {
			if(axios.isCancel(e)) return;
			setError(true);
			setLoading(false);
		})
	}

	useEffect(()=> setMangaList([], updateMangaList), [queryObj]);
	useEffect(()=> {
		if(page === 1) return;
		updateMangaList(page);
	}, [page]);

	return {mangaList, numberOfPages, loading, error};
}