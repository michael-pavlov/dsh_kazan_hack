import {action, observable, runInAction} from "mobx";
import {nextId, debouncer} from "./util";
import {post} from "./http";

class Store {
	@observable
	user = readStoredUser();
	@observable.shallow
	alerts = [];
	@observable
	modal = null;
	@observable.shallow
	layout = readLayout();

	after={}

	@action.bound async logIn(identifier, pwd) {
		try {
			const res = await post("/api/public/log-in", {
				identifier,
				password: pwd,
			});
			const {id, roles, login, token} = res;
			runInAction(() => {
				const user = {login, displayName: login, password: roles, id};
				localStorage.setItem("u", JSON.stringify(user));
				localStorage.setItem("t", token);
				this.user = user;
			});
		} catch (e) {
			this.reportError("Не удалось найти пользователя с указанными авторизационными данными.");
		}
	}
	@action.bound logOut() {
		localStorage.removeItem("u");
		localStorage.removeItem("t");
		this.user = null;
	}

	@action.bound addAlert(props, cfg) {
		cfg.id = nextId();
		const onClose = props.onClose;
		props.onClose = (e) => {
			const idx = this.alerts.findIndex((it) => it.cfg.id === cfg.id);
			if (idx < 0) {
				return;
			}
			this.alerts.splice(idx, 1);
			if (onClose) {
				onClose(e);
			}
		};
		props.dismissible = props.dismissible ?? true;
		setTimeout(props.onClose, cfg.timeout);
		this.alerts.push({props, cfg});
	}
	@action.bound reportError(text, header = "Ошибка") {
		this.addAlert({variant: "danger"}, {header, text, timeout: 10000});
	}
	@action.bound reportSuccess(text, header = "Готово") {
		this.addAlert({variant: "success"}, {header, text, timeout: 5000});
	}
	@action.bound reportWarn(text, header = "Предупреждение") {
		this.addAlert({variant: "warning"}, {header, text});
	}
}

function readStoredUser() {
	try {
		let u = localStorage.getItem("u");
		if (u) {
			return JSON.parse(u);
		}
	} catch (e) {}
}

function readLayout() {
	try {
		let w = window,
			d = document,
			documentElement = d.documentElement,
			body = d.getElementsByTagName('body')[0],
			width = w.innerWidth || documentElement?.clientWidth || body?.clientWidth,
			height = w.innerHeight|| documentElement?.clientHeight|| body?.clientHeight;
			return {
				v: width<height
			}
	} catch (e) {
		return {}
	}
}

const store = new Store();

export default store;
