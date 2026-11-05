// Downloads the men's schedule from hc-vitkovice.cz and writes the HOME matches
// of the VIP competition to dist/schedule.js. The kiosk only tips home games in
// the Mustang Arena VIP zone, so away games are skipped on purpose.
// Run: node scripts/sync-schedule.cjs   (npm run schedule:sync)
//
// Match ids must stay stable, because tips, results and prizes in the kiosk's
// localStorage are keyed by them. A fresh row therefore reuses the id of the
// committed schedule when it is the same game (same opponent on the same day,
// or the same opponent in the same round), and matches that already took place
// are never dropped, even if the club page stops listing them.
const fs=require('node:fs/promises');
const path=require('node:path');
const teams=require('../dist/teams.js');
const root=path.resolve(__dirname,'..');
const target=path.join(root,'dist','schedule.js');
const source='https://www.hc-vitkovice.cz/zapasy/MUZ';
const allowed=new Set(['www.hc-vitkovice.cz','hc-vitkovice.cz']);
// First home match of the VIP competition; earlier games of the season are not listed.
const COMPETITION_START='2026-10-20';
// Matches that were in the hand-written schedule keep their ids so stored tips and results stay attached.
const LEGACY_IDS={15:'lib',13:'kom',17:'tri'};
const MIN_MATCHES=10;
const warnings=[];
const warn=text=>{warnings.push(text);console.warn('Warning: '+text)};
const pad=n=>String(n).padStart(2,'0');
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const day=iso=>iso.slice(0,10);
async function get(url){
  if(!allowed.has(new URL(url).hostname))throw Error('Unrecognized schedule source');
  const response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'accept-language':'cs'}});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  if(!allowed.has(new URL(response.url).hostname))throw Error('Unexpected redirect');
  return response.text();
}
// Local Prague time -> ISO string with the correct UTC offset for that day (CET/CEST).
function isoInPrague(y,mo,d,h,mi){
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Prague',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const wanted=Date.UTC(y,mo-1,d,h,mi);let utc=wanted;
  for(let i=0;i<2;i++){const p=Object.fromEntries(fmt.formatToParts(new Date(utc)).map(x=>[x.type,x.value]));utc+=wanted-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)}
  const offset=(wanted-utc)/60000,abs=Math.abs(offset);
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00${offset<0?'-':'+'}${pad(Math.floor(abs/60))}:${pad(abs%60)}`;
}
function teamFor(name){
  const key=fold(name);
  const hits=Object.values(teams).filter(t=>t.id!=='vit'&&[t.name,...t.aliases.map(a=>a.replace(/^Logo\s+/i,''))].some(n=>key.includes(fold(n))||fold(n).includes(key)));
  if(hits.length!==1)throw Error(`opponent "${name}" ${hits.length?'matches several teams':'is not in dist/teams.js'}`);
  return hits[0];
}
// One <li data-home> block -> {round, team, short, date|null}. Throws only when the row is unreadable.
function parseRow(chunk){
  const label=text(chunk.match(/<span class="font-oswald[^"]*">([\s\S]*?)<\/span>/)?.[1]||'');
  const round=Number(label.match(/^(\d+)\. kolo/)?.[1]);
  const names=[...(chunk.match(/<h4[\s\S]*?<\/h4>/)?.[0]||'').matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map(m=>text(m[1]));
  if(!round||names.length<4)throw Error(`unreadable match row "${label}"`);
  const [home,,away,awayShort]=names;
  if(!/vitkovice/.test(fold(home)))throw Error(`round ${round} is not a home match: ${home} - ${away}`);
  const team=teamFor(away);
  let date=null;
  const played=label.match(/(\d{1,2})\. (\d{1,2})\. (\d{4}), (\d{1,2}):(\d{2})/);
  const time=chunk.match(/<time[^>]*datetime="(\d{4})-(\d{2})-(\d{2})"[^>]*>([\s\S]*?)<\/time>/);
  const clock=text(time?.[4]||'').match(/(\d{1,2}):(\d{2})/);
  if(played)date=isoInPrague(...[played[3],played[2],played[1],played[4],played[5]].map(Number));
  else if(time&&clock)date=isoInPrague(...[time[1],time[2],time[3],clock[1],clock[2]].map(Number));
  return {round,team,short:awayShort.toUpperCase(),date};
}
async function previousSchedule(){
  try{return require(target)}catch{return []}
}
async function main(){
  const previous=await previousSchedule();
  const html=await get(source);
  const chunks=html.split(/(?=<li data-(?:home|away)>)/).filter(c=>c.startsWith('<li data-home>'));
  if(!chunks.length)throw Error('No matches found; the page layout may have changed');
  const fresh=[];
  for(const chunk of chunks){
    let row;
    try{row=parseRow(chunk)}catch(error){warn(`Skipping a row: ${error.message}`);continue}
    const sameGame=previous.find(p=>p.awayTeamId===row.team.id&&row.date&&day(p.date)===day(row.date))
      ||previous.find(p=>p.awayTeamId===row.team.id&&p.round===row.round);
    if(!row.date){
      if(!sameGame){warn(`Round ${row.round} (${row.team.name}) has no kick-off time yet and is not in the committed schedule; skipped`);continue}
      warn(`Round ${row.round} (${row.team.name}) has no kick-off time on the club page; keeping ${sameGame.date}`);
      row.date=sameGame.date;
    }
    const id=sameGame?.id||LEGACY_IDS[row.round]||`r${row.round}-${row.team.id}`;
    fresh.push({id,awayTeamId:row.team.id,opponent:row.team.name,short:row.short,date:row.date,round:row.round});
  }
  const matches=fresh.filter(m=>day(m.date)>=COMPETITION_START);
  // Never lose a match the kiosk may hold tips for: carry over played matches the page no longer lists.
  const now=new Date().toISOString(),nowMs=Date.parse(now);
  for(const p of previous){
    if(matches.some(m=>m.id===p.id))continue;
    if(Date.parse(p.date)<=nowMs){warn(`${p.id} (${p.opponent}, ${day(p.date)}) is no longer on the club page; kept from the committed schedule`);matches.push(p)}
    else warn(`${p.id} (${p.opponent}, ${day(p.date)}) is no longer on the club page and was dropped`);
  }
  matches.sort((a,b)=>a.date.localeCompare(b.date));
  if(matches.length<MIN_MATCHES)throw Error(`Only ${matches.length} home matches found; expected at least ${MIN_MATCHES}`);
  if(new Set(matches.map(m=>m.id)).size!==matches.length)throw Error('Duplicate match ids');
  for(const id of Object.values(LEGACY_IDS))if(!matches.some(m=>m.id===id))throw Error(`Legacy match ${id} is missing from the schedule`);
  const body=matches.map(m=>'  '+JSON.stringify(m).replace(/"(\w+)":/g,'$1:').replace(/"/g,"'")).join(',\n');
  const file=`// Generated by scripts/sync-schedule.cjs from ${source} — do not edit by hand.\n// Home matches of HC Vítkovice Ridera from ${COMPETITION_START}; retrieved ${now}.\nconst matches=[\n${body}\n];\nif(typeof module!=='undefined')module.exports=matches;\n`;
  await fs.writeFile(target,file);
  const upcoming=matches.filter(m=>Date.parse(m.date)>nowMs);
  console.log(`Wrote ${matches.length} home matches (${upcoming.length} upcoming, ${warnings.length} warnings) to dist/schedule.js; next: ${upcoming[0]?.opponent||'none'}.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
