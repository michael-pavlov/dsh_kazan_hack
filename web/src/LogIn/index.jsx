import React, {useEffect} from "react";
import {observer} from "mobx-react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import store from "../store";
import {Link} from "react-router-dom";
import {chkRequired, chkMaxLen} from "../var/validation";
import {TextField, PwdField} from "../_comp/Fields";
import {observable, computed, action, runInAction} from "mobx";
import {post} from "../http";
import {useHistory} from "react-router";

class State {
	@observable identifier = "";
	@observable identifierPristine = true;
	@computed get identifierError() {
		return chkRequired(this.identifier) || chkMaxLen(this.identifier, 1024);
	}
	@observable password = "";
	@observable passwordPristine = true;
	@computed get passwordError() {
		return chkRequired(this.password) || chkMaxLen(this.password, 1024);
	}
	@observable passwordRevealed = false;
	@computed get hasErrors() {
		return Object.getOwnPropertyNames(this)
			.filter((it) => it.endsWith("Error"))
			.map((it) => this[it])
			.some(Boolean);
	}

	history = null

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
	@action.bound async logIn() {
		await store.logIn(state.identifier, state.password);
		const _ =(store.after.logIn || (()=>this.history.push({pathname:'/personal/org-ls'}))).call();
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
let noPwdTo = null;
async function noPwd(e) {
	if(noPwdTo){
		store.reportWarn("Пожалуйста, подождите несколько минут, пока письмо придет вам на почту."+
			"Если через несколько минут оно все еще не пришло, проверьте папку \"спам\"",
			'Восстановление пароля');
		return
	}
	noPwdTo = setTimeout(()=>clearTimeout(noPwdTo), 120000)
	e.preventDefault();
	if(!state.identifier){
		store.reportWarn("Пожалуйста, введите почту и нажмите эту кнопку еще раз. " +
			"Вам будет выслано письмо с дальнейшими инструкциями по восстановлению доступа.",
			'Восстановление пароля');
	}
	try{
		await post("/api/public/reset-init", {
			identifier:state.identifier,
		},r=>r)
		store.reportSuccess("Вам было вылано письмо с дальнейшими инструкциями по " +
			"восстановлению доступа к аккаунту. ", 'Восстановление пароля');
	}catch(e){
		if(e.status===404){
			clearTimeout(noPwdTo)
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
	state.history = useHistory();
	useEffect(function () {
		document.getElementById("identifier").focus();
	}, []);
	useEffect(function () {
		return state.reset;
	}, []);
	return (
		<>
			<div className="flex-row">
				<div style={{flexBasis: "25%"}} />
				<div className="flex-col" style={{marginTop: "20vh", flexGrow: 2}}>
					<div>
						<h1 style={{display: "inline-block"}}>Войти</h1>{" "}
						<Link to={"/register"} onClick={noLoginPwd}>
							<span className={"problem-text"}>У меня нет данных для входа</span>
						</Link>
						<br />
						<br />
						<Form onChange={state.updateModel} onKeyDown={doOnEnter}>
							<TextField
								id={"identifier"}
								label={"Пользователь"}
								placeholder={"Введите e-mail..."}
								state={state}
							/>
							<PwdField
								id={"password"}
								label={
									<>
										Пароль
										<Link to={"#"} onClick={noPwd} tabIndex="4">
											<span className={"problem-text"}>Не помню пароль</span>
										</Link>
									</>
								}
								state={state}
							/>
						</Form>
						<br />
						<Button onClick={state.logIn} disabled={state.hasErrors}>
							Войти
						</Button>
						<br />
						<br />
						<br />
						<p>Первый раз на нашем сайте?</p>
						<Link to={"/register"}>
							<Button variant={"outline-success"}>Зарегистрируйтесь</Button>
						</Link>
					</div>
				</div>
				<div style={{flexBasis: "25%"}} />
			</div>
		</>
	);
});
