import {useState, useEffect, useRef} from 'react';
import axios from 'axios'; 
import {turnObjectElementsIntoUrlFormat} from '../catalog.jsx';

export default function useUpdateMangaList(page, queryObj, permission=true){
	const [mangaList, setMangaList] = useState([]);
	const [numberOfPages, setNumberOfPages] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(()=> setMangaList([]), [queryObj]);
	useEffect(()=> {
		if(!permission) return;
		let cancel;
		const queryParams = turnObjectElementsIntoUrlFormat(queryObj);
		setLoading(true);
		setError(false);
		axios({
			method: 'GET',
		    url: '/api/manga/',
		    params: Object.assign(queryParams, {page}),
		    cancelToken: new axios.CancelToken(c=> cancel = c),
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
		return cancel;
	}, [queryObj, page]);

	return {mangaList, numberOfPages, loading, error};
}