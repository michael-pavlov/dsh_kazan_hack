const {q2} = require('./db')
const {nanoid} = require("nanoid");

export async function mkOneTimeCode(data, purpose, validFor){
	let rndId;
	for (;;) {
		rndId = nanoid(40);
		try {
			await q2(
				"insert into legal_web_one_time_codes(code, created, validFor, purpose, data) values(?,?,?,?,?)",
				[rndId, Date.now(), validFor, purpose, JSON.stringify(data)],
			);
		} catch (e) {
			if (e.message.includes('unique')) {	//todo: better way?
				continue;
			} else {
				throw e;
			}
		}
		return rndId;
	}
}

export async function useOneTimeCode(code, purpose){
	const res = await q2("select created, validFor, data from legal_web_one_time_codes " +
			"where code=? and purpose=?",
		[code, purpose]);
	if(res.length<1){
		return false;
	}
	await q2("update legal_web_one_time_codes set used=true where code=? and purpose=?",[code,purpose])
	const {created,validFor,data} = res[0];
	if(validFor && Date.now()>created+validFor){
		return false;
	}
	return JSON.parse(data)
}