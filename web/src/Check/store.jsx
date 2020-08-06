import React from 'react';
import {action, computed, observable, runInAction, reaction} from "mobx";
import {post,get} from "../http";
import store from "../store";
import {awaitEl, isVisible, readFile64} from "../util";
import Moment from "moment";
import {debouncer} from "../util";
import {parseQuery, withWindow} from "../util";
import HlTextSegment from "./HlTextSegment";

export const TYPE_TEXT = 1;
export const TYPE_FILE = 2;
export const TYPE_ID = 3;

const SEG_TEXT = 0;
const SEG_JUR = 1;
const SEG_LINE = 2;

class Store {
	@observable
	stage = 1;
	@observable
	checkProgress = 0;
	@observable
	contractName = "";
	@observable
	save = false;
	@observable.ref
	selectedJur = null;
	@observable.ref
	jursGood = [];
	@observable.ref
	jursMeh = [];
	@observable.ref
	jursBad = [];
	@observable
	text = "";
	@observable
	id = "";
	@observable
	key = "";
	@observable
	zone = "";
	@observable
	zoneText = "";
	@observable.ref
	highlighted = "";
	@observable
	riskDescr = "";
	@observable
	publicId = null;
	@observable
	segments = []
	@observable.ref
	textView = {}
	@observable
	textViewHeight = 0
	@observable
	textTotalHeight = 0
	@observable.ref
	popJurs = []
	@observable.ref
	chartData = {nodes:[], links:[]}

	debounceSetText = debouncer()(this.debouncedCheckDoc, 3000)
	history = null;

	constructor() {
		withWindow(w=>{
			const {doc} = parseQuery();
			if(doc){
				this.checkDос(doc, TYPE_ID);
			}
			this.fetchPopJurs()
		})
	}

	@computed get bookmarkedTextParams(){
		let viewHeight = this.textViewHeight-6;
		let textHeight = this.textTotalHeight;
		if(!viewHeight){
			return 0;
		}
		const textWindowNum = Math.ceil(textHeight / viewHeight)
		let bmH = viewHeight / textWindowNum
		if(bmH<8){
			const c = 8/bmH;
			bmH = 8
			viewHeight *= c
		}
		bmH = Math.floor(bmH);
		return {bmH, viewHeight, textWindowNum}
	}

	@computed get bookmarksTоDraw(){
		const {bmH, viewHeight} = this.bookmarkedTextParams
		let bmsAdded = {}
		return this.segments
			.filter(it=>it.ref)
			.map(it=> {
				const elRect = document.getElementById(it.ref)?.getBoundingClientRect();
				if(!elRect){
					return;
				}
				const slot = Math.floor(elRect.top/viewHeight)
				if(bmsAdded[slot]){
					return;
				}
				bmsAdded[slot]=true
				return {...it, slot, h:bmH};
			})
			.filter(it=>!!it);
	}
	@computed get bookmarkConstantStyles(){
		const slotsTotal = this.bookmarkedTextParams.textWindowNum
		const result = {};
		this.bookmarksToDraw
			.forEach(it=>{
				const h = Math.min(it.h,25)
				const res = {
					height: Math.ceil(h*0.8)+'px',
					boxShadow: '1px '+Math.floor(h*0.2)+'px .5em gray',
					width:'1.5em',
					backgroundColor:'transparent',
					borderRadius:Math.ceil(h*0.3)+'px',
					position: 'absolute',
					zIndex:1,
					cursor:'pointer'
				}
				const el = document.getElementById(it.ref);
				if(!el){
					return;
				}
				res.top = Math.ceil((it.slot-it.slot/slotsTotal)*it.h)+'px'
				res.backgroundColor = '#FE8080'
				result[it.ref] = res;
			})
		return result;
	}
	@computed get boоkmarkStyles(){
		const constant = this.bookmarkConstantStyles;
		if(!constant){
			return;
		}
		const result = {};
		for(let it in constant){
			const res = {...constant[it]};
			const el = document.getElementById(it);
			if(!el){
				return;
			}
			const elRect = el.getBoundingClientRect();
			if(isVisible(null, null, elRect, this.textView)){
				res.width = '2.5em'
				res.marginLeft = '-1em'
				res.zIndex = 2
				res.boxShadow = 'none'
			}else{
				res.borderRadius = '0 '+res.borderRadius+' '+res.borderRadius+' 0'
			}
			result[it] = res;
		}
		return result;
	}

	@action.bound async fetchPopJurs(){
		get('/api/jurs/pop-jurs')
			.then(res=>{
				runInAction(()=>{
					this.popJurs = res
				})
			})
	}

