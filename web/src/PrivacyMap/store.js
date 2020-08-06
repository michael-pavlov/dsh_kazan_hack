import {action, observable, runInAction} from "mobx";

class Store {
	@observable.ref
	data

	@action.bound set(mew) {
		for (let p of Object.getOwnPropertyNames(mew)) {
			this[p] = mew[p];
		}
	}
}
export default new Store();
