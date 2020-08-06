import React from "react";
import {observer} from "mobx-react";
import state, {TYPE_TEXT, TYPE_FILE, TYPE_ID} from "./store";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import Bookmarks from './Bookmarks';
import {genRecall} from "../actions";
import {TEXT_VIEW_H} from "./Stage";
import SizeProvider from "../_comp/SizeProvider";
import SpreаdMap from "../_comp/SpreаdMap";

export default observer(()=>{
	return <div className={'flex-row'} style={{width:'29vw'}}>
		<aside style={{flexBasis:'0',width:0,overflow:'visible'}}>
			<AsideLeft/>
		</aside>
		<aside style={{flexGrow:1, width:"inherit"}}>
			<div style={{paddingLef:'1em'}}>
				<div className={'flex-col'} style={{height:'calc(100vh - 155px)'}}>
					<div style={{flexBasis:'26em',minHeight: '25em'}}>
						<AsideRight />
					</div>
					<br/>
					<div style={{flexGrow:1,width:'inherit',overflow:'hidden'}}>
						<PrivacyMap/>
					</div>
					<br/>
					<aside style={{flexBasis:'2em'}}>
						<div>
						</div>
					</aside>
				</div>
			</div>
		</aside>
	</div>
})

const AsideLeft = observer(function(){
	const s = state.stage
	if(s===1){
		return <div style={{width:'1.6em'}}>
			<FontAwesomeIcon icon={'arrow-left'} style={{margin:'0 5px',transform:'scaleX(1.5)'}}/>
		</div>
	}else if(s===3){
		return <div style={{width:'2.4em', height:'calc('+TEXT_VIEW_H+' - 6px)', marginTop:'8px', position:'absolute'}}>
			<Bookmarks/>
		</div>
	}
})

const PrivacyMap = observer(function(){
	const data = state.chartData
	for(let n of data.nodes){
		delete n.ref
		delete n.textW
		delete n.routes
		delete n.lockClr
	}
	for(let l of data.links){
		delete l.ref
		delete l.lockClr
	}
	const _ = state.selectedJur
	return <SizeProvider style={{width:'100vh',height:'100vw'}}
											 child={({height, width})=>
												 <div style={{height: height+'px',width:width+'px'}}>
													 <SpreadMap height={height} width={width} data={data}/>
												 </div>}/>
})

const AsideRight = observer((_) => {
	const {stage} = state;
	if (stage===1) {
		if(state.text && state.text.length>0){
			return null;
		}
		return (
				<div style={{paddingLeft:'0.6em'}}>
					Вставьте текст, ссылку, фотографию или файл с соглашением на русском языке
					<br/>
					<br/>
					Выбрать файл
					<br/>
					<div>
						<Button onClick={chooseFile} size={'sm'} className='btn-dark-orange'>Окно выбора</Button>
					</div>
					<br/>
					Проверьте политику приватности известных компаний
					<Examples/>
				</div>
		);
	}
	if (stage===3) {
		return (
			<div style={{paddingLeft: '1.5em',marginRight:'2em'}}>
				<SelectedJur/>
			</div>
		);
	}
	return null;
});

function goToJur({target:{id}}){
	state.checkDoc(id, TYPE_ID)
}
const Examples=observer(function(){
	return <div>
		{state.popJurs.map(it=><Example id={it.public_id} name={it.name}/>)}
	</div>
})
const Example=React.memo(function({name,id}){
	return <Button
		variant={"primary"}
		size={"sm"}
		className={"jur-btn"}
		id={id}
		onClick={goToJur}
	>
		{name}
	</Button>
})

const SelectedJur=observer(()=>{
	const jur = state.selectedJur;
	if(jur==null){
		return null;
	}
	if(jur.ogrn==null){
		return (<>
			<div style={{fontWeight:'bold'}}>{jur.match}</div>
			<br/>
			<div style={{fontSize:'0.8em'}}>
				Неизвестное юридическое лицо
			</div>
		</>)
	}
	return(<>
		<div style={{fontWeight:'bold'}}>{jur.fullname || jur.possibleName}</div>
		<br/>
		<div style={{fontSize:'0.8em'}}>
			<div>ОГРН: {jur.ogrn}</div>
			<div>Адрес: {jur.address}</div>
			<br/>
			<br/>
			<div>
				<span style={{fontWeight:'bold'}}>Рейтинг:
					<span style={{fontSize:'1.2em'}}> {jur.rate ?? '?'}</span>
				</span>
				<a href="javascript:;" onClick={explainRate} className={'link-text'} style={{marginLeft:'1em'}}>Что это значит?</a>
			</div>
			<br/>
			<div>
				<span style={{fontWeight:'bold'}}>Отзывов:
					<span style={{fontSize:'1.2em'}}> {jur.recalled ?? '?'}</span>
				</span>
			</div>
			<div>
				<span style={{fontWeight:'bold'}}>Успешных:
					<span style={{fontSize:'1.2em'}}> {jur.succeeded ?? '?'}</span>
				</span>
			</div>
			<br/>
			{jur.exists ? <div>
				<span style={{fontWeight: 'bold'}}>Эта компания уже имеет ваше согласие на распространение персональных данных
				</span>
			</div> : null}
		</div>
		<br/>
		<div>
			<Button variant={'primary'} size={'sm'} className='btn-dark-orange'
							style={{marginRight:'10px'}}
							onClick={()=>recallTemplate(jur.ogrn,jur.fullname)}>
				Скачать шаблон отзыва</Button>
			{!jur.exists ? <Button variant={'primary'} size={'sm'} className='btn-dark-orange'
							 onClick={saveJur}>
				Сохранить себе</Button> : null}
		</div>
	</>)
})

function chooseFile(){
	const it = document.createElement('input');
	it.type='file';
	it.multiple=true;
	it.addEventListener('change',({target})=>{
		state.checkDoc(target.files, TYPE_FILE);
	})
	document.body.append(it);
	it.click();
}
function explainRate(){
	console.error('Not implemented')
}
function recallTemplate(ogrn, name){
	if(ogrn){
		genRecall(ogrn, name)
	}
}
function saveJur() {
	state.saveJurs([state.selectedJur]);
}