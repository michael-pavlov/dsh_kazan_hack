import React from "react";
import {observer} from "mobx-react";
import Form from "react-bootstrap/Form";
import {Feedback} from "../var/validation";
import IconBtn from "./IconBtn";

export const TextField = observer(function ({
	id,
	label,
	placeholder,
	groupProps,
	inputProps,
	state,
	showValid,
}) {
	if (!placeholder) {
		placeholder = label + "...";
	}
	const error = state[id + "Error"];
	const warning = state[id + "Warning"];
	const pristine = state[id + "Pristine"];
	return (
		<Form.Group controlId={id} {...(groupProps instanceof Function ? groupProps() : groupProps)}>
			<Form.Label style={{width: "100%"}}>{label}</Form.Label>
			<Form.Control
				name={id}
				isValid={showValid && !pristine && !error}
				isInvalid={!pristine && !!error}
				placeholder={placeholder}
				onBlur={state.clearPristine}
				value={state[id]}
				{...(inputProps instanceof Function ? inputProps() : inputProps)}
			/>
			<Feedback error={error} warning={warning}/>
		</Form.Group>
	);
});

export const PwdField = observer(function ({id, label, state, showValid}) {
	const error = state[id + "Error"];
	const pristine = state[id + "Pristine"];
	const revealed = state[id + "Revealed"];
	return (
		<Form.Group controlId={id}>
			<Form.Label style={{width: "100%"}}>{label}</Form.Label>
			<Form.Control
				name={id}
				isValid={showValid && !pristine && !error}
				isInvalid={!pristine && !!error}
				placeholder={"Введите пароль..."}
				onBlur={state.clearPristine}
				value={state[id]}
				type={revealed ? "text" : "password"}
			/>
			<Form.Check>
				<IconBtn
					icon={revealed ? "eye-slash" : "eye"}
					size={"sm"}
					style={{
						position: "relative",
						float: "right",
						top: "-36px",
						fontSize: "1.2em",
						zIndex: 9999,
					}}
					for={id}
					tabIndex="-1"
					onClick={(e) => state.togglePwdVisible(e, id)}
				/>
			</Form.Check>
			<Feedback error={error} />
		</Form.Group>
	);
});

export const CheckboxField = (function ({
																			id,
																			label,
																			groupProps,
																			inputProps,
																			state,
																		}) {
	const error = state[id + "Error"];
	const warning = state[id + "Warning"];
	return (
		<Form.Group {...(groupProps instanceof Function ? groupProps() : groupProps)}>
			<div style={{whiteSpace: 'nowrap'}}>
				<input
					id={id}
					type={'checkbox'}
					onBlur={state.clearPristine}
					value={state[id]}
					{...(inputProps instanceof Function ? inputProps() : inputProps)}
				/>
				<Form.Label for={id} style={{marginLeft:'10px'}}>{label}</Form.Label>
			</div>
			<Feedback error={error} warning={warning} />
		</Form.Group>
	);
});
