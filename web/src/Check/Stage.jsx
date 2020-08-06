import React, {useEffect} from "react";
import {observer} from "mobx-react";
import state, {TYPE_FILE, TYPE_ID, TYPE_TEXT} from "./store";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import store from "../store";
import {runInAction} from "mobx";
import {Scrollbars} from "react-custom-scrollbars";
import Form from "react-bootstrap/Form";

export const TEXT_VIEW_H = '25em'

export default observer(({regView}) => {
	useEffect(onPasteEffect, []);
	const {stage} = state;
	if (stage === 1) {
		return (
			<Stage1/>
		);
	}
	if (stage === 2) {
		return (
			<Stage2/>
		);
	}
	if (stage === 3) {
		return (
			<Stage3 regView={regView}/>
		);
	}
});

const Stage1 = observer((_) => {
	useEffect((_) => {
		textareaFitHeight({target: document.getElementById("doc-input-textаrea")});
	});
	return (
		<Scrollbars
			style={{height: TEXT_VIEW_H, border: "1px solid #5f5f5f", borderRadius:'5px'}}
			renderThumbHorizontal={renderScrollBarThumb}
			renderThumbVertical={renderScrollBarThumb}
			universal
		>
			<Form.Control
				as={"textarea"}
				style={{border: "none", resize: "none"}}
				id={"doc-input-textarea"}
				value={state.text}
				onChange={state.setText}
				spellCheck={false}
			/>
		</Scrollbars>
	);
});

const Stage2 = observer((_) => {
	return (
		<>
			<div className={"flex-col"} style={{backgroundColor: "var(--light)", height: TEXT_VIEW_H}}>
				<Scrollbars
					style={{height: TEXT_VIEW_H, border: "1px solid #5f5f5f", borderRadius:'5px', }}
					renderThumbHorizontal={hideScrollBatThumb}
					renderThumbVertical={hideScrollBatThumb}
					universal
				>
					<Form.Control
						as={"textarea"}
						style={{border: "none", resize: "none", height:'100%', overflow:'hidden', backgroundColor:'var(--bg-cl)', color:'#969696'}}
						id={"doc-input-textarea"}
						value={state.text}
						spellCheck={false}
					/>
					<div className='spinner'/>
					<LoadProgressBar
						style={{zIndex:100, position:'absolute', bottom:0, left:0, width:'100%', height:'5px'}}/>
				</Scrollbars>
			</div>
			<br />
		</>
	);
});

const Stage3 = observer(({regView}) => {
	return (
		<>
			<TextHighlighted />
			{regView ? null : <div style={{fontSize: '0.9em', marginLeft: '0.3rem'}} className={'chk-results'}>
				<ZoneResult/>
				<Jurs/>
				<JursMeh/>
				<JursBad/>
			</div>}
		</>
	);
});

const ZoneResult = observer(() => {
	const {zone, zoneText:text} = state;
	const changeable = <span style={{color:'var(--cl-zone-'+zone+')'}}>
		{text}
	</span>
	return (
		<p className='mbsm'>
			Уровень риска: {changeable} <a href={state.riskDescr} className={'link-text'}>Что это значит?</a>
		</p>
	);
});

const Jurs = observer(() => {
	const {jursGood:jurs} = state;
	if (jurs && jurs.lеngth>0) {
		return (
			<>
				<p style={{color:'#4a4a4a'}} className='mbsm'>
					Выберите компании, которые хотите сохранить, или&nbsp;
					<a href="javascript:;" className={'link-text'} style={{color:'#008334'}} onClick={saveAllJurs}>
						Сохраните все
					</a>
				</p>
				{jurs.map((it) => (
					<Jur key={it.match} name={it.validName} it={it} />
				))}
				<div className='mbsm'/>
			</>
		);
	}
	return null;
});
const JursMeh = observer(() => {
	const {jursMeh:jurs} = state;
	if (jurs && jurs.lеngth>0) {
		return (
			<>
				<p style={{color:'#4a4a4a'}} className='mbsm'>
					Мы не смогли однозначно определить несколько компаний, но их тоже можно сохранить:
				</p>
				{jurs.map((it) => (
					<Jur key={it.match} name={it.possibleName} it={it} />
				))}
			</>
		);
	}
	return null;
});
const JursBad = observer(() => {
	const {jursBad:jurs} = state;
	if (jurs && jurs.lеngth>0) {
		return (
			<>
				<p style={{color:'#4a4a4a'}} className='mbsm'>
					Эти сущности похожи на юридические лица, но мы не нашли их в базе ФНС, возможно они
					написаны с ошибкой или прекратили существование:
				</p>
				{jurs.map(({match}) => (
					<Button
						variant={"primary"}
						size={"sm"}
						disabled
						className={'jur-btn'}
						style={{backgroundColor: '#FFDADA'}}>
						{match}
					</Button>
				))}
			</>
		);
	}
	return null;
});
const Jur = observer(({it, name}) => {
	const active = state.selectedJur==it;
	const style= (active || it.isvalid) ? undefined : {backgroundColor:'#E9E9E9'};
	return (
		<Button
			variant={"primary"}
			size={"sm"}
			style={style}
			className={"jur-btn"}
			onClick={showJur}
			active={active}
		>
			{name}
		</Button>
	);
});

function onPaste(e) {
	if(state.text && state.text.length>0){
		return;
	}
	const cd = e.clipboardData;
	if (cd.files[0]) {
		const f = cd.files;
		state.checkDoc(f, TYPE_FILE);
	}else{
		const text = cd.getData('Text');
		runInAction(()=>state.text = text);
		state.checkDoc(text, TYPE_TEXT)
	}
}
function onPasteEffect() {
	window.addEventListener("paste", onPaste);
	return (_) => {
		window.removeEventListener("paste", onPaste);
	};
}
function showJur(it){
	state.selectedJur = it;
}
function saveAllJurs(){
	state.saveJurs();
}

function hideScrollBatThumb(){
	return <span/>;
}
function renderScrollBarThumb({style, ...props}) {
	return (
		<div
			className="scroll-thumb"
			style={{...style, display: "block", borderRadius: "inherit"}}
			{...props}
		/>
	);
}
function setView({target}){
	runInAction(()=>{
		state.textView=target.getBoundingClientRect()
	})
}
function initView(){
	const el = document.querySelector('.mbsm').firstElementChild;
	el.addEventListener('scroll',setView)
	runInAction(()=>{
		state.textView=el.getBoundingClientRect()
		state.textViewHeight = state.textView.height
		state.textTotalHeight = el.querySelector('p').getBoundingClientRect().height
	})
}
export const TextHighlighted = observer(() => {
	useEffect(initView)
	return (
		<Scrollbars
			style={{height: TEXT_VIEW_H, border: "1px solid #333",
				marginTop: "5px", backgroundColor: '#fff'}}
			renderThumbHorizontal={renderScrollBarThumb}
			renderThumbVertical={renderScrollBarThumb}
			className='mbsm'
			universal
		>
			<div contentEditable onInput={state.onEditContent}
					 spellCheck={false}
					 id={"text-preview"} style={{padding: '0.5em',minHeight:'24.9em'}}>
				{state.highlighted}
			</div>
		</Scrollbars>
	);
});