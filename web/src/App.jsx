import React, {useEffect} from "react";
import {observer} from "mobx-react";
import Navbar from "./Navbar";
import {Switch, Route} from "react-router-dom";
import Personal from "./Personal";
import Check from "./Check";
import LogIn from "./LogIn";
import ForBusiness from "./ForBusiness";
import About from "./About";
import Home from "./Home";
import Alerts from "./Alerts";
import Footer from "./Footer";
import Register from "./Register";
import store from "./store";
import {Redirect} from "react-router";
import To from './To';
import ResetPassword from "./ResetPassword";
import Privacy from './Privacy'
import PrivacyMap from './PrivacyMap'
import SpreadMap from './_comp/SpreadMap'

export default observer((props) => {
	const {user} = store;
	let routes;
	if (user) {
		routes = (
			<Switch>
				<Route path="/personal">
					<Personal />
				</Route>
				<Route path="/check">
					<Check />
				</Route>
				<Route path="/about">
					<About />
				</Route>
				<Route path="/for-business">
					<ForBusiness />
				</Route>
				<Route exact path="/">
					<Home />
				</Route>
				<Route exact path='/to'>
					<To/>
				</Route>
				<Route exact path='/privacy'>
					<Privacy/>
				</Route>
				<Route exact path='/privacy-map'>
					<PrivacyMap/>
				</Route>
				<Route exact path='/chart'>
					<SpreadMap/>
				</Route>
				<Route>
					<Redirect to={"/"} />
				</Route>
			</Switch>
		);
	} else {
		routes = (
			<Switch>
				<Route path="/logIn">
					<LogIn />
				</Route>
				<Route path="/check">
					<Check />
				</Route>
				<Route path="/register">
					<Register />
				</Route>
				<Route path="/about">
					<About />
				</Route>
				<Route path="/for-business">
					<ForBusiness />
				</Route>
				<Route exact path="/">
					<Home />
				</Route>
				<Route path="/reset">
					<ResetPassword/>
				</Route>
				<Route exact path='/to'>
					<To/>
				</Route>
				<Route exact path='/privacy'>
					<Privacy/>
				</Route>
				<Route exact path='/privacy-map'>
					<PrivacyMap/>
				</Route>
				<Route exact path='/chart'>
					<SpreadMap/>
				</Route>
				<Route>
					<Redirect to={"/"} />
				</Route>
			</Switch>
		);
	}
	return (
		<>
			<Alerts />
			<props.router {...(props.routerProps || {})}>
				<Navbar />
				<div id={"main"}>{routes}</div>
				<Footer />
			</props.router>
		</>
	);
});
