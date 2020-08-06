import React from "react";
import {observer} from "mobx-react";
import Alert from "react-bootstrap/Alert";
import store from "./store";

export default
@observer
class Alerts extends React.Component {
	render() {
		return (
			<div id={"alerts"}>
				{store.alerts.map((it) => (
					<Alert {...it.props} key={it.cfg.id}>
						{it.cfg.header ? <Alert.Heading>{it.cfg.header}</Alert.Heading> : null}
						{it.cfg.text}
					</Alert>
				))}
			</div>
		);
	}
}
