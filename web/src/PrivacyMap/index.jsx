import React from 'react';
import {observer} from 'mobx-react';
import state from './store'
import SpreadMap from "../_comp/SpreadMap";
import SizeProvider from "../_comp/SizeProvider";

export default observer(function(){
  return (
	<>
		<div className="simple-page" style={{height:'calc(100vh - 130px)',overflow:'hidden'}}>
			<h1>Карта распростанения персональных данных</h1>
			<SizeProvider style={{width:'100vw',height:'100vw'}}
										child={({height, width})=>
											<div style={{height,width:width}}>
												<SpreadMap height={height} width={width}/>
											</div>}/>
		</div>
	</>
  )
})