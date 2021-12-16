import react, {Fragment} from 'react';
import {Link} from 'react-router-dom';
import Navbar from './navbar';

class Main extends react.Component{
	constructor(props){
		super(props);
		this.state = {
		}
	}

	render(){
		for(let key in this) console.log(key)
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
}

export default Main;