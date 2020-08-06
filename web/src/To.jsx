import React from 'react';
import store from './store';
import {state as loginState} from './LogIn'
import {Redirect, useHistory, useLocation} from "react-router";

export default function(){
	const {search} = useLocation();
	const history = useHistory();
	const res = {};
	search.substring(1).split('&')
		.forEach(it=> res[it.substring(0,it.indexOf('='))]=decodeURIComponent(it.substring(it.indexOf('=')+1)))
	const {verified } = res;
	if(verified){
		store.reportSuccess('Теперь вы можете зайти с помощью '+verified, 'Подтверждение успешно')
		loginState.identifier = verified;
		history.push({pathname:'/logIn'})
		return <div/>;
	}
  return <Redirect to='/'/>
}