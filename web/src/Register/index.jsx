import React, {useEffect} from "react";
import {observer} from "mobx-react";
import {action, computed, observable, runInAction} from "mobx";
import {chkMaxLen, chkMinLen, chkRequired, RULE_CUSTOM} from "../var/validation";
import {TextField, PwdField, CheckboxField} from "../_comp/Fields";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Stage from '../Check/Stage';
import store from "../store";
import checkState, {TYPE_ID} from '../Check/store';
import {post, get} from "../http";

class State {
	@observable email = "";
	@observable emailPristine = true;
	@computed get emailError() {
		return chkRequired(this.email) || chkMaxLen(this.email, 1024);
	}
	@computed get emailWarning() {
		return !this.emailError
			? "Вам будет направлено письмо для подтверждения"
			: null;
	}
	@observable phone = "";
	@observable phonePristine = true;
	@computed get phoneError() {
		return chkMaxLen(this.phone, 32);
	}
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
	@observable agree = false;
	@observable agreePristine = true;
	@computed get agreeError() {
		return this.agree ? null : {id:RULE_CUSTOM,msg:'Для использования сервиса необходимо принять условия обработки персональных данных'};
	}

	@action.bound updateModel({target: {id, value, type, checked}}) {
		if(type==='checkbox'){
			this[id]=checked
		}else{
			this[id] = value;
		}
	}
	@action.bound clearPristine({target: {id}}) {
		this[id + "Pristine"] = false;
	}
	@action.bound async register() {
		try {
			await post(
				"/api/public/register",
				{
					email: this.email,
					phone: this.phone,
					password: this.password,
				},
				(r) => r,
			);
			store.reportSuccess("Регистрация успешно завершена. Пожалуйста, подтвердите введенные данные.");
		} catch (e) {
			console.error(e);
			store.reportError("Не удалось зарегистрироваться. Пожалуйста, попробуйте еще раз.");
		}
	}
	@action.bound togglePwdVisible(e, id) {
		e.stopPropagation();
		e.preventDefault();
		this[id + "Revealed"] = !this[id + "Revealed"];
	}

	@action.bound reset() {
		this.email = this.phone = this.password = this.password2 = "";
		this.emailPristine = this.phonePristine = this.passwordPristine = this.password2Pristine = true;
		this.passwordRevealed = this.password2Revealed = false;
	}
}

export const state = new State();

function doOnEnter(e) {
	if (e.key === "Enter" && !state.hasErrors) {
		state.register();
	}
}

function showPersonal(e){
	e.stopPropagation()
	e.preventDefault()
	document.querySelector('.navbar-brand').classList.add('max-brand')
}
export default observer(function () {
	useEffect(function () {
		checkState.checkDoc('4d6c6e5', TYPE_ID)
		return ()=> {
			state.reset();
			checkState.reset();
		}
	}, []);
	return (
		<>
			<div className="flex-row">
				<div style={{flexBasis: "25%"}} />
				<div style={{display: "flex", flexDirection: "column", flexGrow: 2}}>
					<div>
						<br />
						<h2>Регистрация</h2>
						<br />
						<Form onChange={state.updateModel} onKeyDown={doOnEnter}>
							<TextField id={"email"} label={"Email"} state={state} showValid />
							{/*<TextField id={"phone"} label={"Номер мобильного телефона"} state={state} showValid />*/}
							<PwdField id={"password"} label={"Пароль"} state={state} showValid />
							<PwdField id={"password2"} label={"Повторите пароль"} state={state} showValid />
						</Form>
					</div>
					<Stage regView/>
					<br />
					<Form onChange={state.updateModel} onKeyDown={doOnEnter}>
						<CheckboxField id={'agree'}
													 label={'Я согласен на передачу и обработку своих персональных данных'}
													 state={state}/>
					</Form>
					<Button onClick={state.register} disabled={state.hasErrors}>
						Зарегистрироваться
					</Button>
				</div>
				<div style={{flexBasis: "25%"}} />
			</div>
		</>
	);
});
