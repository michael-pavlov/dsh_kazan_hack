import {action, observable, runInAction} from "mobx";
import {post} from "../http";

class Store {
	@observable.ref
	orgList = [];
	@observable
	hasMore = false;
	@observable
	showSearch = false;
	@observable
	search = '';
	@observable.ref
	order = ['id','desc']

	async fetchOrgs(append) {
		const rows = await post("/api/jurs/ls", {
			search: this.search,
			limit: 21,
			offset: append ? this.orgList.length : 0,
			order: this.order,
		});
		const orgList = rows.map((it,i) => {
			if(i===21){
				return null;
			}
			let stateChanges = [];
			for (let i = 0; i < it.stateChanges.length; ++i) {
				if (it.stateChanges[i]) {
					stateChanges.push({newState: it.stateChanges[i], date: Number(it.stateChangeDates[i])});
				}
			}
			stateChanges.sort((a, b) => (a.date > b.date ? 1 : -1));
			const lastStateChange =
				stateChanges.length > 0 ? stateChanges[stateChanges.length - 1].date : Number(it.added);
			return {
				id: it.id,
				date: Number(it.added),
				jurname: it.jurName,
				state: it.state,
				stateChanges,
				lastStateChange,
				ogrn: it.ogrn,
			};
		});
		runInAction(() => {
			this.hasMore = orgList.length === 21;
			const addOrgs = orgList.filter(it=>!!it)
			if(!append){
				this.orgList = addOrgs;
			}else{
				this.orgList = [...this.orgList, ...addOrgs]
			}
		});
	}

	@action.bound toggleShowSearch(){
		this.showSearch = !this.showSearch
	}

	@action.bound set(mew) {
		for (let p of Object.getOwnPropertyNames(mew)) {
			this[p] = mew[p];
		}
	}

	@action.bound reset() {
		this.orgList = [];
		this.search = '';
		this.limit = 20;
		this.offset = 0;
		this.order = ['id','desc']
	}
}
export default new Store();
