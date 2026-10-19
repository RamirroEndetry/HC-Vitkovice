import LiveMatch from './dist/live.js';

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/api/live')return env.ASSETS.fetch(request);
    const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
    if(request.method!=='GET')return reply({error:'METHOD_NOT_ALLOWED'},405);
    const matchId=url.searchParams.get('matchId');
    if(!['lib','kom','tri'].includes(matchId))return reply({error:'UNKNOWN_MATCH'},400);
    // A provider adapter must expose the documented normalized regulation-time schema.
    if(!env.LIVE_FEED_URL)return reply({error:'LIVE_FEED_NOT_CONFIGURED'},503);
    try{
      const feed=new URL(env.LIVE_FEED_URL);
      if(feed.protocol!=='https:')return reply({error:'INVALID_FEED_CONFIGURATION'},503);
      feed.searchParams.set('matchId',matchId);
      const headers={Accept:'application/json'};
      if(env.LIVE_FEED_TOKEN)headers.Authorization=`Bearer ${env.LIVE_FEED_TOKEN}`;
      const response=await fetch(feed,{headers,signal:AbortSignal.timeout(7000),cache:'no-store'});
      if(!response.ok)return reply({error:'LIVE_FEED_UNAVAILABLE'},502);
      const snapshot=LiveMatch.validateSnapshot(await response.json(),matchId);
      return reply(snapshot);
    }catch{return reply({error:'LIVE_FEED_UNAVAILABLE'},502)}
  }
};
