/* Independent Square Pop candidate. Existing catalogs retain their own assets. */
"use strict";
(() => {
  const data=window.AIRBOAT_EXPRESSIONS, pack=window.AIRBOAT_SQUARE_PACK;
  window.AirboatSquare=window.AirboatLayeredPlayer(pack);
  data.square={};
  for(const key of [...Object.keys(pack.clips),...Object.keys(pack.aliases)]){
    const actual=pack.aliases[key]||key,c=pack.clips[actual],n=pack.transition_frames;
    const file=`square-${actual}.afm`,frames=n*2+c.body_frames;
    const poses=[...c.keyframes,...(c.entry_keyframes||[]),...(c.exit_keyframes||[])];
    const refs=new Set(poses.flatMap(f=>[...f.layers,f.accent].filter(Boolean).map(r=>r[0])));
    data.assets[file]={width:480,height:480,frames,kind:"square",semantic:actual,
      bytes:[...refs].reduce((s,i)=>s+pack.sprites[i].bytes,0),shared:true};
    data.square[key]={file,fps:pack.fps,loop:true,range:[n,n+c.body_frames],fill:true,semantic:key,
      beats:pack.beats[actual],segments:{entry:[0,n],performance:[n,n+c.body_frames],exit:[n+c.body_frames,frames]}};
  }
})();
