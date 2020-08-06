import {verifyToken} from "./util";

const {q2,t2} = require("./db");
const {badRq, serverError, notFound, prepStringField} = require("./util");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("./" + process.env.NODE_ENV + ".cfg.js");
const {verifyUserData, MAIL_VERIFICATION, PHONE_VERIFICATION} = require("./info_verifier");
const {sendReset} = require("./email");
const {mkOneTimeCode, useOneTimeCode} = require("./oneTimeCodes");

export function init(app) {
	app.use(async (ctx, next) => {
		const now = Date.now();
		const u = ctx.state.user;
		if (u && now - u.iat > u.exp - now) {
			//reissue token if it has existed for more than half of it's life
			ctx.set(
				"Authorization",
				await new Promise((resolve, reject) => {
					jwt.sign({u: u.u, r: u.r}, JWT_SECRET, {expiresIn: "30d"}, (err, token) => {
						if (!err) {
							resolve(token);
						} else {
							reject(err);
						}
					});
				}),
			);
		}
		if (ctx.path === "/api/public/register" && ctx.method === "POST") {
			await register(ctx);
		} else if (ctx.path === "/api/public/log-in" && ctx.method === "POST") {
			await logIn(ctx);
		} else if (ctx.path === "/api/public/reset-init" && ctx.method === "POST") {
			await resetInit(ctx);
		} else if (ctx.path === "/api/public/reset-end") {
			await resetEnd(ctx);
		} else if (ctx.path === "/verify") {
			await verify(ctx);
		} else if (ctx.path === "/api/user/test") {
			await testAuthorized(ctx);
		} else {
			await next();
		}
	});
}

function testAuthorized(ctx) {
	ctx.status = 200;
}

async function logIn(ctx) {
	let {identifier, password} = ctx.request.body;
	identifier = prepStringField(identifier);
	password = prepStringField(password);
	if (!identifier || identifier.length > 1024) {
		badRq(ctx);
	}
	if (!password || password.length > 1024) {
		badRq(ctx);
	}
	const user = await findUserByIdentifier(identifier);
	if (!user) {
		notFound(ctx);
	}
	const res = await new Promise((res, rej) => {
		bcrypt.compare(password, user.pwd, (err, succ) => {
			if(err){
				console.log(err)
				rej(err)
			}
			res(succ);
		})
	});
	if (!res) {
		notFound(ctx);
	}
	const ret = {
		roles: null,
		token: null,
	};
	ret.roles = [];
	ret.token = await new Promise((resolve, reject) => {
		jwt.sign({u: user.web_id, r: ret.roles}, JWT_SECRET, {expiresIn: "30d"}, (err, token) => {
			if (!err) {
				resolve(token);
			} else {
				reject(err);
			}
		});
	});
	ctx.body = ret;
	ctx.set("Authorization", ret.token);
	ctx.status = 200;
}

async function register(ctx) {
	let {phone, email, password} = ctx.request.body;
	phone = prepStringField(phone);
	email = prepStringField(email);
	password = prepStringField(password);
	if (!password || password.length > 1024) {
		badRq(ctx);
	}
	if (phone) {
		if (phone.length > 15 || !/\+7\d{10}/.test(phone)) {
			badRq(ctx);
		}
	}
	if (!email || email.length > 1024 || !/.*@.*/.test(email)) {
		badRq(ctx);
	}
	password = await new Promise((res, rej) => {
		bcrypt.hash(password, 10, function (err, hash) {
			if (err) {
				rej(err);
			}
			res(hash);
		});
	});
	const id = await t2(async c=>{
		const [[{i:id}]] = await q2('call legal_bot_users_web_id_gen()',c)
		await q2("insert into legal_bot_users(pwd,web_id) values(?,?)", [
			password,
			id
		], c);
		return id;
	})
	if (email) {
		await verifyUserData(id, email, MAIL_VERIFICATION);
	}
	if (phone) {
		await verifyUserData(id, phone, PHONE_VERIFICATION);
	}
	ctx.status = 200;
}

async function verify(ctx) {
	const {id} = ctx.query;
	const {userId, data, fld} = await useOneTimeCode(id, 'VERIFY')
	if(!userId){
		throw new Error("Verification not found");
	}
	if (fld!=='email') {
		throw new Error("Unknown verification type: " + type);
	}
	await q2("update legal_bot_users set " + fld + "=? where web_id=?", [data, userId]);
	ctx.status = 303;
	ctx.body = "Подтверждение успешно.";
	ctx.set("Location", "/to?verified="+encodeURIComponent(data));
}

async function resetInit(ctx) {
	const {identifier} = ctx.request.body;
	const user = await findUserByIdentifier(identifier);
	if (!user) {
		notFound(ctx);
	}
	if(user.email===identifier){
		let key = await mkOneTimeCode({id:user.web_id}, 'RESET', 1000*60*60);
		await sendReset(user.email, key)
	}
	ctx.status = 200;
	ctx.body = "{}";
}
async function resetEnd(ctx) {
	const {pwd} = ctx.request.body;
	const {id} = await useOneTimeCode(id, 'RESET')
	if(id == null){
		notFound(ctx)
	}
	const password = await new Promise((res, rej) => {
		bcrypt.hash(pwd, 10, function (err, hash) {
			if (err) {
				rej(err);
			}
			res(hash);
		});
	});
	await q2("update legal_bot_users set pwd=? where web_id=?", [password, id]);
	ctx.status = 200;
	ctx.body = "{}";
}


async function findUserByIdentifier(identifier){
	const rows = await q2(
		"select web_id,email,pwd from legal_bot_users where (email=?) and not blocked",
		[identifier],
	);
	return rows.find((it) => it.email === identifier);
}