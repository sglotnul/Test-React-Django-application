import {useState, useEffect, useCallback, useContext} from 'react';
import {Link} from 'react-router-dom';
import {ProfileModal, LoginModal} from './modal.jsx';
import Loader from './loader.jsx';
import {UserContext} from '../App.jsx';

export default function Navbar(props){
	const [modalStatus, setModalStatus] = useState(false);
	const {userData, loading} = useContext(UserContext);

	const showModal = useCallback(()=> setModalStatus(true), []);
	const closeModal = useCallback(()=> setModalStatus(false), []);

	useEffect(closeModal, [userData]);

	return(
		<header id={props.Hide && 'hidden'}>
			<Link to={{pathname: `/mangalist`}} style={{position: 'ac'}}>HEADER</Link>
			<div className="header-inner">
				<div className="first-header-menu"/>
				<div className="header-menu">
					{props.children}
					<div className="profile-modal-open-arrow">
						{loading 
							? <Loader/>  
							: <ModalOpenArrow 
								Username={userData.username}
								Handler={showModal}
							/>
						}
					</div>
				</div>
			</div>
			<ProfileModal 
				Status={modalStatus}
				CloseModal={closeModal}
				UserData={userData}
			/>
		</header>
	)
}

export function HeaderMenu(props){

}

function ModalOpenArrow(props){
	const {Username, Handler} = props;

	return <span onClick={Handler}>{Username || "Войти"}</span>
}