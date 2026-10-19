(function(root){
  const phases={scheduled:'Před zápasem',period1:'1. třetina',break1:'Přestávka po 1. třetině',period2:'2. třetina',break2:'Přestávka po 2. třetině',period3:'3. třetina',regulation_end:'Konec 3. třetiny'};
  function validateSnapshot(data,matchId,now=Date.now()){
    if(!data||data.matchId!==matchId||!Number.isInteger(data.home)||data.home<0||data.home>30||!Number.isInteger(data.away)||data.away<0||data.away>30||!Object.hasOwn(phases,data.phase)||typeof data.clock!=='string'||!/^\d{2}:[0-5]\d$/.test(data.clock)||Number(data.clock.slice(0,2))>20||typeof data.updatedAt!=='string')throw Error('Neplatný formát živých dat.');
    const timestamp=Date.parse(data.updatedAt);
    if(!Number.isFinite(timestamp)||timestamp>now+30000||now-timestamp>90000)throw Error('Živá data nejsou aktuální.');
    return {matchId,home:data.home,away:data.away,phase:data.phase,clock:data.clock,updatedAt:data.updatedAt};
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
  const api={phases,validateSnapshot,createDemo};
  if(typeof module!=='undefined')module.exports=api;else root.LiveMatch=api;
})(globalThis);
