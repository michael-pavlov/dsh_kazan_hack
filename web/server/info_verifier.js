const {sendVerification} = require("./email");
const {mkOneTimeCode} = require('./oneTimeCodes')

export const MAIL_VERIFICATION = 1;
export const PHONE_VERIFICATION = 2;

export async function verifyUserData(userId, data, type) {
	let id = await mkOneTimeCode({userId, data, fld:'email'}, 'VERIFY', 1000*60*60*24);
	if(type===MAIL_VERIFICATION){
		await sendVerification(data, id);
	}
}
