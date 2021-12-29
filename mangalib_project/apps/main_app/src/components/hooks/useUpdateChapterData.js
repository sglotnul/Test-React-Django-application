import {useState, useEffect} from 'react';
import axios from 'axios'; 

export default function useUpdateChapterData(number, data){
	const [chapterData, setChapterData] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(()=> {
		if(!data.id) return;
		let cancel;
		setLoading(true);
		setError(false);
		axios({
			method: 'GET',
	    	url: `/api/manga/${data.id}/chapter/${number}`,
		    cancelToken: new axios.CancelToken(c=> cancel = c),
		}).then(res=> {
			let {data} = res.data;
	    	if(!data.number_of_pages) throw new Error('not found');
	    	setChapterData(data);
	    	setLoading(false);
		}).catch(e=> {
			if(axios.isCancel(e)) return;
			setLoading(false);
			setError(true);
		})

		return cancel
	}, [number, data]);

	return {chapterData, loading, error};
}