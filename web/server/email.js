const nodemailer = require("nodemailer");
const {MAIL_AUTH, SERVER_URL} = require("./" + process.env.NODE_ENV + ".cfg.js");

const transport = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	auth: MAIL_AUTH,
});

export async function sendVerification(to, key){
	await transport.sendMail({
		from: '"Мелким Шрифтом" info@personalka.org',
		to,
		subject: "Подтверждение почты",
		text: "Для подтверждения почты, пожалуйста, перейдите по ссылке "+SERVER_URL+'/verify?id='+key,
	})
}

export async function sendReset(to, key){
	await transport.sendMail({
		from: '"Мелким Шрифтом" info@personalka.org',
		to,
		subject: "Восстановления пароля",
		text: "Перейдите по ссылке и введите новый пароль "+SERVER_URL+'/reset?id='+key+
		'\nСсылка действительна 1 час.',
	})
}