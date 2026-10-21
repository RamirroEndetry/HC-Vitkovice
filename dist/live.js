(function(root){
  const phases={scheduled:'Před zápasem',period1:'1. třetina',break1:'Přestávka po 1. třetině',period2:'2. třetina',break2:'Přestávka po 2. třetině',period3:'3. třetina',regulation_end:'Konec 3. třetiny'};
  // How the match was decided after 60 minutes. Visitors may tip overtime or shootout when they tip a draw.
  const decisions={regulation:'V základní hrací době',overtime:'Rozhodlo prodloužení',shootout:'Rozhodly nájezdy'};
  const validTotal=t=>t==null||typeof t==='object'&&Number.isInteger(t.home)&&t.home>=0&&t.home<=40&&Number.isInteger(t.away)&&t.away>=0&&t.away<=40;
  // clock: remaining time in the period ("08:41"), minute played ("47'") or empty when the source has none.
  const validClock=c=>typeof c==='string'&&(c===''||/^\d{1,3}'$/.test(c)||/^\d{2}:[0-5]\d$/.test(c)&&Number(c.slice(0,2))<=20);
  function validateSnapshot(data,matchId,now=Date.now()){
    if(!data||data.matchId!==matchId||!Number.isInteger(data.home)||data.home<0||data.home>30||!Number.isInteger(data.away)||data.away<0||data.away>30||!Object.hasOwn(phases,data.phase)||!validClock(data.clock)||typeof data.updatedAt!=='string'||data.final!==undefined&&typeof data.final!=='boolean'||data.final&&data.phase!=='regulation_end'||data.decision!=null&&(!Object.hasOwn(decisions,data.decision)||data.phase!=='regulation_end')||!validTotal(data.total))throw Error('Neplatný formát živých dat.');
    const timestamp=Date.parse(data.updatedAt);
    if(!Number.isFinite(timestamp)||timestamp>now+30000||now-timestamp>90000)throw Error('Živá data nejsou aktuální.');
    return {matchId,home:data.home,away:data.away,phase:data.phase,clock:data.clock,updatedAt:data.updatedAt,final:Boolean(data.final),decision:data.decision||null,total:data.total?{home:data.total.home,away:data.total.away}:null};
  }
  // Official Czech hockey scoreboard behind hokej.cz (json.esports.cz). Public, CORS-enabled, refreshed every few seconds during play.
  const SOURCE_NAME='hokej.cz';
  const feedUrl=date=>`https://json.esports.cz/hokejcz/scoreboard/onlajny/${date}.json`;
  const matchDate=iso=>String(iso).slice(0,10);
  function regulationScore(periods){
    if(!Array.isArray(periods)||periods.length<3)return null;
    let home=0,away=0;
    for(const period of periods.slice(0,3)){const parts=/^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(String(period));if(!parts)return null;home+=Number(parts[1]);away+=Number(parts[2])}
    return {home,away};
  }
  function phaseOf(game){
    const status=String(game.match_status||'').trim().toLowerCase(),alias=String(game.match_actual_time_alias||'').trim().toUpperCase(),name=String(game.match_actual_time_name||'').trim().toLowerCase();
    const minute=parseInt(game.match_last_time,10),hasMinute=Number.isFinite(minute);
    if(status==='zrušeno'||status==='odloženo'||alias==='XZ')throw Error('Zápas byl podle hokej.cz zrušen nebo odložen.');
    if(status==='před zápasem'||alias==='0')return 'scheduled';
    if(status==='po zápase'||/^K[PN]?$/.test(alias))return 'regulation_end';
    // Overtime or shootout: regulation time is already over.
    if(/prodl|nájezd|s\.n\./.test(name)||alias==='SN'||hasMinute&&minute>60)return 'regulation_end';
    const named=/([123])\s*\.?\s*(tř|třetin)/.exec(name),aliased=/^([123])$/.exec(alias);
    const period=named?Number(named[1]):aliased?Number(aliased[1]):hasMinute?Math.min(3,Math.max(1,Math.ceil(minute/20)||1)):null;
    if(/přest|pauz|konec/.test(name)){const after=named?Number(named[1]):hasMinute?Math.round(minute/20):period;if(after>=3)return 'regulation_end';return after===2?'break2':'break1'}
    if(!period)throw Error('Neznámý stav zápasu ve zdroji hokej.cz.');
    return `period${period}`;
  }
  // Turns the scoreboard of one day into the normalized regulation-time snapshot for the kiosk match.
  function fromScoreboard(data,{matchId,date,team='VIT',opponent},now=Date.now()){
    const games=[];
    for(const league of Object.values(data&&typeof data==='object'?data:{}))for(const game of Array.isArray(league?.matches)?league.matches:[])games.push(game);
    const code=c=>String(c||'').trim().toUpperCase(),own=code(team),other=code(opponent);
    const game=games.find(g=>code(g.home?.shortcut)===own&&code(g.visitor?.shortcut)===other)||games.find(g=>code(g.home?.shortcut)===other&&code(g.visitor?.shortcut)===own);
    if(!game)throw Error(`Zápas ${own}–${other} ze dne ${date} ve zdroji hokej.cz nenajdeme.`);
    const phase=phaseOf(game),flip=code(game.home?.shortcut)!==own;
    let score=regulationScore(game.score_period||game.score_periods);
    const totals={home:Number(game.score_home),away:Number(game.score_visitor)};
    if(!score){
      // Without period scores the total is only trustworthy while regulation time is still running.
      if(phase==='regulation_end'&&!/^K$/.test(code(game.match_actual_time_alias)))throw Error('Zdroj hokej.cz neuvádí skóre po třetinách.');
      if(!Number.isInteger(totals.home)||!Number.isInteger(totals.away))throw Error('Neplatné skóre ve zdroji hokej.cz.');
      score=totals;
    }
    const minute=parseInt(game.match_last_time,10);
    const clock=phase.startsWith('period')&&Number.isFinite(minute)&&minute>0&&minute<=60?`${minute}'`:'';
    const final=phase==='regulation_end'&&String(game.match_status||'').trim().toLowerCase()==='po zápase';
    const alias=code(game.match_actual_time_alias),name=String(game.match_actual_time_name||'').toLowerCase();
    let decision=null;
    if(phase==='regulation_end'){
      if(alias==='KN'||alias==='SN'||/nájezd|s.n./.test(name))decision='shootout';
      else if(alias==='KP'||/prodl/.test(name))decision='overtime';
      else if(alias==='K')decision='regulation';
      else if(Number.isFinite(minute)&&minute>60)decision='overtime';
      else if(final&&score.home!==score.away)decision='regulation';
    }
    const total=Number.isInteger(totals.home)&&Number.isInteger(totals.away)?{home:flip?totals.away:totals.home,away:flip?totals.home:totals.away}:null;
    return validateSnapshot({matchId,home:flip?score.away:score.home,away:flip?score.home:score.away,phase,clock,updatedAt:new Date(now).toISOString(),final,decision,total},matchId,now);
  }
  function createDemo(matchId,random=Math.random){
    const names=['Adam Novotný','Lucie Veselá','Petr Dvořák','Tereza Malá','Martin Král','Eva Horáková','Tomáš Černý','Jana Procházková'];
    for(let i=names.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
    const tips=[[2,1],[1,1],[3,2]].map(([home,away],i)=>({id:`demo-${i}`,matchId,name:names[i],home,away,outcome:home===away?'X':home>away?'1':'2',goals:'under',savedAt:'demo'}));
    const steps=[
      {home:0,away:0,phase:'scheduled',clock:'20:00',note:'Tři návštěvníci odeslali své tipy.'},
      {home:0,away:0,phase:'period1',clock:'20:00',note:'Začíná zápas. Průběžné pořadí se počítá z aktuálního skóre.'},
      {home:1,away:0,phase:'period1',clock:'12:18',note:'Gól Vítkovic! Tabulka se přepočítává.'},
      {home:1,away:1,phase:'period1',clock:'04:52',note:'Hosté vyrovnávají. Do čela míří tip na remízu.'},
      {home:1,away:1,phase:'break1',clock:'00:00',note:'Přestávka po první třetině.'},
      {home:2,away:1,phase:'period2',clock:'14:36',note:'Vítkovice znovu vedou. Lídr se mění.'},
      {home:2,away:2,phase:'period2',clock:'03:07',note:'Další vyrovnání. Více lidí může mít stejnou odchylku.'},
      {home:2,away:2,phase:'break2',clock:'00:00',note:'Přestávka po druhé třetině.'},
      {home:3,away:2,phase:'period3',clock:'08:41',note:'Vítkovice vedou 3:2. Jeden z tipů nyní přesně odpovídá skóre.'},
      {home:3,away:2,phase:'period3',clock:'00:15',note:'Poslední sekundy třetí třetiny. Pořadí je stále průběžné.'},
      {home:3,away:2,phase:'regulation_end',clock:'00:00',note:'Konec třetí třetiny. Demo vyhodnocuje konečného vítěze.'}
    ];
    return {matchId,tips,steps,index:0,playing:true,lastStepAt:Date.now()};
  }
  const api={phases,decisions,validateSnapshot,createDemo,SOURCE_NAME,feedUrl,matchDate,fromScoreboard};
  if(typeof module!=='undefined')module.exports=api;else root.LiveMatch=api;
})(globalThis);
