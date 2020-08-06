import React, {useEffect} from "react";
import {observer} from "mobx-react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import {fmtDate} from "../util";
import IconBtn from "../_comp/IconBtn";
import Badge from "react-bootstrap/Badge";
import Moment from "moment";
import state from "./store";
import store from '../store';
import {runInAction} from "mobx";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import ListGroup from "react-bootstrap/ListGroup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Popover from "react-bootstrap/Popover";
import PopoverContent from "react-bootstrap/PopoverContent";
import {genRecall} from "../actions";

function fetchOrgsNoReturn() {
	state.fetchOrgs();
}
export default observer(function () {
	const {orgList} = state;
	useEffect(fetchOrgsNoReturn, []);
	return (
		<>
			<div className={'flex-row-800-col'}>
				<h6 style={{flexGrow:0}}>Согласия</h6>
				<div style={{flexGrow:1}}>
					<SearchHolder/>
				</div>
				<div style={{flexGrow:0}}>
					<IconBtn icon={'search'} onClick={state.toggleShowSearch}/>
					<IconBtn icon={'filter'}/>
					<IconBtn icon={'sync'} onClick={fetchOrgsNoReturn}/>
				</div>
			</div>
			<table className={"ps-table"}>
				<thead>
					<tr>
						<th>отозвать</th>
						<th>компания</th>
						<th>добавлена</th>
						<th>статус</th>
						<th style={{width:'32px'}}/>
					</tr>
				</thead>
				<tbody>
					{orgList.map((it) => (
						<Item it={it} key={it.num} />
					))}
				</tbody>
			</table>
			<AppendOrgs/>
		</>
	);
});
function rowClick(ogrn,name){
	if(ogrn){
		genRecall(orgn,name)
	}
}

const SearchHolder = observer(function(){
	if(!state.showSearch){
		return null;
	}
	return <Search/>
})
function searchEffect(){
	document.getElementById('org-ls-search').focus()
	return function(){
		runInAction(()=>{
			state.search = '';
		})
	}
}
function search({target:{value}}){
	state.search = value;
	state.fetchOrgs();
}
const Search = observer(function(){
	useEffect(searchEffect,[]);
	return <>
		<input onChange={search} id={'org-ls-search'} value={state.search}
			style={{marginLeft:'10px',width:'calc(100% - 20px)',height:'100%'}}/>
	</>
})

const SortOrgs = observer(function(){
	return <Popover id={'pipipip'}>
		<Popover.Title as="h3">Popover bottom</Popover.Title>
		<PopoverContent>
		<ListGroup>
			<ListGroup.Item>
				<FontAwesomeIcon icon={'sort-amount-down-аlt'}/> Добавлена
			</ListGroup.Item>
			<ListGroup.Item>
				<FontAwesomeIcon icon={'sort-amount-up-аlt'}/> Добавлена
			</ListGroup.Item>
		</ListGroup>
		</PopoverContent>
	</Popover>
})

function appendOrgs(){
	state.fetchOrgs(true);
}
const AppendOrgs = observer(function(){
	if(!state.hasMore){
		return null;
	}
	return <div style={{textAlign:'center'}}>
		<Button size={"sm"} className={'ls-org-btn'} onClick={appendOrgs}>Еще...</Button>
	</div>
})

const Item = function ({it: {id, num, signed, jurname, jurshortname, state, lastStateChange, zone, ogrn}}) {
	return (<>
		<tr className={'real-row'}>
			<td>
				<Buttоn size={"sm"} className={'ls-org-btn'}>
					<div className={"flex-row"} onClick={()=>rowClick(ogrn, jurname)}>
						<IconBtn icon={"download"} />
						<div className={"flex-col"}>
							<div style={{flexGrow:1}}/>
							<a style={{flexGrow:0}} className={'darker text08'}> Отозвать</a>
							<div style={{flexGrow:1}}/>
						</div>
					</div>
				</Button>
			</td>
			<td>
				<div className={"flex-col"}>
					<h6 className={'darker'}>{jurshortname || jurname}</h6>
					<span className={'lighter'}>{jurname}</span>
				</div>
			</td>
			<td>
				<div className={"flex-col"}>
					<span className={'lighter'}>{fmtDate(signed)}</span>
				</div>
			</td>
			<td>
				<div>
					<AgreementState state={state} last={lastStateChange} />
					{/*<ZoneBadge zone={zone} />*/}
				</div>
			</td>
			<td>
				<div className={"flex-row lighter"}>
					<IconBtn icon={'pencil-alt'}/>
				</div>
			</td>
		</tr>
		<tr>
		</tr>
	</>);
};

const AgreementState = function ({state, last}) {
	let text = "";
	if (state === 1) {
		text += "Вступило в силу";
	} else if (state === 2) {
		text += "Отзыв запрошен";
	} else if (state === 3) {
		text += "Отозвано";
	} else if (state === 4) {
		text += "Подана жалоба в РКН";
	}
	if (last !== null) {
		text += " ";
		const diff = Math.floor(Moment.duration(Moment(Date.now()).diff(Moment(last))).asDays());
		if (diff < 1) {
			text += "сегодня";
		} else if (diff < 2) {
			text += "вчера";
		} else if (diff < 3) {
			text += "позавчера";
		} else if (diff < 5) {
			text += "" + diff + " дня назад";
		} else if (diff < 7) {
			text += "" + diff + " дней назад";
		} else if (diff === 7) {
			text += "неделю назад";
		} else {
			text += "" + diff + " дней назад";
		}
	}
	return <><span className={'bdg bdg-'+
		((state===1 || state===3) ? 'green' : (state===2) ? 'yellow' : 'red')}>
			{text}
		</span></>;
};
