let playerGroup='all',partnerPage=0,partnerPaused=false,partnerLastChange=0;
function clubNav(){return '<div class="club-navigation"><button data-action="achievements">Úspěchy klubu →</button><button data-action="players">Profily hráčů →</button></div>'}
function clubHeading(title){return `<div class="kiosk-head"><button class="text-button" data-action="home">← Úvod</button><span class="eyebrow">HC VÍTKOVICE RIDERA</span></div><div class="club-page-heading"><span class="eyebrow">JEDEN TÝM. JEDNO SRDCE.</span><h1>${title}</h1></div>`}
function achievementsScreen(){
  screen='achievements';
  $('#main').innerHTML=clubHeading('Příběh psaný na ledě.')+`<section class="kiosk-card club-achievements"><p class="club-lead">Dva mistrovské tituly a devět druhých míst. Připomeň si nejvýraznější ligové úspěchy vítkovického hokeje.</p><div class="champion-cards"><article><span>01 / MISTŘI LIGY</span><h2>1951 / 1952</h2><p>První ligové zlato představuje úvodní mistrovský milník klubové historie.</p></article><article><span>02 / MISTŘI LIGY</span><h2>1980 / 1981</h2><p>Druhé vítězství v nejvyšší soutěži pod vedením Jana Soukupa a Karla Metelky.</p></article></div><h2>Devět stříbrných sezón</h2><div class="silver-seasons">${['1949/1950','1950/1951','1952/1953','1982/1983','1992/1993','1996/1997','2001/2002','2009/2010','2010/2011'].map(s=>`<span>${s}</span>`).join('')}</div><p class="hint">V letech 2010 a 2011 klub navázal dvěma druhými místy v řadě.</p><p class="content-source">Stručný souhrn podle <a href="https://www.hc-vitkovice.cz/nejvetsi-uspechy-klubu" target="_blank" rel="noopener">oficiálního přehledu klubových úspěchů ↗</a>.</p></section>`;
}
function playersScreen(group=playerGroup){
  screen='players';playerGroup=group;
  const list=ClubContent.players.filter(p=>group==='all'||p.position===group);
  $('#main').innerHTML=clubHeading('Profily hráčů')+`<p class="content-date">Soupiska a statistiky stažené ${fmt(ClubContent.updatedAt,{day:'numeric',month:'long',year:'numeric'})}. Údaje se vztahují k době stažení.</p><div class="player-filters">${[['all','Všichni'],['Brankář','Brankáři'],['Obránce','Obránci'],['Útočník','Útočníci']].map(([v,label])=>`<button data-player-group="${v}" aria-pressed="${group===v}" class="${group===v?'selected':''}">${label}</button>`).join('')}</div><div class="roster-grid">${list.map(p=>`<button class="roster-card" data-player-id="${p.id}"><div class="roster-photo"><span class="roster-number">${esc(p.number)}</span><img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy"></div><div class="roster-label"><small>${esc(p.position)}</small><h2>${esc(p.name)}</h2><span>Otevřít profil →</span></div></button>`).join('')}</div>`;
}
function playerScreen(id){
  const p=ClubContent.players.find(p=>p.id===id);if(!p)return;
  screen='player';
  $('#main').innerHTML=`<div class="kiosk-head"><button class="text-button" data-action="players">← Profily hráčů</button><span class="eyebrow">HC VÍTKOVICE RIDERA</span></div><section class="kiosk-card player-detail"><div class="player-identity"><div class="player-portrait"><img src="${esc(p.photo)}" alt="${esc(p.name)}"></div><div><span class="eyebrow">#${esc(p.number)} · ${esc(p.position)}</span><h1>${esc(p.name)}</h1><dl><dt>Narození</dt><dd>${esc(p.born||'Neuvedeno')}</dd><dt>Výška / váha</dt><dd>${esc(p.measurements||'Neuvedeno')}</dd><dt>Držení hole</dt><dd>${p.stick==='L'?'Levá':p.stick==='R'?'Pravá':esc(p.stick||'Neuvedeno')}</dd></dl></div></div><h2>Sezónní statistiky</h2><div class="player-stats">${Object.entries(p.stats).map(([label,value])=>`<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')||'<p class="hint">Statistiky zatím nejsou uvedené.</p>'}</div><h2>Dosavadní kariéra</h2><div class="player-career">${p.career.map(c=>`<article><h3>${esc(c.label)}</h3><p>${esc(c.value)}</p></article>`).join('')||'<p>Klubový profil zatím podrobnější kariéru neuvádí.</p>'}</div><p class="content-source">Údaje stažené ${fmt(ClubContent.updatedAt,{day:'numeric',month:'numeric',year:'numeric'})} · <a href="${esc(p.source)}" target="_blank" rel="noopener">Oficiální profil hráče ↗</a></p></section>`;
}
function partnerItems(partners){return partners.map((p,i)=>`<div class="partner-tile" style="--i:${i}"><img src="${esc(p.logo)}" alt="${esc(p.name)}"></div>`).join('')}
function partnerGroups(){const groups=[],byCategory=new Map();for(const p of ClubContent.partners){if(p.category==='Generální partner')continue;if(!byCategory.has(p.category))byCategory.set(p.category,[]);byCategory.get(p.category).push(p)}for(const list of byCategory.values())for(let i=0;i<list.length;i+=4)groups.push(list.slice(i,i+4));return groups}
function partnerSlide(group,cls){return `<div class="partner-slide ${cls}"${cls==='partner-leave'?' aria-hidden="true"':''}>${partnerItems(group||[])}</div>`}
function partnerHeading(){const groups=partnerGroups(),group=groups[partnerPage]||[];$('#partner-category').textContent=group[0]?.category||'Partneři klubu';$('#partner-count').textContent=`${partnerPage+1} / ${groups.length}`;$('#partner-progress').innerHTML='<span></span>'}
function initPartners(){
  const general=ClubContent.partners.filter(p=>p.category==='Generální partner');
  $('#partners-strip').innerHTML=`<div class="general-partner"><span class="partner-label">Generální partner</span>${partnerItems(general)}</div><div class="partner-rotator"><div class="partner-rotator-head"><span class="partner-label" id="partner-category"></span><small id="partner-count"></small><div class="partner-controls"><button id="partners-pause" aria-label="Pozastavit střídání partnerů" aria-pressed="false">❚❚</button><button id="partners-next" aria-label="Další partneři">→</button></div></div><div class="partner-frame" id="partner-frame" aria-label="Střídající se partneři">${partnerSlide(partnerGroups()[partnerPage],'partner-enter')}</div><div class="partner-progress" id="partner-progress"></div></div>`;
  partnerLastChange=Date.now();partnerHeading();
  $('#partners-pause').onclick=()=>{partnerPaused=!partnerPaused;$('#partners-pause').textContent=partnerPaused?'▶':'❚❚';$('#partners-pause').setAttribute('aria-pressed',String(partnerPaused));$('#partners-pause').setAttribute('aria-label',partnerPaused?'Spustit střídání partnerů':'Pozastavit střídání partnerů');$('#partners-strip').classList.toggle('paused',partnerPaused);partnerLastChange=Date.now();if(!partnerPaused)$('#partner-progress').innerHTML='<span></span>'};
  $('#partners-next').onclick=()=>rotatePartners();
}
function rotatePartners(){
  const groups=partnerGroups();if(!groups.length)return;
  const previous=groups[partnerPage];partnerPage=(partnerPage+1)%groups.length;
  $('#partner-frame').innerHTML=partnerSlide(previous,'partner-leave')+partnerSlide(groups[partnerPage],'partner-enter');
  partnerLastChange=Date.now();partnerHeading();
}
function tickPartners(){if(!partnerPaused&&Date.now()-partnerLastChange>=8000)rotatePartners()}
