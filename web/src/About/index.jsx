import React from "react";
import {observer} from "mobx-react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default
@observer
class Page extends React.Component {
	render() {
		return (
			<div className={"simple-page"}>
				<p>
					Проект направлен на повышение осознанности людей при подписании различных документов,
					имеющих юридическую значимость и влияющих на приватность. Мы отдаем свои персональные
					данные всем подряд. В каких-то случаях осознанно, но обычно - нет.
				</p>
				<p>
					Мы понимаем, что бумаги надо читать, но обычно у нас нет времени, а повлиять на суть
					соглашения мы не можем. Поэтому подписываем, не глядя. При этом второй экземпляр
					подписанного нам обычно не отдают, поэтому восстановить что и когда мы подписали
					практически не возможно.
				</p>
				<p>
					Дадим людям инструмент, который позволит вычитывать и подсвечивать основные моменты: кому
					передаем, какие данные, на какой срок, рекламу шлют или нет.
				</p>
				<p>
					Также будем запоминать что и кому они отдали, а если захотят отозвать - подготовить
					готовое заявление, которое нужно распечатать и отправить по почте.
				</p>
				<br />
			</div>
		);
	}
}
