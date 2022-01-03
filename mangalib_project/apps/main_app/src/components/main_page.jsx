import react, {Fragment} from 'react';
import {Link} from 'react-router-dom';
import Navbar from './navbar';

export default function Main(props){
	return(
		<div className="main-page">
			<Navbar WillHide={false}/>
			<div className="content">
				<Link to={{pathname: '/mangalist', state: { fromDashboard: true }}}>
					КАТАЛОГ
				</Link>
			</div>
		</div>
	)
}