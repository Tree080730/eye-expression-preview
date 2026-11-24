// A single photographic source supplies every stripe; no invented colour noise.
export class ImageSlices {
  constructor(canvas,{strength=1}={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.strength=strength;
    this.source=document.createElement('canvas');this.texture=document.createElement('canvas');this.subject=document.createElement('canvas');
    this.paused=false;this.visible=true;this.dirty=true;this.last=0;this.request=0;this.generation=0;this.time=0;
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
    this.intersection=new IntersectionObserver(e=>{this.visible=e[0].isIntersecting;if(this.visible)this.dirty=true;});this.intersection.observe(canvas);
    this.tick=this.tick.bind(this);this.request=requestAnimationFrame(this.tick);
  }
  async setSource(url) {
    const generation=++this.generation;
    const image=new Image();image.src=url;
    await image.decode();if(generation!==this.generation)return;
    this.image=image;this.resize();return true;
  }
  resize(){
    const box=this.canvas.getBoundingClientRect();if(!box.width||!box.height)return;
    const scale=Math.min(devicePixelRatio||1,1.5,1600/box.width);
    this.w=Math.round(box.width*scale);this.h=Math.round(box.height*scale);
    this.canvas.width=this.w;this.canvas.height=this.h;
    if(!this.image)return;
    this.source.width=this.w;this.source.height=this.h;
    const s=this.source.getContext('2d');const cover=Math.max(this.w/this.image.width,this.h/this.image.height);
    const iw=this.image.width*cover,ih=this.image.height*cover;
    const mobile=box.width<760;
    const ox=mobile?Math.max(this.w-iw,Math.min(0,this.w*.56-iw*.60)):(this.w-iw)/2;
    s.drawImage(this.image,ox,(this.h-ih)/2,iw,ih);
    this.subject.width=this.w;this.subject.height=this.h;
    if(this.image.src.endsWith('walking.png')){
      // Preserve only the pedestrian silhouette, never a rectangular photo window.
      const points=[[919,688],[933,688],[945,700],[946,712],[951,719],[945,728],[935,734],[946,753],[952,783],[962,801],[970,811],[969,818],[962,821],[949,804],[938,792],[933,782],[934,822],[951,857],[966,884],[978,906],[994,918],[999,925],[990,931],[971,934],[951,929],[934,904],[918,881],[901,910],[889,925],[873,933],[854,929],[849,921],[860,906],[876,882],[891,850],[875,847],[866,837],[872,810],[885,780],[891,752],[902,735],[916,728],[910,714],[909,699]];
      const f=this.subject.getContext('2d');f.save();f.beginPath();
      points.forEach(([x,y],i)=>{const px=ox+x/1536*iw,py=(this.h-ih)/2+y/1024*ih;i?f.lineTo(px,py):f.moveTo(px,py);});
      f.closePath();f.clip();f.drawImage(this.source,0,0);f.restore();
      // Remove the figure from the sampling layer so no slice stretches duplicate limbs.
      s.drawImage(this.image,1070/1536*this.image.width,675/1024*this.image.height,4,280/1024*this.image.height,ox+840/1536*iw,(this.h-ih)/2+675/1024*ih,175/1536*iw,280/1024*ih);
    }
    this.rebuild();this.dirty=true;
  }
  rebuild(){
    const w=this.w,h=this.h;this.texture.width=w;this.texture.height=h;
    const c=this.texture.getContext('2d');c.drawImage(this.source,0,0);
    // The central architecture is processed too. Only the subject is restored later.
    const columns=[[0,.10,.12,4],[.10,.24,.30,-18],[.24,.36,.39,12],
      [.36,.52,.46,0],[.52,.64,.61,8],[.64,.77,.70,-5],
      [.77,.88,.82,-25],[.88,1,.94,17]];
    this.columns=columns;
    for(let i=0;i<columns.length;i++){
      const [left,right,sample,dy]=columns[i],x=Math.floor(left*w),width=Math.ceil((right-left)*w)+1;
      const central=i>=2&&i<=5;
      for(let y=0;y<h;y+=2){
        const sy=Math.max(0,Math.min(h-2,y+dy*this.strength));
        let sx=sample*w;
        // Keep a pedestrian's dark silhouette from being stretched into the facade.
        if(this.image.src.endsWith('walking.png')&&y>h*.64&&sample>.50&&sample<.72)sx=w*.43;
        sx=Math.max(0,Math.min(w-24,sx+Math.sin(y*79.31+i*34.7)*.7));
        // Central strips retain broad source features, with all photographic texture stretched.
        c.drawImage(this.source,sx,sy,central?14:2,2,x,y,width,2);
      }
    }
    // Short architectural fragments become flat, displaced rectangular colour bands.
    const blocks=[[.36,.26,.16,.08,.48,.27,12],[.52,.42,.12,.06,.67,.43,8],
      [.36,.58,.28,.045,.48,.59,6],[.64,.19,.13,.12,.70,.20,11]];
    for(const [x,y,bw,bh,sx,sy,sw] of blocks){
      c.drawImage(this.source,sx*w,sy*h,sw,bh*h,x*w,y*h,bw*w,bh*h);
    }
  }
  setPaused(value){this.paused=value;this.dirty=true;}
  tick(now){
    this.request=requestAnimationFrame(this.tick);
    if(document.hidden||!this.visible||!this.image)return;
    if(now-this.last<42&&!this.dirty)return;
    const delta=Math.min(now-this.last,80);this.last=now;
    if(!this.paused)this.time+=delta/1000;
    if(this.paused&&!this.dirty)return;
    const c=this.ctx,w=this.w,h=this.h,t=this.time;
    if(this.photographic){c.drawImage(this.source,0,0);this.dirty=false;return;}
    c.drawImage(this.texture,0,0);
    if(!this.paused){
      // Small slow shifts within selected strips, never a full-screen glitch.
      for(let i=0;i<this.columns.length;i++){
        const [a,b]=this.columns[i];const x=Math.floor(a*w),ww=Math.ceil((b-a)*w);
        const dy=Math.sin(t*.35+i)*3*this.strength;
        c.drawImage(this.texture,x,0,ww,h,x,dy,ww,h);
      }
    }
    c.drawImage(this.subject,0,0);
    this.dirty=false;
  }
  destroy(){cancelAnimationFrame(this.request);this.observer.disconnect();this.intersection.disconnect();}
}
export class CompanionMotion {
  constructor(elements){this.elements=elements;this.pointer={x:0,y:0,last:performance.now()};this.paused=false;this.time=0;this.last=performance.now();this.scene='walking';this.action='';this.actionUntil=0;this.scroll=0;
    window.addEventListener('pointermove',e=>{this.pointer={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5,last:performance.now()};},{passive:true});
    this.tick=this.tick.bind(this);requestAnimationFrame(this.tick);
  }
  react(action){this.action=action;this.actionUntil=performance.now()+2600;}
  tick(now){requestAnimationFrame(this.tick);const dt=Math.min(now-this.last,60);this.last=now;if(this.paused||document.hidden)return;this.time+=dt/1000;const t=this.time;
    const idle=(now-this.pointer.last)>4000;const curious=idle?Math.sin(t*.24)*12:this.pointer.x*12;
    const scrollTarget=Math.min(scrollY/innerHeight,2)*6;this.scroll+=(scrollTarget-this.scroll)*.04;
    const reaction=now<this.actionUntil?Math.sin(Math.PI*(1-(this.actionUntil-now)/2600)):0;
    this.elements.forEach((el,i)=>{if(i===1&&this.scenePaused)return;const phase=t*.85+i*.9;let x=Math.sin(t*.44+i)*7+curious,y=Math.sin(phase)*10+this.pointer.y*4-this.scroll;
      let angle=Math.sin(t*.6+i)*2.3;
      if(this.scene==='exploring'&&i===1){x+=Math.sin(t*.6)*20;y+=Math.cos(t*.65)*8;}
      if(this.scene==='chilling'&&i===1){y*=.55;angle*=.6;}
      if(this.scene==='working'&&i===1)x+=Math.pow(Math.max(0,Math.sin(t*.5)),8)*18;
      if(this.scene==='playing'&&i===1){y+=Math.sin(t*2)*6;angle+=Math.sin(t*1.5)*4;}
      if(this.action==='come')x-=reaction*35;
      if(this.action==='greet')angle+=reaction*Math.sin(t*9)*9;
      if(this.action==='float')y-=reaction*20;
      el.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg) rotateY(${(Math.sin(t*.3)*6).toFixed(2)}deg)`;
    });
  }
  setPaused(value){this.paused=value;}
}
