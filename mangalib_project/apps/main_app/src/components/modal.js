import axios from 'axios'; 
import react, {Fragment, useState, useEffect, useRef, useCallback} from 'react';
import reactDOM from 'react-dom';
import Loader from './loader.js';
import NotFoundError from './not_found.js';

class Modal extends react.Component{
	constructor(props){
		super(props);
		this.state = {
			status: false,
			animationStatus: false,
		}
	}

	componentDidUpdate(prevProps, prevState){
		if(prevProps.Status !== this.props.Status){
			if(!this.props.Status){
				this.setState({animationStatus: false});
			}else{
				if(this.state.status) this.setState({animationStatus: true});
				this.setState({status: true});
			}
		};
		if(prevState.status !== this.state.status){
			setTimeout(this.setState.bind(this, {animationStatus: this.state.status}));
			document.body.id = this.state.status ? 'blocked' : '';
		};
	}

	closeModal(){
		if(this.state.animationStatus) return;
		this.setState({status: false});
		this.props.OnUpdate({modalStatus: false});
	}

	getInner(){
		return null;
	}

	render(){
		const modalBody = this.getInner();

		if(this.state.status && document.getElementById('modals__app')){
			return reactDOM.createPortal(
				<div 
					className="modal" 
					id={this.state.animationStatus && 'active'} 
					onClick={()=> this.setState({animationStatus: false})} 
					onTransitionEnd={this.closeModal.bind(this)}
				>
					{modalBody}
				</div>,
				document.getElementById('modals__app')
			)
		}
		return null;
	}
}

export class FilterModal extends Modal{
	constructor(props){
		super(props);
	}

	getInner(){
		const {animationStatus} = this.state;
		const {OnUpdate, CategoryList: categories, AppliedCategoryList: appliedCategories, Order: order, OrderDir: orderDir} = this.props;

		return(
			<div className="modal-body" id={animationStatus && 'active'} onClick={e=> e.stopPropagation()} onTransitionEnd={e=> e.stopPropagation()}>
				<form>
					<CategoryCheckboxMenu CategoryList={categories} AppliedCategoryList={appliedCategories} onChange={OnUpdate}/>
					<FilterRadioMenu TotalOrdering={order} OrderDirection={orderDir} OnChange={OnUpdate}/>
				</form>
			</div>
		)
	}
}

class CategoryCheckboxMenu extends react.Component{
	constructor(props){
		super(props)
	}

	render(){
		let {CategoryList: categories, AppliedCategoryList: appliedCategories, onChange} = this.props;
		return(
			<div className="filter-group">
				<span className="filter-group-title">Категории</span>
				{Object.entries(categories).map(([id, data])=> <FilterCheckbox Id={id} Data={data} AppliedCategories={appliedCategories} OnChange={onChange}/>)}
			</div>
		)
	}
}

class FilterRadioMenu extends react.Component{
	fieldsToOrder = {
		title: 'Названию',
		written_at: 'Дате выпуска',
		created_at: 'Дате добавления',
		redacted_at: 'Дате изменения',
	}

	constructor(props){
		super(props);
	}

	onRadioChange(e){
		this.props.OnChange({order: e.target.value})
	}

	render(){
		const SortAscending = ()=> (
			<div className="direction-filter" id={this.props.OrderDirection && "active"} onClick={()=> this.props.OnChange({orderDirection: true})}>↑</div>
		)

		const SortDescending = ()=> (
			<div className="direction-filter" id={this.props.OrderDirection || "active"} onClick={()=> this.props.OnChange({orderDirection: false})}>↓</div>
		)

		const inputList = Object.entries(this.fieldsToOrder).map(([name, verboseName])=> {
			return(<div>
				<input type="radio" name="order_by" value={name} checked={name == this.props.TotalOrdering} onChange={this.onRadioChange.bind(this)}/>
				{verboseName}
			</div>)
		})

		return(
			<div className="filter-group">
				<span className="filter-group-title">Сортировать по</span>
				<div className="direction-filter-group">
					<SortAscending/>
					<SortDescending/>
				</div>
				{inputList}
			</div>
		)
	}
}

class FilterCheckbox extends react.Component{
	constructor(props){
		super(props);
	}

	componentDidMount(){
		this.setState({checked: this.props.AppliedCategories.includes(this.props.Id)})
	}

	onCheckboxChange(e){
		let newCatList = this.props.AppliedCategories.reduce((list, cat)=> {
			if(cat !== this.props.Id) return [...list, cat];
			return list;
		}, []);
		if(e.target.checked) newCatList.push(this.props.Id);
		this.props.OnChange({appliedCategories: [...new Set(newCatList)]})
	}

	render(){
		return(
			<div>
				<input type="checkbox" name="categories" value={this.props.Id} checked={this.props.AppliedCategories.includes(this.props.Id)} onChange={this.onCheckboxChange.bind(this)}/>
				{this.props.Data.title}
			</div>
		)
	}
}

export class MangaSearchModal extends Modal{
	constructor(props){
		super(props);
	}

	getInner(){
		const {animationStatus} = this.state;
		const {Data: manga, MoreThatOnePage: moreThatOnePage, Loading: loading, Error: error} = this.props;

		return(
			<div className="search-modal-body" id={animationStatus && 'active'} onClick={e=> e.stopPropagation()} onTransitionEnd={e=> e.stopPropagation()}>
				{!error && !loading && manga.map(m=> <p>{m.title}</p>)}
				{loading && <Loader/>}
				{error && <NotFoundError/>}
			</div>
		)
	}
}