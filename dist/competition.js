(function(root){
  function validScore(value){return Number.isInteger(value)&&value>=0&&value<=30}
  function resultOf(home,away){return home===away?'X':home>away?'1':'2'}
  function validate(entry){
    if(typeof entry.name!=='string'||entry.name.trim().length<2||entry.name.trim().length>60)return 'Napiš své jméno (2 až 60 znaků).';
    if(!['1','X','2'].includes(entry.outcome))return 'Vyber výhru Vítkovic, remízu nebo výhru hostů.';
    if(!validScore(entry.home)||!validScore(entry.away))return 'Zadej celé skóre od 0 do 30 gólů pro oba týmy.';
    if(resultOf(entry.home,entry.away)!==entry.outcome)return 'Skóre musí odpovídat vybranému výsledku.';
    if(!['','under','over'].includes(entry.goals))return 'Vyber platnou možnost počtu gólů.';
    if(entry.goals&&entry.goals!==(entry.home+entry.away>=6?'over':'under'))return 'Počet gólů musí odpovídat tvému skóre.';
    // Optional extra tip: the entered score is the final score after overtime or the shootout (e.g. 3:2 = 2:2 after 60 minutes).
    // One merged option "extra"; "overtime"/"shootout" stay valid for tips saved before the merge.
    if(![undefined,'','extra','overtime','shootout'].includes(entry.decision))return 'Vyber platnou možnost prodloužení nebo nájezdů.';
    if(entry.decision&&Math.abs(entry.home-entry.away)!==1)return 'Prodloužení nebo nájezdy tipni s konečným skóre o jeden gól, např. 3:2.';
    return '';
  }
  const extraTime=d=>d==='extra'||d==='overtime'||d==='shootout';
  // Score after 60 minutes implied by a tip: overtime and shootout tips were a draw, one goal fewer for the winner.
  function regulationOf(entry){
    if(extraTime(entry.decision)&&Math.abs(entry.home-entry.away)===1){const low=Math.min(entry.home,entry.away);return {home:low,away:low}}
    return {home:entry.home,away:entry.away};
  }
  // Final score of the match: after overtime/shootout the source gives it (total); otherwise it equals the 60-minute score.
  function finalOf(result){return result.total||(extraTime(result.decision)?null:{home:result.home,away:result.away})}
  // A draw after 60 minutes is always decided by overtime or the shootout; any other score ends in regulation time.
  function validDecision(result){return result.home===result.away?extraTime(result.decision):!result.decision||result.decision==='regulation'}
  // 1. distance from the score after 60 minutes; 2. distance from the final score (who won overtime or the shootout);
  // 3. the goals tip of older entries; 4. the earlier tip.
  function tipTime(entry){const t=Date.parse(entry.savedAt);return Number.isFinite(t)?t:Infinity}
  function rank(entries,result){
    if(!result||!validScore(result.home)||!validScore(result.away))return [];
    const final=finalOf(result);
    const sorted=entries.filter(e=>!validate(e)).map(e=>{const reg=regulationOf(e);return {...e,regulation:reg,distance:Math.abs(reg.home-result.home)+Math.abs(reg.away-result.away),finalDistance:final?Math.abs(e.home-final.home)+Math.abs(e.away-final.away):0,bonus:e.goals&&(e.goals===(result.home+result.away>=6?'over':'under'))?1:0}});
    const same=(a,b)=>a.distance===b.distance&&a.finalDistance===b.finalDistance&&a.bonus===b.bonus;
    sorted.sort((a,b)=>a.distance-b.distance||a.finalDistance-b.finalDistance||b.bonus-a.bonus||tipTime(a)-tipTime(b));
    let previous=null,position=0;
    return sorted.map((entry,index)=>{if(!previous||!same(entry,previous)||tipTime(entry)!==tipTime(previous))position=index+1;previous=entry;return {...entry,position}});
  }
  function evaluate(entries,result){return rank(entries,result).filter(entry=>entry.position===1)}
  const api={validDecision,regulationOf,finalOf,validScore,resultOf,validate,rank,evaluate,tipTime};
  if(typeof module!=='undefined')module.exports=api;else root.Competition=api;
})(globalThis);
