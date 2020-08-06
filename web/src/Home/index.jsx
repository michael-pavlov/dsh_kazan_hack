import React from "react";
import {observer} from "mobx-react";
import {Redirect} from "react-router";

export default
@observer
class Home extends React.Component {
	render() {
		return (
			<>
				<Redirect to={"/check"} />
			</>
		);
	}
}
