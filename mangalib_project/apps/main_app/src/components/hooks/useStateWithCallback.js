import react, {useState, useEffect, useCallback, useRef} from 'react';

export default function useStateWithCallback(initial){
	const [state, setState] = useState(initial);
	const callback = useRef();

	const updateState = useCallback((newState, func)=> {
		setState(newState);
		callback.current = func;
	});

	useEffect(()=> {
		if(callback.current) callback.current();
	}, [state]);

	return [state, updateState];
}