import React, {useEffect} from "react";
import {observer} from "mobx-react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {chkRequired, chkMaxLen, chkMinLen, RULE_CUSTOM} from "./var/validation";
import {TextField, PwdField} from "./_comp/Fields";
import {observable, computed, action, runInAction} from "mobx";
import {post} from "./http";
import {useHistory, useLocation} from "react-router";
import store from "./store";

class State {
	@observable id="";
	@observable password = "";
	@observable passwordPristine = true;
	@computed get passwordError() {
		return (
			chkRequired(this.password) || chkMinLen(this.password, 8) || chkMaxLen(this.password, 1024)
		);
	}
	@observable passwordRevealed = false;
	@observable password2 = "";
	@observable password2Pristine = true;
	@computed get password2Error() {
		return (
			chkRequired(this.password2) ||
			chkMinLen(this.password2, 8) ||
			chkMaxLen(this.password2, 1024) ||
			(this.password !== this.password2
				? {id: RULE_CUSTOM, msg: "Пароли не совпадают"}
				: null)
		);
	}
	@observable password2Revealed = false;
	@computed get hasErrors() {
		return Object.getOwnPropertyNames(this)
			.filter((it) => it.endsWith("Error"))
			.map((it) => this[it])
			.some(Boolean);
	}

	history = null;

	@action.bound updateModel({target: {id, value}}) {
		this[id] = value;
	}
	@action.bound clearPristine({target: {id}}) {
		this[id + "Pristine"] = false;
	}
	@action.bound togglePwdVisible(e, id) {
		e.stopPropagation();
		e.preventDefault();
		this[id + "Revealed"] = !this[id + "Revealed"];
	}
	@action.bound async doReset() {
		try {
			await post(
				"/api/public/reset-end",
				{
					id: this.id,
					pwd: this.password,
				},
				(r) => r,
			);
			store.reportSuccess("Пароль изменен. Пожалуйста, войдите.");
			this.history.push({pathname:'/logIn'})
		} catch (e) {
			console.error(e);
			store.reportError("Не удалось изменить пароль.");
		}
	}

	@action.bound reset() {
		this.identifier = this.password = "";
		this.identifierPristine = this.passwordPristine = true;
		this.passwordRevealed = false;
	}
}

export const state = new State();

function noLoginPwd() {
}
async function noPwd(e) {
	e.preventDefault();
	if(!state.identifier){
		store.reportWarn("Пожалуйста, введите почту и нажмите эту кнопку еще раз. " +
			"Вам будет выслано письмо с дальнейшими инструкциями по восстановлению доступа.",
			'Восстановление пароля');
	}
	try{
		await post("/api/public/reset", {
			identifier:state.identifier,
		})
		store.reportSuccess("Вам было вылано письмо с дальнейшими инструкциями по " +
			"восстановлению доступа к аккаунту. ", 'Восстановление пароля');
	}catch(e){
		if(e.status===404){
			store.reportError("Пользователь с такой почтой не найден. " +
				"Пожалуйста, проверьте правильность введенной информации.", 'Восстановление пароля');
		}else {
			throw e;
		}
	}
}
function doOnEnter({key}) {
	if (key === "Enter" && !state.hasErrors) {
		state.logIn();
	}
}

export default observer(function () {
	const {search} = useLocation();
	state.history = useHistory();
	useEffect(function () {
		const res = {};
		search.substring(1).split('&')
			.forEach(it=> res[it.substring(0,it.indexOf('='))]=decodeURIComponent(it.substring(it.indexOf('=')+1)))
		const {id} = res;
		state.id=id
	}, []);
	return (
		<>
			<div className="flex-row">
				<div style={{flexBasis: "25%"}} />
				<div className="flex-col" style={{flexGrow: 2}}>
					<div>
						<h1 style={{display: "inline-block"}}>Восстановление пароля</h1>
						<br />
						<br />
						<Form onChange={state.updateModel}>
							<PwdField id={"password"} label={"Пароль"} state={state} showValid />
							<PwdField id={"password2"} label={"Повторите пароль"} state={state} showValid />
						</Form>
						<br />
						<Button onClick={state.doReset} disabled={state.hasErrors}>
							Сменить пароль
						</Button>
					</div>
				</div>
				<div style={{flexBasis: "25%"}} />
			</div>
		</>
	);
});
