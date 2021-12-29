import {useState, useEffect, useCallback} from 'react';

export default function useObserverCallback(callback, states, params={}){
	const [observer, setObserver] = useState();
	const [test, setTest] = useState(1);

	useEffect(()=> {
		if(observer) observer.disconnect();

		setObserver(new IntersectionObserver((entries, observer)=> {
			entries.forEach(entry=> {
				if(entry.isIntersecting){
					callback(entry, observer);
				}
			})
		}, params));
	}, [...states])

	const observeFunc = useCallback(node=> {
		if(node) observer.observe(node);
	}, [observer]);

	return observeFunc;
}