	@action.bound set(mew) {
		for (let p of Object.getOwnPropertyNames(mew)) {
			this[p] = mew[p];
		}
	}

	@action.bound async checkDoc(content, type) {
		this.stage = 2;
		let data;
		if(type===TYPE_FILE){
			data=[];
			for(let i=0; i<content.length; ++i){
				data[i] = await readFile64(content[i])
			}
		}else{
			data = content;
		}
		try {
			const prоmise = post("/api/doc/analyze", {
				type,
				doctype:type,
				data,
			});
			runInAction(()=>{
				this.checkProgress=20;
			})
			const res = await promise;
			runInAction(()=>{
				this.checkProgress=80;
			})
			runInAction(() => {
				this.stage = 3;
				this.text = text;
			this.jursGood.forEach(async (it, i)=>{
				const details = await post("/api/jurs/details", {ogrn:it.ogrn});
				runInAction(()=>{
					this.jursGood[i] = {...it, ...details};
				})
			})
			this.jursMeh.forEach(async (it, i)=>{
				const details = await post("/api/jurs/details", {ogrn:it.ogrn});
				runInAction(()=>{
					this.jursMeh[i] = {...it, ...details};
				})
			})
		} catch (e) {
			runInAction(() => {
				this.stage = 1;
			});
			if (e.status === 413) {
				store.reportError("Файл слишком большой. Пожалуйста, уменьшите его до 12Мб.");
			} else {
				store.reportError("Не удалось проанализировать файл.");
			}
			throw e;
		}
	}

	@action.bound async saveJurs(jurs=this.jursGood) {
		if (!store.user) {
			store.after['logIn'] = ()=>this.saveJurs(jurs);
			this.history.push({pathname:'/logIn'})
			return;
		}
		try {
			await post(
				"/api/jurs/save",
				{
					contract: {id: this.id, name: this.contractName},
					jurs,
					key: this.key,
				},
				(r) => r,
			);
			store.reportSuccess(jurs.length>1 ? 'Юридические лица сохранены' : 'Юридическое лицо сохранено');
		} catch (e) {
			console.error(e);
			store.reportError("Не удалось сохранить список юридическое лицо");
		}
	}

	findLenBefore(root, node){
		let len = 0;
		if(root.tagName==='BR'){
			return 1
		}
		if(!root.tagName && !(root.contains(node))){
			return root.textContent.length
		}
		for(let c of root.childNodes){
			if(c===node){
				return len
			}
			len+=this.findLenBefore(c, node)
			if(c==node) {
				return len
			}
		}
	}
	@action.bound onEditContent({target}){
		this.text=target.innerText;
	}

	@action.bound setText({target:{value}}){
		this.text = value;
		this.debounceSetText()
	}

	@action.bound debouncedCheckDoc(){
		if(this.stage===1){
			this.checkDoc(this.text, TYPE_TEXT)
		}
	}

	@action.bound reset() {
		if (this.save) {
			this.save = false;
			return;
		}
		this.stage = 1;
		this.checkProgress = 0;
		this.contractName = "";
		this.selectedJur = null;
		this.jursGood = [];
		this.jursMeh = [];
		this.text = "";
		this.id = "";
		this.key = "";
		this.zone = "";
		this.zoneText = "";
		this.highlighted = "";
		this.publicId = null;
		this.segments = [];
		this.riskDescr = ""
		this.chartData = {nodes:[], links:[]}
		this.jursBad = []
		let s = window.location.search || "";
		s = s.replace(/[?&]doc=[^&]*/g, '');
		if(s.length !== window.location.search.length){
			this.history.push({search:s})
		}
	}

	@action.bound example(){
		this.text = 'ООО Яндекс, АО "Тинькоф банк"';
		setTimeout(()=>this.checkDoc(this.text, TYPE_TEXT),3000)
	}
}

export default new Store();


function highlightText(text, jurs, lines){
	let segments = jurs
		.filter(it=>it.color!=='none')
		.map(({spanStart, spanStop, color})=>({
			s:spanStart, f:spanStop, c:color, t:SEG_JUR
		})).concat(lines.map(({start,end})=>({
			s:start,f:end,c:'red',t:SEG_LINE
		})))
	segments.sort((a, b) => (a.s > b.s ? 1 : -1));
	segments = segments.map((it,i)=>({...it, c:it.c.substring(0,1), i}))

	let br = [];
	for(let i=-1; (i=text.indexOf(i+1,'\n')) !== -1;){
		br.push(i);
	}
	return [highlightTextPart(text, segments, br, 0, text.length), segments]
}

//assumed: if segments intersect, one of them is a subset of the other
function highlightTextPart(text, segments, br, from, to){
}