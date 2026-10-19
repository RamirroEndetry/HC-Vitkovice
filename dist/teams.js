(function(root){
  const base='https://www.hc-vitkovice.cz';
  const rows=[
    ['vit','HC Vítkovice Ridera','VIT','https://hc-vitkovice.esports.cz/files/logos/logo_VIT_invert.png',['Logo Vítkovice','Logo HC Vítkovice']],
    ['lib','Bílí Tygři Liberec','LIB','https://hc-vitkovice.esports.cz/files/logos/logo_LIB.png',['Logo Bílí Tygři Liberec','Logo Liberec']],
    ['kom','HC Kometa Brno','KOM',base+'/dist/znaky/kom.png',['Logo HC Kometa BRNO','Logo Kometa']],
    ['tri','HC Oceláři Třinec','TRI',base+'/dist/znaky/tri.png',['Logo HC Oceláři Třinec','Logo Třinec']],
    ['pce','HC Dynamo Pardubice','PCE','https://hc-vitkovice.esports.cz/files/logos/logo_PCE.png',['Logo HC Dynamo Pardubice','Logo Pardubice']],
    ['kva','Energie Karlovy Vary','KVA','https://hc-vitkovice.esports.cz/files/logos/logo_KVA.png',['Logo BYD Energie Karlovy Vary','Logo Energie KV']],
    ['mhk','Mountfield HK','MHK','https://hc-vitkovice.esports.cz/files/logos/mhk.png',['Logo Mountfield HK']],
    ['ceb','Motor České Budějovice','CEB',base+'/dist/znaky/ceb.png',['Logo Banes Motor České Budějovice','Logo Motor ČB']],
    ['plz','HC Škoda Plzeň','PLZ',base+'/dist/znaky/plz.svg',['Logo HC Škoda Plzeň','Logo Plzeň']],
    ['kla','Rytíři Kladno','KLA',base+'/dist/znaky/kla.png',['Logo Rytíři Kladno','Logo Kladno']],
    ['spa','HC Sparta Praha','SPA','https://hc-vitkovice.esports.cz/files/logos/logo_SPA.png',['Logo HC Sparta Praha','Logo Sparta Praha']],
    ['lit','HC Verva Litvínov','LIT',base+'/dist/znaky/lit.png',['Logo HC VERVA Litvínov','Logo Litvínov']],
    ['mbl','BK Mladá Boleslav','MBL',base+'/dist/znaky/mbl.png',['Logo BK Mladá Boleslav','Logo Ml. Boleslav']],
    ['olo','HC Olomouc','OLO',base+'/dist/znaky/olo.png',['Logo Olomouc']]
  ];
  const teams=Object.fromEntries(rows.map(([id,name,short,remoteLogo,aliases])=>[id,{id,name,short,remoteLogo,aliases,logo:`assets/teams/${id}.${id==='plz'?'svg':'png'}`}])) ;
  if(typeof module!=='undefined')module.exports=teams;else root.HockeyTeams=teams;
})(globalThis);
