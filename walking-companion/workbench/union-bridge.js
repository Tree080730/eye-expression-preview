// Only the containing UNION page can change visibility or request a scene preview.
addEventListener('DOMContentLoaded',()=>{
  const $=s=>document.querySelector(s);
  // Contain the complete source frame: every pose, pupil and eye edge stays visible.
  document.body.classList.add('face-above-board');
  const screen=$('.screen');
  screen.setAttribute('aria-label','实时表情预览');
  $('.masthead').after(screen);
  const face=$('#face');
  const fitFace=()=>screen.style.setProperty('--face-size',Math.max(1,Math.min(screen.clientWidth*.94,screen.clientHeight*.94))+'px');
  new ResizeObserver(fitFace).observe(screen);
  fitFace();
  const extendBackground=()=>{
    const p=face.getContext('2d').getImageData(0,0,1,1).data;
    screen.style.backgroundColor=`rgb(${p[0]} ${p[1]} ${p[2]})`;
  };
  const draw=AirboatEaf.draw;
  AirboatEaf.draw=function(ctx,...args){const result=draw.call(this,ctx,...args);if(ctx.canvas===face)extendBackground();return result;};
  extendBackground();
  // No transport controls in the presentation: play the chosen performance continuously.
  $('#complete-mode').value='loop';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#complete-mode').dispatchEvent(new Event('change'));
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
    document.body.classList.toggle('preview-view',button.dataset.view==='preview');
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  });
  let resume=false;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))parent.postMessage({unionWorkbench:true,type:'close'},location.origin);});
  addEventListener('message',e=>{
    if(e.source!==parent||e.origin!==location.origin||!e.data?.unionWorkbench)return;
    if(e.data.type==='visibility'){
      const play=$('#play');
      if(!e.data.visible){resume=play.getAttribute('aria-label')==='暂停';if(resume)play.click();if($('#compare').open)$('#compare-close').click();}
      else if(resume){play.click();resume=false;}
    }
    if(e.data.type==='scene'){
      const semantic={walking:'neutral',chilling:'relaxed',working:'thinking',exploring:'question',playing:'happy'}[e.data.scene];
      $(`[data-node="semantic:${semantic}"]`)?.click();$('#focus-node').click();
    }
  });
  // Frame starts on the selected emotion; other branches remain reachable by pan/search.
  document.dispatchEvent(new Event('union:layout'));
  parent.postMessage({unionWorkbench:true,type:'ready'},location.origin);
});
