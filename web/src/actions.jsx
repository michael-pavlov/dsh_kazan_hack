import state from './store';
import {post} from './http'

export function genRecall(ogrn, name){
	let dl = '/api/jurs/recall?ogrn='+ogrn;
	const t = localStorage.getItem("t");
	if (t) {
		dl+='&t='+t;
	}
	const a = document.createElement('a')
	a.href = dl;
	a.download = 'Отзыв_'+name.replace(/"'/g,'').replace(/[^a-zA-Zа-яА-Я0-9-_]/,'_')+'.docx';
	document.body.appendChild(a);
	a.click();
}