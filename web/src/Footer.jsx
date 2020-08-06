import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Link} from "react-router-dom";
import {NavLink} from "react-router-dom";
import {observer} from "mobx-react";
import store from './store'
import Nav from "react-bootstrap/Nav";
const {BLOG_URL} = require("./" + process.env.NODE_ENV + ".cfg");

export default observer(()=>{
	const {v} = store.layout;
	if(!v){
		return <div className={"footer-root footer-root-max"}>
			<Foot/>
		</div>
	}else{
		return <>
			<FootNav fixed/>
			<FootNav/>
		</>
	}
})

const Foot = React.memo(function ({full}) {
	return (
		<div className={"footer " + (full ? "footer-max" : "footer-min")}>
			<div style={{marginRight:'10px'}}>
				<FontAwesomeIcon icon={"copyright"} /> 2020, Мелким шрифтом
			</div>
			<div className='flex-col'>
				<div style={{flexGrow:1}}/>
				<div style={{flexGrow:0}}>
					<a className={"link-text"} style={{marginRight:'10px', fontSize:'0.9em', textDecoration:'none'}}>
						Политика конфиденциальности
					</a>
					<span className={"text-sm"}>info@personalka.org</span>
				</div>
				<div style={{flexGrow:1}}/>
			</div>
		</div>
	);
});

const FootNav = observer(({fixed})=>{
	return (
		<nav className='navbar navbar-light'
				 style={{position:fixed ? 'fixed' : undefined,
					 zIndex:fixed ? 9999 : 0,
					 marginTop:fixed ? 0 : '10px',
					 bottom:'0',left:'0',width:'100vw',padding:0,}}>
			<div className={'nav-v-block'}>
				<Nav.Link to="/check" as={NavLink} style={{backgroundColor:"var(--primary)"}}>
					<div style={{fontSize:'1.2rem'}}><FontAwesomeIcon icon={'search'}/></div>
					<div>Проверить</div>
					<div>документ</div>
				</Nav.Link>
			</div>
			<div style={{flexBasis:'0.5%'}}/>
			<div className={'nav-v-block'}>
				<Nav.Link href={BLOG_URL}>
					<div style={{fontSize:'1.2rem'}}><FontAwesomeIcon icon={'blog'}/></div>
					<div>Блог</div>
					<div style={{color:'rgba(0,0,0,0)'}}>Блог</div>
				</Nav.Link>
			</div>
			<div style={{flexBasis:'0.5%'}}/>
			<div className={'nav-v-block'}>
				<VUser/>
			</div>
		</nav>
	)
})

const VUser = observer(()=>{
	if (store.user) {
		return (
			<Nav.Link to={"personal"} as={NavLink}>
				<div style={{fontSize:'1.2rem'}}><FontAwesomeIcon icon={'user-alt'}/></div>
				<div>Личный</div>
				<div>кабинет</div>
			</Nav.Link>
		);
	} else {
		return (
			<Nav.Link to={"logIn"} as={NavLink}>
				<div style={{fontSize:'1.2rem'}}><FontAwesomeIcon icon={'sign-in-alt'}/></div>
				<div>Войти</div>
				<div style={{color:'rgba(0,0,0,0)'}}>Войти</div>
			</Nav.Link>
		);
	}
})
