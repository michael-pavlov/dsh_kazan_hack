import React, {useEffect} from 'react';
import {observer} from 'mobx-react';
import state from './store';

export default React.memo(function({c,t,inner, seg}){
	let i = seg?.i;
	const id = (i!=null) ? 'th'+i : null
	useEffect(function(){
		if(id){
			const seg = state.segments.find(it=>it.i===i)
			if(seg){
				seg.ref = id
			}
		}
	})
	return (
		<span className={c ? ('hl'+c) : null} id={id} children={inner}/>
	)
})