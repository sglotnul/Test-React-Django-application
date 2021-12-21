import react from 'react';

export default function Navbar(props){
	return(
		<header id={props.Hide && 'hidden'}>
			HEADER
			{props.children}
		</header>
	)
}