const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const Competition=require('./dist/competition.js');
const tip=(name,home,away,goals='')=>({name,home,away,goals,outcome:Competition.resultOf(home,away)});
assert.equal(Competition.validate(tip('Petr Novák',2,1)),'');
assert.equal(Competition.validate(tip('Eva Nová',1,1)),'');
assert.ok(Competition.validate({...tip('Eva Nová',1,1),outcome:'1'}));
assert.ok(Competition.validate(tip('A',2,1)));
assert.ok(Competition.validate(tip('Jan Novák',2.5,1)));
assert.ok(Competition.validate(tip('Jan Novák',2,1,'over')));
assert.deepEqual(Competition.evaluate([tip('Petr Novák',2,1),tip('Eva Nová',3,1)],{home:2,away:1}).map(e=>e.name),['Petr Novák']);
assert.deepEqual(Competition.evaluate([tip('Petr Novák',3,1),tip('Eva Nová',2,2)],{home:2,away:1}).map(e=>e.name),['Petr Novák','Eva Nová']);
assert.deepEqual(Competition.evaluate([tip('Petr Novák',3,1),tip('Eva Nová',2,2,'under')],{home:2,away:1}).map(e=>e.name),['Eva Nová']);
assert.equal(Competition.evaluate([],{home:2,away:1}).length,0);
assert.equal(Competition.evaluate([tip('Eva Nová',2,1)],null).length,0);
assert.equal(Competition.evaluate([tip('Eva Nová',2,1)],{home:-1,away:1}).length,0);
const elements=new Map();
const el=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',checked:false,style:{},classList:{toggle(){}},addEventListener(type,fn){this[type]=fn},showModal(){this.open=true},close(){this.open=false}});return elements.get(key)};
let now='2026-10-19T10:00:00+02:00';class TestDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return new Date(now).getTime()}}
const storage=new Map();let failStorage=false;
const context={console,Competition,Date:TestDate,Intl,crypto:{randomUUID:()=>String(Math.random())},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('full');storage.set(k,v)}},document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){}},location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},setTimeout(){},setInterval(fn){context.tick=fn},clearTimeout(){},addEventListener(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/data.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
assert.match(el('#main').innerHTML,/Dotkni se obrazovky/);
assert.match(el('#main').innerHTML,/countdown/);
assert.doesNotMatch(el('#main').innerHTML,/id="match"/);
assert.equal(JSON.parse(storage.values().next().value).activeMatchId,'lib');
vm.runInContext('form(); outcome="1"',context);
assert.doesNotMatch(el('#main').innerHTML,/id="match"/);
assert.doesNotMatch(el('#main').innerHTML,/id="entry-form"/);
vm.runInContext('submitEntry()',context);
assert.equal(JSON.parse(storage.values().next().value).entries.length,0);
assert.match(el('#toast').textContent,/otevře/);
// Countdown at the last second, then automatic opening without reloading.
now='2026-10-20T17:29:59+02:00';vm.runInContext('form(); lastActivity=Date.now()',context);context.tick();
assert.match(el('#countdown').textContent,/01 s$/);
now='2026-10-20T17:30:00+02:00';context.tick();
assert.match(el('#main').innerHTML,/id="entry-form"/);
assert.match(el('#main').innerHTML,/TIPOVÁNÍ OTEVŘENO/);
vm.runInContext('outcome="1"',context);
el('#guest-name').value='<b>Eva</b>';el('#home-score').value='2';el('#away-score').value='1';el('#goals').value='under';
vm.runInContext('submitEntry()',context);assert.match(el('#main').innerHTML,/&lt;b&gt;Eva&lt;\/b&gt;/);assert.equal(JSON.parse(storage.values().next().value).entries.length,1);
vm.runInContext('form(); outcome="1"',context);vm.runInContext('submitEntry()',context);assert.match(el('#toast').textContent,/už je/);
// A different visitor can submit during the game; a score cannot be confirmed yet.
now='2026-10-20T19:30:00+02:00';el('#guest-name').value='Jiný člověk';vm.runInContext('submitEntry()',context);assert.equal(JSON.parse(storage.values().next().value).entries.length,2);
el('#result-home').value='2';el('#result-away').value='1';el('#result-confirm').checked=true;vm.runInContext('submitResult()',context);assert.equal(JSON.parse(storage.values().next().value).results.lib,undefined);
const clickAction=action=>el('#main').click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action}}:null}});
vm.runInContext('staff()',context);assert.match(el('#main').innerHTML,/id="match"/);clickAction('close-tipping');
assert.ok(JSON.parse(storage.values().next().value).closedMatches.lib);
vm.runInContext('form();outcome="1"',context);el('#guest-name').value='Pozdní návštěvník';vm.runInContext('submitEntry()',context);assert.equal(JSON.parse(storage.values().next().value).entries.length,2);
vm.runInContext('submitResult()',context);assert.match(el('#main').innerHTML,/Gratulujeme vítězům/);assert.match(el('#main').innerHTML,/Cenu si vyzvedněte ve VIP zóně/);
assert.doesNotMatch(el('#main').innerHTML,/id="match"/);
// Active game remains pinned when loading later; it never jumps to the next fixture.
const reloaded={...context,document:{...context.document,querySelector:()=>({innerHTML:'',addEventListener(){}})}};vm.createContext(reloaded);vm.runInContext(fs.readFileSync('dist/data.js','utf8'),reloaded);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),reloaded);assert.equal(vm.runInContext('currentId',reloaded),'lib');assert.equal(vm.runInContext('open(current())',reloaded),false);
// Only staff can select and persist another game.
vm.runInContext('staff()',context);el('#main').change({target:{id:'match',value:'kom'}});assert.equal(JSON.parse(storage.values().next().value).activeMatchId,'kom');
now='2026-10-23T17:30:00+02:00';vm.runInContext('form(); outcome="X"',context);el('#guest-name').value='Jan Novák';el('#home-score').value='1';el('#away-score').value='1';el('#goals').value='';failStorage=true;vm.runInContext('submitEntry()',context);assert.match(el('#toast').textContent,/Uložení se nezdařilo/);assert.equal(JSON.parse(storage.values().next().value).entries.length,2);
for(const fn of ['welcome','form','resultScreen','staff','rules'])vm.runInContext(fn+'()',context);
console.log('PASS: exact/nearest winners, ties, validation, single-match visitor screens, countdown, automatic opening, in-game submissions, staff closure, late-tip rejection, result gating, pinned match on reload, persistence failure. Visual browser QA not performed.');
