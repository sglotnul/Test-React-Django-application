import {useRef, useEffect, useCallback} from 'react';

export default function useObserverCallback(callback, params={}){
	const observer = useRef();

	useEffect(()=> {
		observer.current = new IntersectionObserver((entries, observer)=> {
			entries.forEach(entry=> {
				if(entry.isIntersecting){
					callback(entry, observer);
				}
			})
		}, params);

		return ()=> {
			if(observer.current) observer.current.disconnect();
		}
	}, [callback]);

	const observeFunc = useCallback(node=> {
		if(node) observer.current.observe(node);
	}, [observer.current]);

	return observeFunc;
}