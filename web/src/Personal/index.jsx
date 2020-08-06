import React, {useEffect} from "react";
import {observer} from "mobx-react";
import Nav from "react-bootstrap/Nav";
import {NavLink, Link, Switch, Route, Redirect} from "react-router-dom";
import {identity} from "../util";
import store from "../store";
import OrgLs from "./OrgLs";
import Settings from "./Settings";
import state from "./store";

function pageEffect(){
	return state.reset
}
export default observer(function () {
	useEffect(pageEffect,[])
	return (
		<>
			<div className={"simple-page"}>
				<h1>Личный кабинет</h1>
				<div className={"flex-row"}>
					<div style={{flexBasis: "20%"}}>
						<Nav
							variant={"light"}
							className={"flex-col personal-side-nav"}
							style={{
								backgroundColor: "var(--secondary)",
								borderRadius: "15px",
								marginRight: "15px",
							}}
						>
							<Nav.Link to="/personal/org-ls" as={NavLink}>
								Список организаций
							</Nav.Link>
							<Nav.Link to="/personal/cfg" as={NavLink}>
								Настройки
							</Nav.Link>
							<Nav.Link to={identity} onClick={logOut} as={Link}>
								Выход
							</Nav.Link>
						</Nav>
					</div>
					<div style={{flexBasis: "80%"}}>
						<Switch>
							<Route path={"/personal/org-ls"} component={OrgLs} />
							<Route path={"/personal/cfg"} component={Settings} />
							<Route path={"/"} component={NoRoute} />
						</Switch>
					</div>
				</div>
			</div>
		</>
	);
});

async function logOut() {
	await store.logOut();
}

function NoRoute() {
	return <Redirect to={"/personal/org-ls"} />;
}
