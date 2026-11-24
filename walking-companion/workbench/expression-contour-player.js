/* Review clips use their own pack without replacing the released catalog. */
"use strict";
(() => {
  const data=window.AIRBOAT_EXPRESSIONS, pack=window.AIRBOAT_CONTOUR_PACK;
  window.AirboatContour=window.AirboatLayeredPlayer(pack);
  data.contour={};
  const aliases=pack.aliases || {neutral:"idle"};
  for(const key of [...Object.keys(pack.clips),...Object.keys(aliases)]) {
    const actual=aliases[key] || key,c=pack.clips[actual],n=pack.transition_frames;
    const file=`review-${actual}.afm`,frames=n*2+c.body_frames;
    const refs=new Set(c.keyframes.flatMap(f=>[...f.layers,f.accent].filter(Boolean).map(r=>r[0])));
    data.assets[file]={width:480,height:480,frames,kind:"contour",semantic:actual,
      bytes:[...refs].reduce((sum,i)=>sum+pack.sprites[i].bytes,0),shared:true};
    data.contour[key]={file,fps:pack.fps,loop:true,range:[n,n+c.body_frames],fill:true,semantic:key,beats:pack.beats[actual],
      segments:{entry:[0,n],performance:[n,n+c.body_frames],exit:[n+c.body_frames,frames]}};
  }
  data.assets[data.contour.look_right.file].mirrorOf=data.assets[data.contour.look_left.file];
})();
