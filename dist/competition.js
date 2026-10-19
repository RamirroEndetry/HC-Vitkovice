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
    return '';
  }
  // Exact score first; then absolute distance across both scores; then optional goal market.
  function rank(entries,result){
    if(!result||!validScore(result.home)||!validScore(result.away))return [];
    const sorted=entries.filter(e=>!validate(e)).map(e=>({...e,distance:Math.abs(e.home-result.home)+Math.abs(e.away-result.away),bonus:e.goals&&(e.goals===(result.home+result.away>=6?'over':'under'))?1:0}));
    sorted.sort((a,b)=>a.distance-b.distance||b.bonus-a.bonus);
    let previous=null,position=0;
    return sorted.map((entry,index)=>{if(!previous||entry.distance!==previous.distance||entry.bonus!==previous.bonus)position=index+1;previous=entry;return {...entry,position}});
  }
  function evaluate(entries,result){return rank(entries,result).filter(entry=>entry.position===1)}
  const api={validScore,resultOf,validate,rank,evaluate};
  if(typeof module!=='undefined')module.exports=api;else root.Competition=api;
})(globalThis);
