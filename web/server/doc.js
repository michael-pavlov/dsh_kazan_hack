const {q2} = require("./db");
const {TEXT_ANALYZE_URL} = require("./" + process.env.NODE_ENV + ".cfg.js");
const {nanoid} = require("nanoid");
const {capitalize, serverError} = require("./util");
const {TYPE_ID, TYPE_TEXT} = require("../src/Check/store");
const got = require("got");

export function init(app) {
	app.use(async (ctx, next) => {
		if (ctx.path === "/api/doc/analyze") {
			await analyzeDoc(ctx);
		} else {
			await next();
		}
	});
}

async function analyzeDoc(ctx) {
	const usr = ctx.state?.user?.u;
	let {data, type} = ctx.request.body;
	//if type is file data is in base64
	let jurs;
	let zone;
	let zoneText;
	let riskDescr;
	let publicId;
	let lines;
	if (type === TYPE_TEXT || type===TYPE_ID) {
		const json ={};
		if(type===TYPE_TEXT){
			json.text = data
		}else if(type===TYPE_ID){
			json.public_id = data
		}
		let body = await got
			.post(TEXT_ANALYZE_URL, {
				json,
			})
			.json();
		if(body.status==='error'){
			throw new Error()
		}
		jurs = body.legal_entities.map(capitalize);
		zone =
			body.risk_zone === "low"
				? 2
				: body.risk_zone === "medium"
				? 3
				: body.risk_zone === "high"
				? 4
				: 1;
		zoneText = body.risk_text;
		riskDescr = body.risk_descr;
		publicId = type===TYPE_ID ? data : body.public_id;
		lines = body.lines;
	}else {
		throw new Error("Only text is supported for now");
	}
	const key = nanoid(30);
	const body = {
		jurs,
		zone,
		zoneText,
		id: null,
		key,
		riskDescr,
		publicId,
		lines,
		text:null
	};
	if(type===TYPE_ID){
		const res = await q2("select content from legal_service_request_history where public_id=?",[publicId])
		const [{content}] = res;
		body.text = content;
	}
	ctx.body = body;
	ctx.status = 200;
}
