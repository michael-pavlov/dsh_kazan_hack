import React, {useEffect} from 'react';
import * as d3 from "d3";
import {withWindow} from "../util";
import SizeProvider from "./SizeProvider";

const DATA = {
	"nodes": [
		{
			"id": "Yandex",
			"group": 1,
			root: 1
		},
		{
			"id": "Ya mail",
			"group": 1,
		},
		{
			"id": "Ya disk",
			"group": 1,
		},
		{
			"id": "Ya telemost",
			"group": 1
		},
		{
			"id": "Ya whatever",
			"group": 1,
		},
		{
			"id": "11",
			"group": 1
		},
		{
			"id": "22",
			"group": 1
		},
		{
			"id": "33",
			"group": 1
		},
		{
			"id": "44",
			"group": 1
		},
		{
			"id": "55",
			"group": 1
		}
	],
	"links": [
		{
			"source": "Yandex",
			"target": "Ya mail",
			"value": 100,
		},
		{
			"source": "Yandex",
			"target": "11",
			"value": 100,
		},
		{
			"source": "Yandex",
			"target": "22",
			"value": 100,
		},
		{
			"source": "Yandex",
			"target": "33",
			"value": 100,
		},
		{
			"source": "33",
			"target": "44",
			"value": 100,
		},
		{
			"source": "33",
			"target": "55",
			"value": 100,
		},
		{
			"source": "Yandex",
			"target": "Ya disk",
			"value": 100
		},
		{
			"source": "Yandex",
			"target": "Ya whatever",
			"value": 100
		},
		{
			"source": "Ya disk",
			"target": "Ya telemost",
			"value": 100
		},
	]
}


function drag(simulation){
	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}
	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}
	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
	return d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
}
function clrNode(it, opacity, lock){
	if(!it.lockClr || lock!=null){
		it.lockClr=lock
		const c = it.ref.children[0]
		c.setAttribute("stroke-opacity",opacity)
		c.setAttribute("fill-opacity",opacity)
	}
}
function clrLink(it, opacity, lock){
	if(!it.lockClr || lock!=null){
		it.lockClr=lock
		for(let c of it.ref.children){
			c.setAttribute("stroke-opacity",opacity)
			c.setAttribute("fill-opacity",opacity)
		}
	}
}
function colorNodeRoutes(nn, i, opacity, lock){
	for(let p of Object.getOwnPropertyNames(nn[i].routes)){
		const root = nn.find(it=> it.id===p)
		clrNode(root, opacity, lock)
		for(let r of nn[i].routes[p]){
			for(let {target, link} of r){
				clrNode(target, opacity, lock)
				clrLink(link, opacity, lock)
			}
		}
	}
}
let clickDecCounter = 2
let queuedRerun = null;
function onNodeClick(nn,i){
	if(clickDecCounter===1){
		queuedRerun = ()=>onNodeClick(nn,i)
		return
	}
	clickDecCounter = queuedRerun ? 1 : 2;
	queuedRerun = null;
	colorNodeRoutes(nn, i, 1, true)
	const wl = e=>{
		if(--clickDecCounter){
			return;
		}
		colorNodeRoutes(nn, i, 0.6, false)
		window.removeEventListener('click', wl)
		if(queuedRerun){
			queuedRerun()
		}
	}
	window.addEventListener('click', wl)
}
const {sqrt, abs} = Math
function repaintLink({index,source:{x:sx,y:sy},target:{x:tx,y:ty}}, _, a){
	const cc = a[index].children
	const l = cc[0]
	l.setAttribute('x1', sx)
	l.setAttribute('y1', sy)
	l.setAttribute('x2', tx)
	l.setAttribute('y2', ty)
}
function chart(id, data, chartH, chartW){
	const ll = data.links.map(d => Object.create(d));
	const nn = data.nodes.map(d => Object.create(d));
	const simulation = d3.forceSimulation(nn)
		.force("link", d3.forceLink(ll).strength(0.1).distance((_,i)=>ll[i].value||60).id(d => d.id))
		.force("center", d3.forceCenter(chartW / 2, chartH / 2))
		.force("charge", d3.forceCollide().strength(1).radius(Math.min(70, sqrt(chartH*chartH+chartW*chartW)/18)));
	const svg = d3.select('#'+id).append("svg")
		.attr("style","transform:scale(1) translate(0,0)")
		.attr("viewBox", [0, 0, chartW, chartH]);
	const link = svg.append("g")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.6)
		.attr("fill-opacity", 0.6)
		.selectAll("line")
		.data(ll)
		.join('g')
		.attr("id",(_,i,a)=>{
			const l = data.links[i];
			l.ref = a[i]
			return 'l'+i
		})
	link.append('line')
		.attr("style", (_,i)=>ll[i].style || 'stroke:rgba(130,130,220)')
		.attr("stroke-width", 1)
	link.append('polygon')
		.attr("style", (_,i)=>ll[i].style || 'stroke:rgba(130,130,220);fill:rgba(130,130,220)')
		.attr("stroke-width", 1)
	const node = svg.append("g")
		.selectAll("rect")
		.data(nn)
		.join("svg")
		.attr("id",(_,i,a)=>{
			const n = data.nodes[i];
			n.ref = a[i]
			return 'n'+i
		})
		.on("click",(_,i)=>onNodeClick(nn,i))
		.on("mouseenter",(_,i)=>{
			colorNodeRoutes(nn, i, 1)
		})
		.on("mouseleave",(_,i)=>{
			colorNodeRoutes(nn, i, 0.6)
		})
		.call(drag(simulation));
	node.append("rect")
		.attr("rx", 5)
		.attr("ry", 5)
		.attr("width", (_,i)=>nn[i].textW+15)
		.attr("fill", (_,i)=>nn[i].fill||'#aaa')
		.attr("fill-opacity", 0.6)
		.attr("height",25)
		.attr("stroke","black")
		.attr("strokeWidth",1)
		.attr("strokeOpacity",0.6)
	node.append("text")
		.attr("fill", '#222')
		.attr("x",7)
		.text((_,i)=> nn[i].text ?? nn[i].id)
		.attr("y",19)
	simulation.on("tick", () => {
		link
			.each(repaintLink)
		node
			.attr("x", (d,i) => {
				return d.x - (nn[i].textW+15)/2;
			})
			.attr("y", d => {
				return d.y - 13;
			});
	});
}

