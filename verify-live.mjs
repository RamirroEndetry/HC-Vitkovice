import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from './worker.mjs';
import Competition from './dist/competition.js';
import LiveMatch from './dist/live.js';
import HockeyTeams from './dist/teams.js';
import ClubContent from './dist/club-content.js';

// Real hokej.cz scoreboard record of VIT–LIB on 20 Oct 2026 (3:2 after shootout, 2:2 after 60 minutes).
const game=(over={})=>({hokejcz_id:2928354,onlajny_id:533013,date:'2026-10-20',time:'17:30',home:{shortcut:'VIT',name:'HC Vítkovice Ridera'},visitor:{shortcut:'LIB',name:'Bílí Tygři Liberec'},score_home:'3',score_visitor:'2',score_period:['0:0','1:1','1:1'],match_last_time:"66'",match_actual_time_alias:'KN',match_actual_time_name:'po s.n. (3:2)',match_status:'po zápase',...over});
const scoreboard=g=>({ELH:{league_name:'ELH',matches:[{home:{shortcut:'KVA'},visitor:{shortcut:'KOM'},score_period:['1:0','0:1','0:0'],match_status:'po zápase',match_actual_time_alias:'KP'},g]}});
const at=Date.parse('2026-10-20T20:00:00+02:00'),snap=(g,o={})=>LiveMatch.fromScoreboard(scoreboard(g),{matchId:'lib',date:'2026-10-20',opponent:'LIB',...o},at);
assert.deepEqual({...snap(game()),updatedAt:0},{matchId:'lib',home:2,away:2,phase:'regulation_end',clock:'',updatedAt:0,final:true,decision:'shootout',total:{home:3,away:2}});
assert.equal(snap(game({match_actual_time_alias:'KP',match_actual_time_name:'po prodl.',score_home:'3'})).decision,'overtime');
assert.equal(snap(game({match_actual_time_alias:'K',match_actual_time_name:'konec',score_period:['1:0','1:1','1:1']})).decision,'regulation');
assert.equal(LiveMatch.feedUrl('2026-10-20'),'https://json.esports.cz/hokejcz/scoreboard/onlajny/2026-10-20.json');
const live=over=>snap(game({match_status:'live',score_home:'1',score_visitor:'1',score_period:['0:0','1:1','0:0'],match_last_time:"35'",match_actual_time_alias:'2',match_actual_time_name:'2. třetina',...over}));
assert.deepEqual([live().phase,live().home,live().away,live().clock,live().final],['period2',1,1,"35'",false]);
assert.equal(live({match_actual_time_alias:'',match_actual_time_name:'',match_last_time:"47'"}).phase,'period3');
assert.equal(live({match_actual_time_name:'přestávka po 1. třetině',match_actual_time_alias:'P1',match_last_time:"20'"}).phase,'break1');
assert.equal(live({match_actual_time_name:'přestávka',match_actual_time_alias:'P',match_last_time:"40'"}).phase,'break2');
assert.equal(live({match_actual_time_name:'konec 3. třetiny',match_last_time:"60'"}).phase,'regulation_end');
assert.equal(live({match_actual_time_name:'konec 3. třetiny',match_last_time:"60'"}).final,false);
const ot=live({match_actual_time_name:'prodloužení',match_actual_time_alias:'4',match_last_time:"62'",score_home:'2',score_visitor:'1'});
assert.deepEqual([ot.phase,ot.home,ot.away,ot.final,ot.decision],['regulation_end',1,1,false,'overtime'],'overtime goal must not count');
assert.equal(live({match_actual_time_name:'konec 3. třetiny',match_last_time:"60'"}).decision,null,'a draw at 60:00 is not decided yet');

