import LiveMatch from './dist/live.js';

// Optional server-side mirror of the live score. The kiosk itself reads hokej.cz directly (CORS is open),
// so GitHub Pages works without this Worker.
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/api/live')return env.ASSETS.fetch(request);
    const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
    if(request.method!=='GET')return reply({error:'METHOD_NOT_ALLOWED'},405);
    const matchId=url.searchParams.get('matchId')||'',date=url.searchParams.get('date')||'',opponent=url.searchParams.get('opponent')||'';
    if(!/^[a-z0-9-]{1,20}$/.test(matchId)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^[A-Za-z]{2,4}$/.test(opponent))return reply({error:'INVALID_MATCH'},400);
    try{
      const response=await fetch(LiveMatch.feedUrl(date),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000),cache:'no-store'});
      if(!response.ok)return reply({error:'LIVE_FEED_UNAVAILABLE'},502);
      return reply(LiveMatch.fromScoreboard(await response.json(),{matchId,date,opponent}));
    }catch{return reply({error:'LIVE_FEED_UNAVAILABLE'},502)}
  }
};
