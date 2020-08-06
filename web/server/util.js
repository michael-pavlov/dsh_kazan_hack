const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("./" + process.env.NODE_ENV + ".cfg.js");

export function prepStringField(it) {
	return it && it !== "" ? String(it) : null;
}

export function badRq(ctx, msg) {
	ctx.status = 400;
	ctx.body = {error: msg || 400};
	throw new Error(msg || "400");
}
export function serverError(ctx) {
	ctx.status = 500;
	ctx.body = {error: "Something went wrong on our end"};
	throw new Error("500");
}
export function notFound(ctx) {
	ctx.status = 404;
	ctx.body = {error: "Not found"};
	throw new Error("404");
}

export function capitalize(o){
	const res = {};
	for(let p of Object.getOwnPropertyNames(o)){
		res[p.replace(/_([^_])/g, (_,it)=>it.toUpperCase())] = o[p];
	}
	return res;
}

export async function parallel(...p){
	const r =[];
	for(let i=0; i<p.length; ++i){
		r.push(await p[i]);
	}
	return r;
}

export async function verifyToken(token){
	return new Promise((res,rej)=>{
		jwt.verify(token,JWT_SECRET,(err,dec)=>{
			if(err){
				rej(err)
			}
			res(dec);
		})
	})
}