export default React.memo(function({data=DATA, height=450, width=1000, id='chroot'}){
	const context = {
		data,
		height,
		width,
		currentScale: 1,
		pressed: false,
		tx: 0,
		ty: 0,
		ref_: null,
		get ref(){
			return this.ref_ || (this.ref_=document.getElementById(id).firstElementChild)
		}
	}
	useEffect(()=>{
		const ruler = document.getElementById("ruler")
		let text;
		data.nodes.forEach(it=>{
			text = document.createTextNode(it.text ?? it.id)
			ruler.appendChild(text)
			const rect = ruler.getBoundingClientRect()
			it.textW = rect.width
			text && ruler.removeChild(text)
		})
	},[])
	useEffect(()=> {
		chart(id, data, height, width)
	})
	const ref = document.getElementById(id)
	if(ref){
		ref.removeChild(ref.firstChild)
	}
  return (
	<>
		<div  id={id} style={{height, width, cursor: 'pointer', border:data.nodes.length ? '1px solid #C4C4C4' : '1px solid transparent'}}
				  onWheel={onWheel.bind(context)}
				  onMouseMoveCapture={onMouseMove.bind(context)}
				  onMouseDown={onMouseDown.bind(context)}
					onMouseUp={stopPressed.bind(context)}
					onMouseLeave={stopPressed.bind(context)}/>
	</>
  )
})

const SCALE_REGEX = /scale\([^)]*\)/
function onWheel({deltaY}){
	const c = deltaY > 0 ? -0.25 : 0.25
	this.currentScale+=c
	if(this.currentScale < 0.25 || this.currentScale > 4){
		this.currentScale-=c
		return
	}
	const scale = 'scale('+this.currentScale+')'
	this.ref.style.transform = this.ref.style.transform.replace(SCALE_REGEX, scale)
}
const TRANSLATE_REGEX = /translate\([^)]*\)/g
function onMouseMove({movementX, movementY}){
	if(!this.pressed) {
		return
	}
	this.tx = this.tx + movementX/this.currentScale
	this.ty = this.ty + movementY/this.currentScale
	const transform =  'translate('+this.tx+'px,'+this.ty+'px)'
	this.ref.style.transform = this.ref.style.transform.replace(TRANSLATE_REGEX, transform)
}
const NODE_IR_REGEX = /n[0-9]+/
function onMouseDown({target}){
	if(NODE_IR_REGEX.test(target.id) || NODE_IR_REGEX.test(target.parentElement.id)){
		return
	}
	this.pressed = true;
}
function stopPressed(){
	this.pressed = false;
}