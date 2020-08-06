import {verifyToken} from "./util";

const {q2, fetchUser} = require("./db");
const {JUR_DETAILS_URL,GEN_RECALL_URL} = require("./" + process.env.NODE_ENV + ".cfg.js");
const {capitalize, parallel} = require("./util");
const stream = require('stream');
const got = require("got");

export function init(app) {
	app.use(async (ctx, next) => {
		if (ctx.path === "/api/jurs/ls") {
			await lsJurs(ctx);
		} else if (ctx.path === "/api/jurs/save") {
			await saveJurs(ctx);
		} else if (ctx.path === "/api/jurs/details") {
			await jurDetails(ctx);
		} else if (ctx.path === "/api/jurs/recall") {
			await genRecall(ctx);
		} else if (ctx.path === "/api/jurs/links") {
			await jurLinks(ctx);
		} else if (ctx.path === "/api/jurs/own-links") {
			await ownLinks(ctx);
		} else if (ctx.path === "/api/jurs/pop-jurs") {
			await popJurs(ctx);
		} else {
			await next();
		}
	});
}

async function lsJurs(ctx) {
	const usr = ctx.state.user.u;
	let {limit, offset, search, order} = ctx.request.body;
	limit = limit || 20;
	offset = offset || 0;
	let query = "select * from legal_web_jur_ls where usr=? <s> order by <o> limit ? offset ?";
	let params = [usr, null, limit, offset,]
	if(search && search!==''){
		params[1]='%'+search+'%';
		query=query.replace('<s>',"and (text like lower(?))")
	}else{
		query=query.replace('<s>',"")
	}
	order = order || ['id','desc']
	if(!['id','state','jurName'].includes(order[0]) || !['desc','asc'].includes(order[1])){
		throw new Error('Tried to sort jur_ls by '+order[0])
	}
	query=query.replace('<o>',order.join(' '))
	ctx.body = (await q2(query, params.filter(it=>it!=null)))
		.map(it=>({
			...it,
			stateChanges: it.stateChanges?.split(',') || [],
			stateChangeDates: it.stateChangeDates?.split(',') || [],
			text: undefined
		}));
	ctx.status = 200;
}

async function saveJurs(ctx) {
	const usr = ctx.state.user.u;
	const {jurs} = ctx.request.body;
	const now = Date.now();
	await q2("insert ignore into legal_web_saved_jurs(ogrn,usr,added,state)values"+
		jurs.map(()=>"(?,?,"+now+",1)").join(","),
		jurs.flatMap(({ogrn})=>[ogrn,usr]));
	ctx.status = 200;
}

async function jurDetails(ctx) {
	const {ogrn} = ctx.request.body;
	const params = [null,ogrn]
	const u = ctx.state.user?.u;
	let existsSelectPart = "'0'";
	if(u){
		existsSelectPart = 'count(usr=? or null)'
		params[0] = u
	}
	const [body, [{recalled, succeeded, present}]] = await parallel(
		got
			.get(JUR_DETAILS_URL+ogrn, {})
			.json(),
		q2(`select
						count(state=3 or null) as recalled,
						count(state=4 or null) as succeeded,
						`+existsSelectPart+` as present
						from legal_web_saved_jurs where ogrn=?`,params.filter(it=>it!=null))
	)
	body.recalled = recalled;
	body.succeeded = succeeded;
	body.exists = present;
	ctx.status = 200;
	ctx.body = capitalize(body);
}

async function genRecall(ctx){
	const {ogrn,t} = ctx.request.query;
	let url = GEN_RECALL_URL+ogrn;
	const u = (await verifyToken(t))?.u;
	if(u){
		const user = await fetchUser(u)
		url+='&fioshort='+encodeURIComponent(user.fio_short)
		url+='&fiofull='+encodeURIComponent(user.fio_full)
		url+='&address='+encodeURIComponent(user.address)
		url+='&passport='+encodeURIComponent(user.passport)
		url+='&issued='+encodeURIComponent(user.passport_issued)
	}
	ctx.status = 200;
	ctx.body = got.stream(url).pipe(stream.PassThrough());
}

async function ownLinks(ctx){
	const u = ctx.state.user.u;
	const jurs = await q2("select ogrn from legal_web_saved_jurs where usr=?",[u])
	ctx.body = await infoFlow(jurs, true);
	ctx.status = 200
}

async function jurLinks(ctx){
	const {jurs} = ctx.request.body;
	ctx.body = await infoFlow(jurs);
	ctx.status = 200
}

async function infoFlow(ogrns, setRoots){
	const checked = new Set();
	const links = [];
	let nodes=[];
	await t2(async conn=>{
		let jurs = ogrns;
		for(;jurs.length;){
			const res = await q2("select source, target from legal_company_links where source in ("
				+jurs.map(()=>'?').join(',')+")",
				jurs, conn)
			jurs.forEach(checked.add)
			links.push(...res)
			jurs = res.map(it=>it.target).filter(it=> it!=null).filter(it=> !checked.has(it))
		}
		const checkedArray = [...checked]
		nodes = await q2("select ogrn as id, name from legal_bot_companies where ogrn in ("
			+checkedArray.map(()=>'?').join('?')+")",
			checkedArray)
	})
	if(setRoots){
		nodes = nodes.map((it,i)=> ogrns.includes(it.id) ? {...it, root: i} : it)
	}
	return {links, nodes};
}

async function popJurs(ctx){
	ctx.body = (await q2("select legal_web_pop_jurs.ogrn,name,public_id from legal_web_pop_jurs left join legal_bot_companies on" +
			"(legal_web_pop_jurs.ogrn=legal_bot_companies.ogrn)"))
		.map(({name, ogrn, public_id})=> ogrn==='us' ? {name:'Наше соглашение', public_id} : {name,public_id})
	ctx.status = 200
}