// Optional overtime/shootout tip: a final score one goal apart (3:2 after the shootout = 2:2 after 60 minutes).
const t=(name,home,away,decision='',goals='',savedAt='2026-10-20T15:00:00Z')=>({name,home,away,decision,goals,savedAt,outcome:Competition.resultOf(home,away)});
assert.equal(Competition.validate(t('Petr Novák',3,2,'extra')),'');assert.equal(Competition.validate(t('Petr Novák',2,3,'shootout')),'','tips saved before the merge stay valid');
assert.match(Competition.validate(t('Petr Novák',2,2,'extra')),/o jeden gól/);assert.match(Competition.validate(t('Petr Novák',4,2,'extra')),/o jeden gól/);
assert.match(Competition.validate(t('Petr Novák',3,2,'penalty')),/platnou/);
assert.deepEqual(Competition.regulationOf(t('x',3,2,'extra')),{home:2,away:2});assert.deepEqual(Competition.regulationOf(t('x',3,2)),{home:3,away:2});
const so={home:2,away:2,decision:'shootout',total:{home:3,away:2}},tipAt=m=>`2026-10-20T15:${String(m).padStart(2,'0')}:00Z`;
const tips=[t('3:2 po 60',3,2,'','',tipAt(0)),t('2:2',2,2,'','',tipAt(1)),t('2:3 prodl./náj.',2,3,'extra','',tipAt(2)),t('4:3 prodl./náj.',4,3,'extra','',tipAt(4)),t('3:2 prodl./náj.',3,2,'extra','',tipAt(9))];
assert.deepEqual(Competition.rank(tips,so).map(e=>e.name),['3:2 prodl./náj.','2:2','2:3 prodl./náj.','3:2 po 60','4:3 prodl./náj.'],'60-minute score first, then the final score (the right winner), even against an earlier tip');
assert.deepEqual(Competition.rank([t('3:2 prodloužení (starý)',3,2,'overtime','',tipAt(1)),t('3:2 prodl./náj.',3,2,'extra','',tipAt(2))],so).map(e=>e.position),[1,2],'overtime vs shootout no longer matters, the earlier tip wins');
assert.deepEqual(Competition.evaluate([t('3:2 po 60',3,2,'','',tipAt(9)),t('3:2 prodl./náj.',3,2,'extra','',tipAt(0))],{home:3,away:2,decision:'regulation'}).map(e=>e.name),['3:2 po 60'],'an extra-time tip loses when the match ends in regulation');
assert.deepEqual(Competition.evaluate([t('Góly',2,2,'','under',tipAt(0)),t('3:2 prodl./náj.',3,2,'extra','',tipAt(5))],so).map(e=>e.name),['3:2 prodl./náj.'],'the extra-time tip outranks the old goals tip');
assert.equal(Competition.validDecision({home:2,away:2,decision:'extra'}),true);
assert.equal(Competition.validDecision({home:2,away:2,decision:'regulation'}),false);assert.equal(Competition.validDecision({home:3,away:2,decision:'regulation'}),true);
assert.equal(snap(game({match_status:'před zápasem',match_actual_time_alias:'0',score_home:'0',score_visitor:'0',score_period:['0:0','0:0','0:0'],match_last_time:''})).phase,'scheduled');
// Vítkovice away: the score is turned so that the kiosk always shows Vítkovice first.
const away=snap(game({home:{shortcut:'LIB'},visitor:{shortcut:'VIT'},score_period:['1:0','2:0','0:1']}));assert.deepEqual([away.home,away.away],[1,3]);
assert.throws(()=>snap(game(),{opponent:'TRI'}),/nenajdeme/);
assert.throws(()=>snap(game({match_status:'zrušeno',match_actual_time_alias:'XZ'})),/zrušen/);

const request=q=>new Request(`https://kiosk.example/api/live?${q}`);
assert.equal((await worker.fetch(request('matchId=lib'),{})).status,400);
assert.equal((await worker.fetch(new Request('https://kiosk.example/api/live?matchId=lib',{method:'POST'}),{})).status,405);
const originalFetch=globalThis.fetch;
try{
  let requested;
  globalThis.fetch=async url=>{requested=String(url);return Response.json(scoreboard(game()))};
  const response=await worker.fetch(request('matchId=lib&date=2026-10-20&opponent=LIB'),{});
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const json=await response.json();assert.deepEqual([json.home,json.away,json.final],[2,2,true]);assert.equal(requested,LiveMatch.feedUrl('2026-10-20'));
  globalThis.fetch=async()=>new Response('down',{status:500});assert.equal((await worker.fetch(request('matchId=lib&date=2026-10-20&opponent=LIB'),{})).status,502);
  let assetRequest;await worker.fetch(new Request('https://kiosk.example/'),{ASSETS:{fetch:r=>{assetRequest=r;return new Response('app')}}});assert.equal(assetRequest.url,'https://kiosk.example/');
}finally{globalThis.fetch=originalFetch}

