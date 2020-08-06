import React, {useEffect} from "react";
import state from "./store";
import Aside from "./Aside";
import Stage from "./Stage";
import {observer} from "mobx-react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Sns from "./Sns";
import {useHistory} from "react-router-dom";
import SizeProvider from "../_comp/SizeProvider";
import SpreadMap from "../_comp/SpreadMap";

export default React.memo(function Check() {
	state.history = useHistory()
	return (
		<div>
			<div className={"flex-row"}>
				<div style={{flexBasis: "70%"}}>
					<Title/>
				</div>
			</div>
			<div className={"flex-row"}>
				<div style={{flexBasis: "70%",flexGrow:1}}>
					<Stage/>
					<Sns/>
				</div>
				<div style={{flexBasis: "30%",flexGrow:0}} id={'check_aside'}>
					<Aside/>
				</div>
			</div>
		</div>
	);
});

const Title = observer(()=>{
	return <div className={'check-title'}>
		<h1 style={{flexGrow:1}}>Анализ соглашения</h1>
		<div style={{textAlign:'right', flexGrow:0}} className={'flex-col'}>
			<div style={{flexGrow:1}}/>
			<a href="javascript:;" className={'link-text'} onClick={state.reset}
				 style={{textDecoration:'none', flexGrow:0, marginBottom:'8px'}}>
				Удалить всё
			</a>
		</div>
	</div>
})