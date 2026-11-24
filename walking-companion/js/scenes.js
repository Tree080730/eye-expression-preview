export const scenes=[
 {id:'walking',name:'WALKING',mode:'walking_mode',title:'走你的路。<br>它会跟上。',kicker:'A WALK, WITH A LITTLE DETOUR.',description:'不用安排目的地。你向前走，它在身边漂浮，偶尔绕个小弯，再慢悠悠地跟上。',poster:'assets/images/walking.png',video:'assets/videos/walking.mp4',state:'跟随你散步'},
 {id:'chilling',name:'CHILLING',mode:'chilling_mode',title:'一起发呆。<br>也很好。',kicker:'NOTHING TO DO. SOMEONE TO BE WITH.',description:'找一片树荫，坐一会儿。它会安静地浮在附近，偶尔靠近，看看你有没有睡着。',poster:'assets/images/chilling.jpg',video:'assets/videos/chilling.mp4',state:'安静地陪着你'},
 {id:'working',name:'WORKING',mode:'working_mode',title:'你忙你的。<br>它有它的主意。',kicker:'A SMALL, WELCOME DISTRACTION.',description:'工作、学习、赶一个截止日期。它在桌边游荡，偶尔探过头来，提醒你抬头看看。',poster:'assets/images/working.jpg',video:'assets/videos/working.mp4',state:'在桌边好奇地张望'},
 {id:'exploring',name:'EXPLORING',mode:'exploring_mode',title:'没走过的路。<br>一起去看看。',kicker:'A LITTLE FURTHER FROM THE FAMILIAR.',description:'换一条小路，去一个陌生的地方。它会先飘出去探探路，再回到你身边。',poster:'assets/images/exploring.jpg',video:'assets/videos/exploring.mp4',state:'好奇地探索周围'},
 {id:'playing',name:'PLAYING',mode:'playing_mode',title:'你逗它一下。<br>它可不会装没看见。',kicker:'YOUR TURN. ITS TURN. AGAIN.',description:'伸出手，叫它过来。一个靠近、一次摇摆、一点小脾气，都是它自己的回答。',poster:'assets/images/playing.jpg',video:'assets/videos/playing.mp4',state:'准备和你玩'}
];
export class SceneManager extends EventTarget {
 constructor(){super();this.current=scenes[0];}
 select(id){const scene=scenes.find(s=>s.id===id);if(!scene)throw new Error('Unknown scene');this.current=scene;this.dispatchEvent(new CustomEvent('change',{detail:scene}));return scene;}
}
