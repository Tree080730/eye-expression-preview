const $=s=>document.querySelector(s),drawer=$('#moments'),hero=$('.hero');
const open=document.createElement('button');open.id='experience-open';open.className='experience-open';open.innerHTML='立即体验 <span>↗</span><small>MEET YOUR LITTLE COMPANION</small>';open.setAttribute('aria-controls','moments');open.setAttribute('aria-expanded','false');hero.append(open);
const close=document.createElement('button');close.id='experience-close';close.textContent='返回首页 ×';close.hidden=true;$('.site-header nav').replaceChildren(close);
const panel=document.createElement('div');panel.className='expression-layer';panel.hidden=true;
panel.innerHTML='<div class="expression-heading"><p class="eyebrow">A LITTLE PERSONALITY. ALL YOURS.</p><h2>看看它的小心思。</h2><span id="expression-name">待机 / IDLE</span></div><div class="expression-stage"><canvas id="expression-canvas" role="img" aria-label="待机表情，移动鼠标双眼会跟随"></canvas></div><div class="expression-buttons" role="group" aria-label="选择表情"></div>';
panel.append($('.device-console'));hero.append(panel);
$('.scene-stage').after($('.scene-tabs'));drawer.inert=true;
function setOpen(value){document.body.classList.toggle('experience',value);drawer.inert=!value;panel.hidden=!value;close.hidden=!value;open.setAttribute('aria-expanded',String(value));if(value){close.focus();requestAnimationFrame(resize);}else{$('#scene-video').pause();open.focus();}}
open.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('experience'))setOpen(false);});
$('.hero .text-link').addEventListener('click',e=>{e.preventDefault();setOpen(true);});$('.scroll-cue').hidden=true;
$('#scene-device-link').addEventListener('click',e=>{e.preventDefault();$('#connect-button').focus();});
const emotions=[['idle','待机'],['confused','困惑'],['happy','开心'],['surprised','惊讶'],['angry','生气'],['sad','伤心'],['bored','无聊'],['sleep','困了']];
let state='idle',t=0,last=0,gaze={x:0,y:0},target={x:0,y:0};const canvas=$('#expression-canvas'),ctx=canvas.getContext('2d');
for(const [id,name] of emotions){const b=document.createElement('button');b.textContent=name;b.dataset.emotion=id;b.setAttribute('aria-pressed',String(id===state));b.addEventListener('click',()=>{state=id;$('#expression-name').textContent=name+' / '+id.toUpperCase();canvas.setAttribute('aria-label',name+'表情，移动鼠标双眼会跟随');document.querySelectorAll('[data-emotion]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));});$('.expression-buttons').append(b);}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));paint(performance.now());}new ResizeObserver(resize).observe(canvas);
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();target.x=(e.clientX-r.left)/r.width*2-1;target.y=(e.clientY-r.top)/r.height*2-1;});canvas.addEventListener('pointerleave',()=>{target={x:0,y:0};});
function paint(now){const dt=last?Math.min(50,now-last):0;last=now;if(panel.hidden||document.hidden)return;const paused=$('#motion-toggle').getAttribute('aria-pressed')==='true';if(!paused)t+=dt/1000;gaze.x+=(target.x-gaze.x)*.1;gaze.y+=(target.y-gaze.y)*.1;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#2bcb5c';ctx.fillRect(0,0,canvas.width,canvas.height);const k=Math.min(canvas.width/800,canvas.height/420);ctx.setTransform(k,0,0,k,(canvas.width-800*k)/2,(canvas.height-420*k)/2);
const phase=t%5.4,blink=phase>4.95?Math.max(.045,1-Math.sin((phase-4.95)/.45*Math.PI)):1;
for(let i=0;i<2;i++){let round=!(state==='confused'&&i===0)||state==='happy';let sx=1,sy=1,angle=0,y=210;
if(state==='surprised'){sx=i===1?1.12:.85;sy=sx;angle=i===0?-.1:.06;}
if(state==='angry'){angle=i===0?.18:-.18;sx=.95;y+=Math.sin(t*11)*1.8;}
if(state==='sad'){angle=i===0?-.12:.12;y+=Math.pow(Math.max(0,Math.sin(t*3.5)),8)*9;}
if(state==='bored')sy=.63;if(state==='sleep'){sy=.2+.8*Math.pow(Math.max(0,Math.sin(t*.7)),7);y+=15*(1-sy);}
ctx.save();ctx.translate(250+i*300+gaze.x*5,y+gaze.y*3);ctx.rotate(angle);ctx.scale(sx,sy*blink);ctx.beginPath();if(round)ctx.ellipse(0,0,150,150,0,0,Math.PI*2);else ctx.rect(-150,-85,300,170);ctx.fillStyle='#fff';ctx.fill();ctx.clip();let radius=state==='surprised'?49:76;ctx.beginPath();ctx.arc((i===0?20:-20)+gaze.x*32,10+gaze.y*24,radius,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();
ctx.fillStyle='#2bcb5c';if(state==='happy'){ctx.beginPath();ctx.ellipse(i===0?-100:100,150-Math.max(0,Math.sin(t*1.9))*30,130,100,0,0,Math.PI*2);ctx.fill();}if(state==='angry'||state==='sad'){ctx.beginPath();ctx.moveTo(-170,-170);ctx.lineTo(170,-170);ctx.lineTo(170,state==='angry'?(i===0?-10:-75):(i===0?-75:-10));ctx.lineTo(-170,state==='angry'?(i===0?-75:-10):(i===0?-10:-75));ctx.closePath();ctx.fill();}ctx.restore();}
}function animate(now){paint(now);requestAnimationFrame(animate);}requestAnimationFrame(animate);
