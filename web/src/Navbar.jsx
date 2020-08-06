import React from "react";
import {observer} from "mobx-react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import {NavLink} from "react-router-dom";
import store from "./store";
import checkState from './Check/store'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
const {BLOG_URL} = require("./" + process.env.NODE_ENV + ".cfg");

export default observer(()=>{
	return store.layout.v ? <VNav/> : <HNav/>
})

const VNav = observer(()=>{
	return (
		<>
			<Navbar>
				<Brand/>
			</Navbar>
		</>
	);
})

const HNav = observer(()=>{
	return (
		<>
			<Navbar expand={"lg"} sticky="top" style={{paddingLeft:'var(--mn-side)'}}>
				<Brand/>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="mr-auto">
						<Nav.Link
							to="/check"
							exact
							as={NavLink}
							style={{
								backgroundColor: "var(--primary)",
								padding: '0.5em 1em',
								margin: '0 1em'
							}}
							onClick={mbResetCheck}
						>
							Проверить документ
						</Nav.Link>
						<Nav.Link href={BLOG_URL}>Блог</Nav.Link>
						<Nav.Link to="/about" as={NavLink}>
							О проекте
						</Nav.Link>
						<Nav.Link to="/for-business" as={NavLink}>
							Для бизнеса
						</Nav.Link>
					</Nav>
					<Nav style={{width:"30vw", paddingLeft:'0.3em'}}>
						<HUser/>
					</Nav>
				</Navbar.Collapse>
			</Navbar>
		</>
	);
})

const Brand = React.memo(()=><Navbar.Brand href="/">
	<div className={"flex-row"}>
		<div className={"flex-col"} style={{flexGrow:0}}>
							<span style={{fontSize: "1.5rem",fontFamily: 'FuturaDemi', color: '#242C30', fontWeight:'bold'}}>
								МЕЛКИМ <span style={{color: "#FEA12E"}}>ШРИФТОМ</span>*
							</span>
			<span style={{fontSize: "3px", fontWeight: 300, width:'16rem',whiteSpace:'normal',lineHeight:'3px'}}>Также, настоящим, Я, действуя своей волей и в своем интересе, путем осуществленного непосредственно мной ввода данных на Сайте о номере телефона, владельцем (абонентом) которого я являюсь и (или) адреса электронной почты (e-mail), зарегистрированного на мое имя, (либо путем предоставления мной данной информации Оператору иным каким-либо способом, позволяющим при необходимости документально подтвердить предоставление мной Оператору такой информации) заявляю в соответствии с положениями Федерального закона от 13.03.2006 № 38-ФЗ «О рекламе» и положениями Федерального закона от 07.07.2003 № 126-ФЗ «О связи» о своем согласии на получение от ООО «Какая-то Компания» по сетям электросвязи, в том числе посредством использования телефонной, факсимильной, подвижной радиотелефонной связи, а также посредством использования информационно-телекоммуникационной сети «Интернет», в том числе путем направления по электронной почте, каких-либо рассылок (включая, смс-уведомления), имеющих в том числе рекламный характер, в содержании которых будет говориться, в частности, о предложении оказания или об оказании мне со стороны ООО «Какая-то Компания» услуг по проведению семинаров (курсов, лекций, обучения) и (или) о предложении оказания или об оказании мне со стороны ООО «Какая-то Компания»</span>
		</div>
		<div style={{flexGrow: 1}} />
	</div>
</Navbar.Brand>)

const HUser = observer(()=>{
	if (store.user) {
		return (
			<Nav.Link to={"personal"} as={NavLink}>
				<FontAwesomeIcon icon='user'/> Личный кабинет
			</Nav.Link>
		);
	} else {
		return (
			<Nav.Link to={"logIn"} as={NavLink}>
				<FontAwesomeIcon icon='user'/> Войти
			</Nav.Link>
		);
	}
})

function mbResetCheck(){
	if(window.location.pathname==='/check'){
		checkState.reset();
	}
}