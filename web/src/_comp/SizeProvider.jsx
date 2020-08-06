import React, {useEffect, useRef, useState} from 'react';

export default function(props){
	const r = useRef();
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	function determineSize(){
		const rect = r.current.getBoundingClientRect()
		const pRect = r.current.parentElement.getBoundingClientRect()
		const w = Math.floor(Math.min(rect.width, document.documentElement.clientWidth - rect.x, pRect.width))
		setWidth(w)
		const h = Math.floor(Math.min(rect.height, document.documentElement.clientHeight - rect.y, pRect.height))
		setHeight(h)
	}
	useEffect(determineSize,[])
	useEffect(()=>{
		window.addEventListener('resize', determineSize)
		return ()=> window.removeEventListener('resize', determineSize)
	},[])
	const renderProps = {...props, child:null}
	const RenderChild = (height&&width) ?
		props.child
		: ()=>null;
  return (
		<div {...renderProps} ref={r}>
			<RenderChild width={width} height={height}/>
		</div>
  )
}