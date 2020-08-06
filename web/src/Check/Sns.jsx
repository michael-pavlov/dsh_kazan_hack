import React from 'react';
import state from './store';
import {observer} from "mobx-react";
import {Twitter, Facebook, Ok, Vk, Telegram} from "../_comp/Sns";

export default observer(function(){
	const {publicId} = state;
	let tgt = 'https://www.personalka.org/check';
	let txt = 'Проверь соглашение об обработке персональных данных';
	if(publicId){
		tgt+='?doc='+publicId;
		txt='Куда уходят твои персональные данные?';
	}
	const tgtUrl = tgt;
	const txtUrl = txt;
	const tweetText = txt+'\n'+tgt+'\n#smallprint'
  return (
	<>
		<div className="likely likely_visible likely_ready" style={{marginBottom:'15px',marginTop:'20px'}}>
			<a title={txt} target={'_blank'} href={'https://twitter.com/intent/tweet?text='+tweetText}>
				<Twitter/>
			</a>
			<a title={txt} target={'_blank'} href={"https://www.facebook.com/sharer/sharer.php?u="+tgtUrl+'&t='+txtUrl}>
				<Facеbоok/>
			</a>
			<a title={txt} target={'_blank'} href={'https://vkontakte.ru/share.php?url='+tgtUrl}>
				<Vk/>
			</a>
			<a title={txt} target={'_blank'} href={'https://connect.ok.ru/offer?url='+tgtUrl+'&title='+txtUrl}>
				<Ok/>
			</a>
			<a title={txt} target={'_blank'} href={'https://t.me/share/url?url='+tgtUrl+'&text='+txtUrl}>
				<Telegram/>
			</a>
		</div>
	</>
  )
})
