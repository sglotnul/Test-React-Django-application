import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import reactDOM from 'react-dom';

class Modal extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			active: false,
			animationStatus: false,
		}
	}

	componentDidUpdate(prevProps, prevState){
		if(prevState.active != this.state.active){
			document.body.id = document.body.id ? '' : 'blocked';
			setTimeout(this.setState.bind(this, {animationStatus: this.state.active}));
		};
	}

	getInner(){
		return null;
	}

	render(){
		if(this.state.active && document.getElementById('modals__app')){
			return reactDOM.createPortal(
				<div 
					className="modal" 
					id={this.state.animationStatus && 'active'} 
					onClick={()=> this.setState({animationStatus: false})} 
					onTransitionEnd={()=> this.state.animationStatus || this.setState({active: false})}
				>
					{this.getInner()}
				</div>,
				document.getElementById('modals__app')
			)
		}
		return null;
	}
}

class FilterModal extends Modal{
	constructor(props){
		super(props);
	}

	componentDidMount(){
		window.addEventListener('open-filter-modal', ()=> this.setState({active: true}));
	}

	onFormSubmit(event){
		event.preventDefault();
		let data = new FormData(event.target);
		this.props.UpdateQueryString(`?categories=${data.getAll('category').join(',')}`)
	}

	getInner(){
		let {CategoryList: categories, AppliedCategoryList: appliedCategories, ...other} = this.props;
		return(
			<div className="modal-body" id={this.state.animationStatus && 'active'} onClick={e=> e.stopPropagation()}>
				<form onSubmit={this.onFormSubmit.bind(this)}>
					{Object.entries(categories).map(([id, data])=> <Checkbox Id={id} Data={data} AppliedCategories={appliedCategories} OnChange={other.OnUpdate}/>)}
				</form>
			</div>
		)
	}
}

class Checkbox extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			checked: false,
		}
	}

	componentDidMount(){
		this.setState({checked: !!this.props.AppliedCategories[this.props.Id]})
	}

	componentDidUpdate(prevProps, prevState){
		if(prevState.checked !== this.state.checked){
			let newCatList = {};
			for(let [id, data] of Object.entries(this.props.AppliedCategories)){
				if(id != this.props.Id) newCatList[id] = data;
			}
			if(this.state.checked) newCatList[this.props.Id] = this.props.Data;
			this.props.OnChange({appliedCategories: newCatList})
		}
	}

	render(){
		return(
			<div>
				<input type="checkbox" name="category" value={this.props.Id} checked={this.state.checked} onChange={()=> this.setState({checked: !this.state.checked})}/>
				{this.props.Data.title}
			</div>
		)
	}
}

export default FilterModal;