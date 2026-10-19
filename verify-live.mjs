import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from './worker.mjs';
import Competition from './dist/competition.js';
import LiveMatch from './dist/live.js';
import HockeyTeams from './dist/teams.js';
import ClubContent from './dist/club-content.js';

const request=id=>new Request(`https://kiosk.example/api/live?matchId=${id}`);
assert.equal((await worker.fetch(request('unknown'),{})).status,400);
assert.equal((await worker.fetch(request('lib'),{})).status,503);
assert.equal((await worker.fetch(new Request('https://kiosk.example/api/live?matchId=lib',{method:'POST'}),{})).status,405);
const originalFetch=globalThis.fetch;
try{
  let requested;
  const body={matchId:'lib',home:2,away:1,phase:'period3',clock:'12:34',updatedAt:new Date().toISOString()};
  globalThis.fetch=async(url,options)=>{requested={url:String(url),options};return Response.json(body)};
  const response=await worker.fetch(request('lib'),{LIVE_FEED_URL:'https://feed.example/normalized',LIVE_FEED_TOKEN:'test-only-token'});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),body);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(new URL(requested.url).searchParams.get('matchId'),'lib');assert.equal(requested.options.headers.Authorization,'Bearer test-only-token');
  body.phase='overtime';assert.equal((await worker.fetch(request('lib'),{LIVE_FEED_URL:'https://feed.example/normalized'})).status,502);
  assert.equal((await worker.fetch(request('lib'),{LIVE_FEED_URL:'http://feed.example/normalized'})).status,503);
  let assetRequest;await worker.fetch(new Request('https://kiosk.example/'),{ASSETS:{fetch:r=>{assetRequest=r;return new Response('app')}}});assert.equal(assetRequest.url,'https://kiosk.example/');
}finally{globalThis.fetch=originalFetch}

let now=Date.parse('2026-10-20T18:00:00+02:00');
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
const nodes=new Map();const el=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',style:{},value:'',open:false,addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(key)};
const initial={activeMatchId:'lib',entries:[{id:'real-1',matchId:'lib',name:'Jan Novák',home:2,away:1,outcome:'1',goals:''}],results:{},closedMatches:{}};
const stored=new Map([['vitkovice-vip-kiosk-v1',JSON.stringify(initial)]]);
let payload={matchId:'lib',home:2,away:1,phase:'period3',clock:'08:00',updatedAt:new Date(now).toISOString()},status=200;
const context={console,Intl,Date:Clock,Competition,LiveMatch,HockeyTeams,ClubContent,AbortController,crypto:{randomUUID:()=>String(Math.random())},fetch:async()=>({ok:status===200,status,json:async()=>payload}),setTimeout(){},clearTimeout(){},setInterval(){},localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){}},location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},addEventListener(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/data.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/club-ui.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
await vm.runInContext('pollLive()',context);
assert.match(vm.runInContext('realBoardMarkup()',context),/Průběžný lídr/);assert.doesNotMatch(vm.runInContext('realBoardMarkup()',context),/Gratulujeme/);
now+=16000;payload={...payload,updatedAt:new Date(now-20000).toISOString(),home:1};await vm.runInContext('pollLive()',context);assert.equal(vm.runInContext('liveSnapshots.get("lib").home',context),2);assert.doesNotMatch(vm.runInContext('realBoardMarkup()',context),/leading-row/);
now+=16000;status=503;await vm.runInContext('pollLive()',context);assert.doesNotMatch(vm.runInContext('realBoardMarkup()',context),/leading-row/);
now+=16000;status=200;payload={...payload,home:3,away:2,phase:'regulation_end',clock:'00:00',updatedAt:new Date(now).toISOString()};await vm.runInContext('pollLive()',context);
assert.ok(JSON.parse(stored.get('vitkovice-vip-kiosk-v1')).closedMatches.lib);assert.equal(vm.runInContext('open(current())',context),false);assert.equal(JSON.parse(stored.get('vitkovice-vip-kiosk-v1')).results.lib,undefined);
now+=91000;assert.doesNotMatch(vm.runInContext('realBoardMarkup()',context),/leading-row/);
console.log('PASS: live API configuration, secret forwarding without response leakage, upstream validation, assets, live ranking, stale/out-of-order/outage handling, regulation-end closure without premature winner.');
