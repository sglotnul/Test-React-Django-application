import {useRef, useEffect, useCallback} from 'react';

export default function useObserverCallback(callback, states){
	const observer = useRef();

	useEffect(()=> {
		observer.current = new IntersectionObserver((entries, observer)=> {
			if(entries[0].isIntersecting){
				callback();
			}
		})

		const disconnectObserver = ()=> {
			if(observer.current) observer.current.disconnect();
		}

		return disconnectObserver;
	}, [...states]);

	const observeFunc = useCallback(node=> {
		if(node) observer.current.observe(node);
	}, []);

	return observeFunc;
}
