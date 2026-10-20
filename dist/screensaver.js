// Kiosk screensaver: loops the club intro video while the welcome screen sits idle.
// Portrait panels get the 1080x1920 cut, landscape screens the 1920x1080 one.
(function(){
  const IDLE_MS=45000;
  // Phones and small tablets are not kiosks: no screensaver there (and mobile browsers often block autoplay anyway).
  const kioskScreen=matchMedia('(min-width: 900px) and (min-height: 700px)');
  if(!kioskScreen.matches)return;
  const saver=document.createElement('div');
  saver.id='screensaver';saver.hidden=true;saver.setAttribute('role','button');saver.setAttribute('aria-label','Spořič obrazovky – dotkni se pro pokračování');
  saver.innerHTML='<video muted loop playsinline preload="auto"></video><span class="screensaver-cta"><span class="screensaver-cta-icon">☝</span><span>Dotkni se obrazovky<small>a zapoj se do VIP tipovací soutěže</small></span></span>';
  document.body.append(saver);
  const video=saver.querySelector('video');
  let idleSince=Date.now();
  // ?video=vyska | ?video=sirka pins the cut for panels whose OS reports the wrong orientation; remembered on the device.
  const forced=new URLSearchParams(location.search).get('video');
  try{if(forced==='vyska'||forced==='sirka')localStorage.setItem('intro-video',forced);if(forced==='auto')localStorage.removeItem('intro-video')}catch{}
  function wantPortrait(){let saved=null;try{saved=localStorage.getItem('intro-video')}catch{}return saved?saved==='vyska':innerHeight>innerWidth}
  function pickSource(){
    const name=wantPortrait()?'intro-portrait':'intro';
    if(video.dataset.name===name)return;
    video.dataset.name=name;video.poster=`assets/intro/${name}-poster.jpg`;video.src=`assets/intro/${name}.mp4`;
    if(!saver.hidden)video.play().catch(()=>{});
  }
  // The intro leaves a clear band for the prompt (portrait: y 1640-1716 of 1920, landscape: y 920-996 of 1080).
  // Place the pill there in the video's own coordinates, so it never covers the video's text whatever the screen crops.
  const cta=saver.querySelector('.screensaver-cta');
  function placeCta(){const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh){cta.style.opacity='0';return}const scale=Math.max(innerWidth/vw,innerHeight/vh);const centerY=(innerHeight-vh*scale)/2+(vh===1920?1678:958)*scale;cta.style.top=centerY+'px';cta.style.setProperty('--cta-scale',String(Math.max(.45,scale)));cta.style.opacity='1'}
  video.addEventListener('loadedmetadata',placeCta);addEventListener('resize',placeCta);
  const onWelcome=()=>!!document.querySelector('#main .attract:not(.confirmation)')&&!document.querySelector('dialog[open]');
  // If the browser refuses autoplay, do not leave a frozen poster on screen; just stay on the welcome screen.
  function show(){if(!saver.hidden)return;pickSource();saver.hidden=false;placeCta();video.currentTime=0;video.play().catch(()=>{hide();idleSince=Date.now()+600000})}
  function hide(){if(saver.hidden)return;saver.hidden=true;video.pause();idleSince=Date.now()}
  // Swallow the waking tap so it does not press a button underneath.
  saver.addEventListener('click',event=>{event.stopPropagation();hide()});
  for(const type of ['pointerdown','keydown','input'])document.addEventListener(type,()=>{if(saver.hidden)idleSince=Date.now()},true);
  document.addEventListener('keydown',()=>hide());
  addEventListener('resize',()=>{if(!saver.hidden)pickSource()});
  setInterval(()=>{if(saver.hidden&&onWelcome()&&Date.now()-idleSince>IDLE_MS)show()},1000);
  pickSource();
  if(onWelcome()&&!location.hash)show();
})();
