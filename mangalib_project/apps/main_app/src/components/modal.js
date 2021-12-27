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
		const callback = ()=>{
			if(this.state.animationStatus) return;
			this.setState({status: false});
			this.props.CloseModal();
		}
		return callback;
	}

	getInner(){
		return null;
	}

	render(){
		const modalBody = this.getInner();
		const {status, animationStatus} = this.state;

		if(this.state.status && document.getElementById('modals__app')){
			return reactDOM.createPortal(
				<div 
					className="modal" 
					id={this.state.animationStatus && 'active'} 
					onClick={()=> this.setState({animationStatus: false})} 
					onTransitionEnd={this.closeModal()}
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
		const {CategoryList, AppliedCategoryList, Order, OrderDir, ChangeAppliedCategoryList, ChangeOrdering, ChangeOrderingDirection,} = this.props;

		return(
			<div className="modal-body" id={animationStatus && 'active'} onClick={e=> e.stopPropagation()} onTransitionEnd={e=> e.stopPropagation()}>
				<form>
					<CategoryCheckboxMenu CategoryList={CategoryList} AppliedCategoryList={AppliedCategoryList} OnChange={ChangeAppliedCategoryList}/>
					<FilterRadioMenu Order={Order} OrderDirection={OrderDir} OnOrderChange={ChangeOrdering} OnOrderDirectionChange={ChangeOrderingDirection}/>
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
		let {CategoryList, AppliedCategoryList, OnChange} = this.props;
		return(
			<div className="filter-group">
				<span className="filter-group-title">Категории</span>
				{Object.entries(CategoryList).map(([id, data])=> <CategoryCheckbox key={id} Id={id} Data={data} AppliedCategories={AppliedCategoryList} OnChange={OnChange}/>)}
			</div>
		)
	}
}

class CategoryCheckbox extends react.Component{
	constructor(props){
		super(props);
	}

	componentDidMount(){
		const {Data} = this.props;
		this.setState({checked: this.props.AppliedCategories.includes(Data.id)})
	}

	onCheckboxChange(){
		const callback = e=> {
			const {AppliedCategories, Id, OnChange} = this.props;
			let newCatList = AppliedCategories.reduce((list, catId)=> {
				if(catId !== Id) return [...list, catId];
				return list;
			}, []);
			if(e.target.checked) newCatList.push(Id);
			OnChange([...new Set(newCatList)])
		}
		return callback;
	}

	render(){
		const {AppliedCategories, Data, Id} = this.props;
		return(
			<div>
				<input type="checkbox" name="categories" value={Id} checked={AppliedCategories.includes(Id)} onChange={this.onCheckboxChange()}/>
				{Data.title}
			</div>
		)
	}
}

class FilterRadioMenu extends react.Component{
	static defaultField = 'title';
	static fieldsToOrder = {
		title: 'Названию',
		written_at: 'Дате выпуска',
		created_at: 'Дате добавления',
		redacted_at: 'Дате изменения',
	}

	constructor(props){
		super(props);
	}

	onRadioChange(){
		const callback = e=> this.props.OnOrderChange(e.target.value);
		return callback;
	}

	onOrderDirectionChange(direction){
		const callback = ()=> this.props.OnOrderDirectionChange(direction);
		return callback;
	}

	render(){
		let {OrderDirection, Order} = this.props;
		if(!Order) Order = FilterRadioMenu.defaultField;

		const SortAscending = ()=> (
			<div className="direction-filter" id={OrderDirection && "active"} onClick={this.onOrderDirectionChange(true)}>↑</div>
		)

		const SortDescending = ()=> (
			<div className="direction-filter" id={OrderDirection || "active"} onClick={this.onOrderDirectionChange(false)}>↓</div>
		)

		const inputList = Object.entries(FilterRadioMenu.fieldsToOrder).map(([name, verboseName])=> {
			return(<div>
				<input type="radio" name="order_by" value={name} checked={name == Order} onChange={this.onRadioChange()}/>
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

export class MangaSearchModal extends Modal{
	constructor(props){
		super(props);
	}

	getInner(){
		const {animationStatus} = this.state;
		const {Data: manga, NumberOfPages: numberOfPages, Loading: loading, Error: error} = this.props;

		return(
			<div className="search-modal-body" id={animationStatus && 'active'} onClick={e=> e.stopPropagation()} onTransitionEnd={e=> e.stopPropagation()}>
				{!error && !loading && manga.map(m=> <p>{m.title}</p>)}
				{loading && <Loader/>}
				{error && <NotFoundError/>}
			</div>
		)
	}
}