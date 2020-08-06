import Button from "react-bootstrap/Button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";

export default React.memo(function (props) {
	return (
		<Button
			size={"sm"}
			{...props}
			className={"icon-btn " + (props.className || "")}
			children={[<FontAwesomeIcon icon={props.icon} key={"icon"} />, ...(props.children || [])]}
		/>
	);
});
