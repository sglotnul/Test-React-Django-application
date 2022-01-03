import {useState, useEffect} from 'react';
import axios from 'axios'; 

export default function useUpdateData(path, states, permission=true){
	const [responseData, setResponseData] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(()=> {
		if(!permission) return;
		let cancel;
		setLoading(true);
		setError(false);
		axios({
			method: 'GET',
	    	url: path,
		    cancelToken: new axios.CancelToken(c=> cancel = c),
		}).then(res=> {
			let {data, result} = res.data;
	    	if(!result) throw new Error('not found');
	    	setResponseData(data);
	    	setLoading(false);
		}).catch(e=> {
			if(axios.isCancel(e)) return;
			setLoading(false);
			setError(true);
		})

		return cancel
	}, [...states]);

	return {responseData, loading, error};
}