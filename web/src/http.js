import store from "./store";

function auth() {
	const t = localStorage.getItem("t");
	if (t) {
		return {Authorization: "Bearer " + t};
	}
}

async function processRes(res, mapAnswer) {
	if (!res.ok) {
		if (res.statusCode === 401) {
			store.reportError("Ваша сессия больше не действительна. Пожалуйста, авторизуйтесь заново.");
		}
		throw res;
	}
	if (res.headers.Authorization) {
		localStorage.setItem("t", res.headers.Authorization);
	}
	return await mapAnswer(res);
}

const mapAnswerDef = (res) => res.json();

export function get(url, mapAnswer = mapAnswerDef) {
	return fetch(url, {
		cache: "no-cache",
		headers: auth(),
		redirect: "error",
	}).then((res) => processRes(res, mapAnswer));
}
export function post(url, body, mapAnswer = mapAnswerDef) {
	return fetch(url, {
		method: "POST",
		cache: "no-cache",
		headers: {
			"Content-Type": "application/json",
			...auth(),
		},
		redirect: "error",
		body: JSON.stringify(body),
	}).then((res) => processRes(res, mapAnswer));
}