let now=Date.parse('2026-10-20T18:00:00+02:00');
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
const nodes=new Map();const el=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',style:{},value:'',open:false,addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(key)};
const initial={activeMatchId:'lib',entries:[{id:'real-1',matchId:'lib',name:'Jan Novák',home:2,away:1,outcome:'1',goals:''}],results:{},closedMatches:{}};
const stored=new Map([['vitkovice-vip-kiosk-v1',JSON.stringify(initial)]]);
let state={match_status:'live',score_home:'2',score_visitor:'1',score_period:['1:0','1:1','0:0'],match_last_time:"52'",match_actual_time_alias:'3',match_actual_time_name:'3. třetina'},status=200,fetchedUrl='';
const context={console,Intl,Date:Clock,Competition,LiveMatch,HockeyTeams,ClubContent,AbortController,crypto:{randomUUID:()=>String(Math.random())},fetch:async url=>{fetchedUrl=String(url);return {ok:status===200,status,json:async()=>scoreboard(game(state))}},setTimeout(){},clearTimeout(){},setInterval(){},localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){}},location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},addEventListener(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/data.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/club-ui.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
const saved=()=>JSON.parse(stored.get('vitkovice-vip-kiosk-v1')),board=()=>vm.runInContext('realBoardMarkup()',context);
await vm.runInContext('pollLive()',context);
assert.equal(fetchedUrl,LiveMatch.feedUrl('2026-10-20'));
assert.match(board(),/Průběžný lídr/);assert.match(board(),/zdroj hokej\.cz/);assert.doesNotMatch(board(),/Gratulujeme/);
now+=16000;status=503;await vm.runInContext('pollLive()',context);assert.doesNotMatch(board(),/leading-row/);
now+=16000;status=200;state={...state,score_home:'3',score_visitor:'2',score_period:['1:0','1:1','1:1'],match_last_time:"60'",match_actual_time_name:'konec 3. třetiny'};await vm.runInContext('pollLive()',context);
assert.ok(saved().closedMatches.lib);assert.equal(vm.runInContext('open(current())',context),false);assert.equal(saved().results.lib,undefined,'no winner before the official end');
now+=16000;state={...state,score_home:'4',score_visitor:'2',match_last_time:"65'",match_actual_time_alias:'KP',match_actual_time_name:'po prodl.',match_status:'po zápase'};await vm.runInContext('pollLive()',context);
assert.deepEqual([saved().results.lib.home,saved().results.lib.away,saved().results.lib.source,saved().results.lib.decision,saved().results.lib.total],[3,2,'hokej.cz','overtime',{home:4,away:2}],'regulation score is written automatically');
assert.equal(vm.runInContext('screen',context),'celebration');
const polled=vm.runInContext('lastLivePoll',context);now+=16000;await vm.runInContext('pollLive()',context);assert.equal(vm.runInContext('lastLivePoll',context),polled,'polling stops after the result');
// Morning switch to the next match after the official result.
vm.runInContext('home()',context);assert.equal(vm.runInContext('autoAdvanceMatch()',context),false,'the result stays on screen the evening after the match');
now=Date.parse('2026-10-21T05:59:00+02:00');assert.equal(vm.runInContext('autoAdvanceMatch()',context),false);
now=Date.parse('2026-10-21T06:00:00+02:00');assert.equal(vm.runInContext('adminAuthenticated=true;autoAdvanceMatch()',context),false,'never while staff work');
vm.runInContext('adminAuthenticated=false',context);assert.equal(vm.runInContext('autoAdvanceMatch()',context),true);
assert.equal(saved().activeMatchId,'kom');assert.equal(vm.runInContext('currentId',context),'kom');assert.equal(vm.runInContext('screen',context),'welcome');
// A finished match that staff pin by hand after the switch time stays on the kiosk.
vm.runInContext("persist({...state,activeMatchId:'lib',activeMatchSetAt:new Date().toISOString()});currentId='lib';home()",context);now+=3600000;
assert.equal(vm.runInContext('autoAdvanceMatch()',context),false);assert.equal(saved().activeMatchId,'lib');
// A result recorded late (e.g. the next morning) still gets its five-minute announcement first.
vm.runInContext("persist({...state,activeMatchSetAt:null,results:{...state.results,lib:{...state.results.lib,confirmedAt:new Date().toISOString()}}})",context);
assert.equal(vm.runInContext('autoAdvanceMatch()',context),false);now+=5*60*1000;assert.equal(vm.runInContext('autoAdvanceMatch()',context),true);
console.log('PASS: hokej.cz adapter (regulation score from periods, phases, breaks, overtime, away orientation, cancelled), worker mirror, live ranking, outage handling, closure at end of regulation, automatic official result and winner announcement; optional overtime/shootout tip (final score one goal apart = draw after 60 minutes, one merged option, ranked by the final score), decision read from the source; morning switch to the next match (not before 6:00, not during staff work, staff pin respected).');
