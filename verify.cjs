const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map();
function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',style:{},dataset:{},classList:{toggle(){}},addEventListener(type,fn){this[type]=fn},setAttribute(){},showModal(){},close(){}});return elements.get(key)}
class TestDate extends Date {constructor(...args){super(...(args.length?args:['2026-10-19T10:00:00+02:00']))}static now(){return new Date('2026-10-19T10:00:00+02:00').getTime()}}
const context={console,Intl,Date:TestDate,Number,String,Object,JSON,Array,setInterval(){},setTimeout(){},clearTimeout(){},location:{hash:'#prehled'},localStorage:{getItem(){return null},setItem(k,v){context.saved=JSON.parse(v)}},document:{querySelector:el,querySelectorAll(){return []},addEventListener(){}},addEventListener(){},window:{scrollTo(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
for(const route of ['prehled','zapasy','tipy','zebricek','hraci']){context.location.hash='#'+route;vm.runInContext('render()',context);assert.ok(el('#main').innerHTML.length>200,route)}
context.location.hash='#prehled';vm.runInContext('render(); outcome="1"',context);
el('#home-score').value='3';el('#away-score').value='1';el('#goals').value='under';el('#tip-form').submit({preventDefault(){}});assert.equal(context.saved.lib.home,3);assert.equal(context.saved.lib.outcome,'1');
vm.runInContext('outcome="X"',context);el('#home-score').value='3';el('#away-score').value='1';el('#tip-form').submit({preventDefault(){}});assert.equal(context.saved.lib.outcome,'1');assert.match(el('#toast').textContent,/odpovídat/);
vm.runInContext('matches[0].date="2020-01-01T17:30:00+01:00"; outcome="2"',context);el('#tip-form').submit({preventDefault(){}});assert.equal(context.saved.lib.outcome,'1');assert.match(el('#toast').textContent,/uzavřené/);
console.log('PASS: 5 routes, saving, score consistency, deadline enforcement. Browser visual QA unavailable.');
