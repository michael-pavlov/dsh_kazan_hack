import React, {useEffect} from 'react';
import {observer} from 'mobx-react';
import state from './store';

export default observer(function(){
	const segments = state.bookmarksToDraw;
	return (
		<div style={{height:'100%',width:'2.4em', overflowX:'visible'}}
			id={'hl_bm_bar'}>
			{segments.map(it=> <Bookmark seg={it} key={it.id}/>)}
		</div>
	)
})

function scrollToBm({target:{id}}){
	document.getElementById(id.substring(3)).scrollIntoView()
	window.scrollTo(0,0)
}
const Bookmark = observer(function({seg}){
	const id='bm_'+seg.ref;
	const bm = state.bookmarkStyles;
	return(
		<a id={id} style={bm[seg.ref]} onClick={scrollToBm}>
		</a>
	)
})