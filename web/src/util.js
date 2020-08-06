import Moment from "moment";

let lastId = 0;
export function nextId() {
	return ++lastId;
}

export function identity(a) {
	return a;
}

export function fmtDateTime(d, fmt="HH:mm DD.MM.YYYY") {
	return Moment(d).format(fmt);
}
export function fmtDate(d, fmt="DD.MM.YYYY") {
	return Moment(d).format(fmt);
}

export function getLocalStorageItem(name, def) {
	try {
		return localStorage.getItem(name);
	} catch (e) {
		return def;
	}
}

export async function readFile64(f) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(f);
		reader.onload = () => resolve(reader.result.substring(reader.result.indexOf("base64,")+"base64,".length));
		reader.onerror = (error) => reject(error);
	});
}

export function escapeRegExp(string) {
	return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function debouncer() {
	return function(func, wait, immediate){
		let timeout;
		return function(...args) {
			let later = function() {
				timeout = null;
				if (!immediate) {
					func.apply(null, args);
				}
			};
			let callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(null, args);
			}
		};
	}
}

export function withWindow(f){
	try{
		f(window)
	}catch(e){}
}
export function inBrowser_(){
	try{
		const w=window
		return true
	}catch(e){
		return false
	}
}
export const IN_BROWSER = inBrowser_();

export function parseQuery(s){
	s = (s || window.location.search).substring(1);
	const res = {}
	const ss = s.split('&')
	for(let it of ss){
		const [k,v] = it.split('=')
		res[decodeURIComponent(k)] = decodeURIComponent(v);
	}
	return res;
}

export function isVisible(el,
													container,
													rect=el.getBoundingClientRect(),
													contRect=container.getBoundingClientRect()) {
	return (rect.top >= contRect.y) && (rect.top <= contRect.height+contRect.y);
}

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
export function awaitEl(sel){
	return new Promise(async (r)=>{
		for(;;){
			const it = document.querySelector(sel)
			if(it){
				r(it)
			}
			await sleep(50)
		}
	})
}