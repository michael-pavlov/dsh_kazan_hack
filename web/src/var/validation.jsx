import Form from "react-bootstrap/Form";
import React from "react";

export const RULE_CUSTOM = 0;
export const RULE_REQUIRED = 1;
export const RULE_MINLENGTH = 2;
export const RULE_MAXLENGTH = 3;

export function chkRequired(val) {
	return val == null || val === "" || val === []
		? {
				//null or undefined or "" or []
				id: RULE_REQUIRED,
		  }
		: null;
}
export function chkMinLen(val, l) {
	if (val == null) {
		//null or undefined
		return null;
	}
	return val.length < l
		? {
				id: RULE_MINLENGTH,
				l,
		  }
		: null;
}
export function chkMaxLen(val, l) {
	if (val == null) {
		//null or undefined
		return null;
	}
	return val.length > l
		? {
				id: RULE_MAXLENGTH,
				l,
		  }
		: null;
}

export function Feedback(props) {
	const r = props.error;
	if (!r) {
		const w = props.warning
		if(!w){
			return <Fb/>;
		}
		return <Fb type={'warning'}>{w}</Fb>
	}
	if (r.id === RULE_CUSTOM) {
		return <Fb>{r.msg}</Fb>;
	}
	if (r.id === RULE_REQUIRED) {
		return <Fb>Пожалуйста, заполните поле</Fb>;
	}
	if (r.id === RULE_MINLENGTH) {
		return (
			<Fb>
				Значение не должно быть короче {r.l} символов
			</Fb>
		);
	}
	if (r.id === RULE_MAXLENGTH) {
		return (
			<Fb>
				Значение не должно быть длиннее {r.l} символов
			</Fb>
		);
	}
}
const Fb = React.memo(function({children, type='error'}){
	const className = type==='error' ? "invalid-feedback" : 'warning-feedback'
	return <div style={{height:'15px'}}>
		<div className={className}>{children}</div>
	</div>
})
