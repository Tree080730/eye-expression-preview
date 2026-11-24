import {developerMode} from './developer.js';
const $=s=>document.querySelector(s),drawer=$('#moments'),hero=$('.hero');
window.companionDeveloper=developerMode;
const open=document.createElement('button');open.id='experience-open';open.className='experience-open';open.innerHTML='立即体验 <span>↗</span><small>MEET YOUR LITTLE COMPANION</small>';open.setAttribute('aria-controls','moments');open.setAttribute('aria-expanded','false');hero.append(open);
const close=document.createElement('button');close.id='experience-close';close.textContent='返回首页 ×';close.hidden=true;$('.site-header nav').replaceChildren();
const panel=document.createElement('div');panel.className='expression-layer';panel.hidden=true;
panel.innerHTML='<div class="workbench-loading" role="status">正在载入表情工作台…</div><iframe id="expression-workbench" title="UNION 表情工作台：节点关系与高清动画预览" data-src="workbench/expression-workbench.html?v=unified-header-1" allow="fullscreen"></iframe>';
hero.append(panel);
const frame=$('#expression-workbench');
function notify(type,extra={}){frame.contentWindow?.postMessage({unionWorkbench:true,type,...extra},location.origin);}
frame.addEventListener('load',()=>{panel.classList.add('workbench-loaded');notify('visibility',{visible:document.body.classList.contains('experience')});});
addEventListener('message',e=>{if(e.source===frame.contentWindow&&e.origin===location.origin&&e.data?.unionWorkbench&&e.data.type==='close')setOpen(false);if(e.source===frame.contentWindow&&e.origin===location.origin&&e.data?.unionWorkbench&&e.data.type==='ready')notify('visibility',{visible:document.body.classList.contains('experience')});});
$('.scene-stage').after($('.scene-tabs'));drawer.inert=true;
function setOpen(value){document.body.classList.toggle('experience',value);drawer.inert=!value;panel.hidden=!value;open.setAttribute('aria-expanded',String(value));if(value){developerEntry.focus();if(!frame.hasAttribute('src'))frame.src=frame.dataset.src;notify('visibility',{visible:true});}else{$('#scene-video').pause();notify('visibility',{visible:false});open.focus();}}
open.addEventListener('click',()=>setOpen(true));close.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('experience'))setOpen(false);});
$('.hero .text-link').addEventListener('click',e=>{e.preventDefault();setOpen(true);});$('.scroll-cue').hidden=true;
const developerEntry=$('#scene-device-link');
developerEntry.innerHTML='开发者模式 <span>↗</span>';
developerEntry.setAttribute('href','#developer-mode');
$('.site-header nav').append(developerEntry);
$('#motion-toggle').hidden=true;
$('#motion-toggle').style.display='none';
$('.site-header .wordmark').addEventListener('click',e=>{e.preventDefault();setOpen(false);});
const developerStatus=document.createElement('p');developerStatus.className='developer-status';developerStatus.setAttribute('role','status');$('.site-header').append(developerStatus);
developerEntry.addEventListener('click',async e=>{
 e.preventDefault();
 const context={scene:window.companionApp?.manager.current.id||'walking',workbench:frame.contentWindow};
 try{const handled=await developerMode.open(context);developerStatus.textContent=handled?'':'开发者模式暂未接入';}
 catch{developerStatus.textContent='开发者模式暂时无法打开';}
});
$('#motion-toggle').addEventListener('click',()=>setTimeout(()=>notify('visibility',{visible:document.body.classList.contains('experience')&&$('#motion-toggle').getAttribute('aria-pressed')!=='true'}),0));
