import React from "react";
import ReactDOM from "react-dom";
import {BrowserRouter} from "react-router-dom";
import "mobx-react/batchingForReactDom";
import App from "./App";
import "./index.scss";
// import * as serviceWorker from "./serviceWorker";

import {library} from "@fortawesome/fontawesome-svg-core";
import {
	faKey,
	faUser,
	faEye,
	faEyeSlash,
	faAlignLeft,
	faFileAlt,
	faTimes,
	faPenAlt,
	faFileWord,
	faFilePdf,
	faFileExcel,
	faImage,
	faQuestion,
	faRobot,
	faLevelUpAlt,
	faWindowMinimize,
	faCopyright,
	faArrowLeft,
	faSearch,
	faBlog,
	faSignInAlt,
	faUserAlt,
	faDownload,
	faPencilAlt,
	faFilter,
	faSync,
	faSortAmountUpAlt,
	faSortAmountDownAlt,
	faCopy,
} from "@fortawesome/free-solid-svg-icons";
library.add(
	faKey,
	faUser,
	faEye,
	faEyeSlash,
	faAlignLeft,
	faFileAlt,
	faTimes,
	faPenAlt,
	faFileWord,
	faFilePdf,
	faFileExcel,
	faImage,
	faQuestion,
	faCopyright,
	faRobot,
	faLevelUpAlt,
	faWindowMinimize,
	faArrowLeft,
	faSearch,
	faBlog,
	faSignInAlt,
	faUserAlt,
	faDownload,
	faPencilAlt,
	faFilter,
	faSync,
	faSortAmountUpAlt,
	faSortAmountDownAlt,
	faCopy,
);

ReactDOM.render(<App router={BrowserRouter} routerProps={{}} />, document.getElementById("r"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
