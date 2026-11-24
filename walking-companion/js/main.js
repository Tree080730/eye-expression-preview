import {ImageSlices,CompanionMotion} from './effects.js';
import {scenes,SceneManager} from './scenes.js';
import {DeviceService} from './device.js';
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let globalPaused=reduced.matches,scenePaused=false,videoActive=false,selection=0;
const heroFX=new ImageSlices($('#hero-canvas'),{strength:.8});
const sceneFX=new ImageSlices($('#scene-canvas'),{strength:.9});
sceneFX.photographic=document.body.classList.contains('metal-theme');
const motion=new CompanionMotion([...document.querySelectorAll('.pet-body')]);
const manager=new SceneManager(),device=new DeviceService(),video=$('#scene-video');
const report=message=>{$('#device-feedback').textContent=message;};
function applyMotion(){heroFX.setPaused(globalPaused);sceneFX.setPaused(globalPaused||scenePaused);motion.setPaused(globalPaused);motion.scenePaused=scenePaused;$('#motion-toggle').setAttribute('aria-pressed',String(globalPaused));$('#motion-toggle').textContent=globalPaused?'▷':'Ⅱ';$('#motion-toggle').setAttribute('aria-label',globalPaused?'恢复页面动效':'暂停页面动效');
 if(globalPaused||scenePaused)video.pause();
 $('#play-toggle').innerHTML=(globalPaused||scenePaused?'▷ <span>播放</span>':'Ⅱ <span>暂停</span>');$('#play-toggle').setAttribute('aria-label',globalPaused||scenePaused?'播放场景预览':'暂停场景预览');
}
$('#motion-toggle').addEventListener('click',()=>{globalPaused=!globalPaused;applyMotion();if(videoActive&&!globalPaused&&!scenePaused)video.play().catch(mediaError);});
reduced.addEventListener('change',e=>{globalPaused=e.matches;applyMotion();});
heroFX.setSource('assets/images/walking.png').catch(()=>heroFX.setSource('assets/images/visual-reference.png'));
const tabs=$('.scene-tabs');
scenes.forEach((scene,i)=>{const button=document.createElement('button');button.type='button';button.id=`tab-${scene.id}`;button.role='tab';button.setAttribute('aria-controls','scene-panel');button.innerHTML=`<small>0${i+1}</small>${scene.name}`;button.addEventListener('click',()=>manager.select(scene.id));button.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%scenes.length;else if(e.key==='ArrowLeft')n=(i+scenes.length-1)%scenes.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=scenes.length-1;else return;e.preventDefault();manager.select(scenes[n].id);tabs.children[n].focus();});tabs.append(button);});
function resetMedia(){video.pause();video.hidden=true;videoActive=false;video.removeAttribute('src');video.load();$('#scene-canvas').hidden=false;$('#scene-pet').hidden=false;$('#media-label').textContent='CONCEPT PREVIEW · 概念动态预览';$('#video-toggle').textContent='播放视频 ↗';}
function mediaError(){if(!videoActive)return;videoActive=false;video.pause();video.hidden=true;$('#scene-canvas').hidden=false;$('#scene-pet').hidden=false;$('#video-toggle').disabled=false;$('#video-toggle').textContent='重试视频 ↗';$('#media-label').textContent='CONCEPT PREVIEW · 概念动态预览';$('#media-message').textContent='视频尚未提供或无法播放，已保留概念预览。可在场景资源配置中替换视频路径。';}
video.addEventListener('error',mediaError);
video.addEventListener('waiting',()=>{if(videoActive)$('#media-message').textContent='视频加载中…';});
video.addEventListener('playing',()=>{if(videoActive){video.hidden=false;$('#scene-canvas').hidden=true;$('#scene-pet').hidden=true;$('#media-label').textContent='SCENE FILM · 场景视频';$('#media-message').textContent='正在播放场景视频。';$('#video-toggle').textContent='返回概念预览 ↗';$('#video-toggle').disabled=false;}});
async function updateScene(scene){const token=++selection;resetMedia();scenePaused=false;motion.scene=scene.id;motion.react('float');
 const index=scenes.indexOf(scene);[...tabs.children].forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
 $('#scene-panel').setAttribute('aria-labelledby',`tab-${scene.id}`);$('#scene-number').textContent=`0${index+1} / 05`;$('#scene-kicker').textContent=scene.kicker;$('#scene-title').innerHTML=scene.title;$('#scene-description').textContent=scene.description;$('#device-scene').textContent=scene.name[0]+scene.name.slice(1).toLowerCase();$('#media-message').textContent='当前为概念动态预览，非实拍视频。';
 const stage=$('.scene-stage');stage.classList.remove('is-transitioning');void stage.offsetWidth;stage.classList.add('is-transitioning');
 try{await sceneFX.setSource(scene.poster);if(token!==selection)return;}catch{if(token!==selection)return;$('#media-message').textContent='场景照片暂时无法加载，请检查本地图片资源。';}
 applyMotion();try{await device.setScene(scene);}catch(error){report(error.message);}
}
manager.addEventListener('change',e=>updateScene(e.detail));
$('#play-toggle').addEventListener('click',()=>{if(globalPaused){globalPaused=false;scenePaused=false;}else scenePaused=!scenePaused;applyMotion();if(videoActive&&!scenePaused)video.play().catch(mediaError);});
$('#mute-toggle').addEventListener('click',()=>{video.muted=!video.muted;$('#mute-toggle').setAttribute('aria-pressed',String(video.muted));$('#mute-toggle').textContent=`声音：${video.muted?'关':'开'}`;});
$('#video-toggle').addEventListener('click',async()=>{if(videoActive){resetMedia();$('#media-message').textContent='当前为概念动态预览，非实拍视频。';return;}
 videoActive=true;video.src=manager.current.video;video.poster=manager.current.poster;$('#video-toggle').textContent='正在加载…';$('#media-message').textContent='正在加载场景视频…';
 try{await video.play();if(globalPaused||scenePaused)video.pause();}catch{mediaError();}
});
$('#scene-device-link').addEventListener('click',()=>{report(device.connected?`正在体验 ${manager.current.name} 场景。`:`连接模拟伙伴，即可体验 ${manager.current.name} 场景。`);});
const connect=$('#connect-button');
device.addEventListener('status',e=>{const s=e.detail;$('.device-console').classList.toggle('connected',s.connected);$('#connection-label').textContent=s.connected?'伙伴已连接':'尚未连接';$('#device-name').textContent=s.connected?s.name:'—';$('#device-id').textContent=s.connected?s.id:'—';$('#device-state').textContent=s.connected?s.behavior:'等待相遇';connect.textContent=s.connected?'断开连接 ↗':'连接伙伴 ↗';document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!s.connected);});
connect.addEventListener('click',async()=>{connect.disabled=true;const wasConnected=device.connected;$('#connection-label').textContent=wasConnected?'正在断开…':'正在寻找伙伴…';
 try{if(wasConnected){await device.disconnect();report('伙伴已断开，可以随时再打个招呼。');}else{await device.connect();report(`你好！伙伴已经进入 ${manager.current.name} 场景。`);motion.react('greet');}}
 catch(error){report(error.message);$('#connection-label').textContent=device.connected?'伙伴已连接':'连接失败，请重试';}finally{connect.disabled=false;}
});
document.querySelectorAll('[data-action]').forEach(button=>{button.disabled=true;button.addEventListener('click',async()=>{const action=button.dataset.action;button.disabled=true;try{await device.behavior(action);motion.react(action);report({come:'它正在慢慢靠近你。',float:'给它一点空间，它会自在地漂浮。',greet:'收到！它摇了摇身体，向你打招呼。'}[action]);}catch(error){report(error.message);}finally{button.disabled=!device.connected;}});});
updateScene(scenes[0]);applyMotion();
// A small stable integration surface for future hardware and video integration.
window.companionApp={scenes,manager,device,heroFX,sceneFX,motion};
