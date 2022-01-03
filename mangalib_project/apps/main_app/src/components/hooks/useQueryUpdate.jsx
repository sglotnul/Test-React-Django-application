import {useState, useEffect} from 'react';

export default function useQueryUpdate(query){
	const [completedQuery, setComplitedQuery] = useState('');

	useEffect(()=> {
		setComplitedQuery('');
		let willCancel = false;
		let cancel = ()=> willCancel = true;
		if(query){
			setTimeout(()=> {
				if(willCancel) return;
				setComplitedQuery(query);
			}, 600);
		}
		return cancel;
	}, [query]);

	return completedQuery;
}