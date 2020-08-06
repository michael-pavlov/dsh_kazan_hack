import React from "react";
import {observer} from "mobx-react";

export default
@observer
class P404 extends React.Component {
	render() {
		return (
			<>
				<h3>Sorry! Your content was not found</h3>
			</>
		);
	}
}
