const {DB2, DO_INIT_DB} = require("./" + process.env.NODE_ENV + ".cfg.js");
const mysql = require('mysql');

export const db2 = mysql.createPool({
	host: DB2.host,
	user: DB2.user,
	password: DB2.password,
	database: DB2.database,
	port: DB2.port
});

export function q2(sql, values, conn){
	return new Promise(async (resolve, reject)=>{
		if(!conn){
			conn = await new Promise((resolve2, reject2)=>
				db2.getConnection((err,newConn)=>{
					if(!newConn){
						reject(err);
						reject2(err);
					}else{
						resolve2(newConn)
					}
				}))
		}
		conn.query({sql, values}, (qerr,qres)=>{
			if(qerr){
				reject(qerr)
			}
			resolve(qres)
		})
	})
}

export function t2(cb){
	return new Promise((resolve, reject)=>{
		db2.getConnection(async (err,conn)=>{
			if(!conn){
				reject(err)
			}
			let res = cb(conn)
			try{
				res = await res
			}catch(e){}//#todo: better check if it is async
			resolve(res)
		})
	})
}

export async function fetchUser(webId){
	const rows = await q2(
		"select * from legal_bot_users where (web_id=?) and not blocked limit 1",
		[webId],
	);
	return rows[0];
}