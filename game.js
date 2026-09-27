'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const sprites=['ryan','simba'].map(n=>{const i=new Image();i.src=n+'.png';return i});
const keys=new Set(),keyboard=new Set(),pointers=new Map();
let mode='adventure';
let scene='title',level=0,l,cats=[],elapsed=0,clock=0,last=0,accumulator=0,particles=[],toast='',toastTime=0,muted=true,audio=null,split=false,cameraMode='auto',checkpoint=60,returns=0,record={};
try{record=JSON.parse(localStorage.getItem('cat-adventure-v3')||'{}')||{};}catch{}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlap=(a,b)=>a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h;
const format=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
function tone(freq=440,dur=.1){if(muted)return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}}
function clearInput(){keyboard.clear();pointers.clear();keys.clear();cats.forEach(c=>{c.useWas=false;c.jumpWas=false;});document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('down'));}
function syncInput(){keys.clear();keyboard.forEach(k=>keys.add(k));pointers.forEach(k=>keys.add(k));}
function say(s){toast=s;toastTime=3;$('announcement').textContent=s;}
function spark(x,y,c='#f8dc8b'){for(let i=0;i<12;i++)particles.push({x,y,vx:(Math.random()-.5)*100,vy:-30-Math.random()*80,life:.7,c});}
function reset(i){level=i;l=makeLevel(i);elapsed=0;checkpoint=60;returns=0;particles=[];toastTime=0;split=false;clearInput();cats=[0,1].map(i=>({x:60+i*55,y:400,w:36,h:34,vx:0,vy:0,ground:true,dir:1,inv:0,jumpWas:false,useWas:false,coyote:.1,buffer:0,support:null}));$('chapter').textContent=String(i+1).padStart(2,'0');$('level-title').textContent=l.name;updateHUD();}
function start(i=0){if(mode==='home')homeLeave();reset(i);resume();tone(523);}
function resume(){scene='playing';clearInput();$('overlay').classList.add('hidden');last=performance.now();accumulator=0;}
function onPlate(a,x){return Math.abs(a.x+a.w/2-x)<27&&Math.abs(a.y+a.h-434)<7;}
function stands(c,s){return c.ground&&c.vy>=0&&c.x+c.w>s.x+2&&c.x<s.x+s.w-2&&Math.abs(c.y+c.h-s.y)<3;}
function refreshGates(){for(const g of l.gates){if(g.type==='puzzle'){g.open=puzzleGateOpen(g);}else if(['relay','timed','identity'].includes(g.type)){
 if(cats.some(c=>Math.abs(c.x+c.w/2-g.switchX)<30&&c.y+c.h>385)&&!g.latched){g.latched=true;say('星星亮了！門會一直開著，快來找我。');tone(740);spark(g.switchX,400);}
 g.open=g.latched||(g.type==='timed'?g.remaining>0:g.type==='identity'?onPlate(cats[g.owner],g.plates[0]):cats.some(c=>onPlate(c,g.plates[0])));
 }else if(g.type==='duo'){
 if(!g.latched&&((onPlate(cats[0],g.plates[0])&&onPlate(cats[1],g.plates[1]))||(onPlate(cats[1],g.plates[0])&&onPlate(cats[0],g.plates[1])))){g.latched=true;say('默契滿分！金色門打開了。');tone(880);}
 g.open=g.latched;
 }else g.open=l.boxes.some(b=>onPlate(b,g.plates[0]))||cats.some(c=>onPlate(c,g.plates[0]));
 // A closing gate waits until the doorway is clear; it cannot crush a cat.
 if(!g.open&&cats.some(c=>overlap(c,g)))g.open=true;
 }}
function platformSolid(p){if(!puzzlePlatform(p))return false;return p.kind==='crumble'?p.gone<=0:p.kind==='phase'?Math.floor(elapsed/2.4)%2===p.phase:true;}
function mechanisms(dt){
 for(const p of l.platforms)if(p.kind==='crumble'){
  if(p.gone>0){p.gone=Math.max(0,p.gone-dt);if(p.gone===0)p.timer=0;}
  else{if(p.timer===0&&cats.some(c=>stands(c,p)))p.timer=p.delay;
   if(p.timer>0){p.timer-=dt;if(p.timer<=0){p.timer=0;p.gone=3;spark(p.x+p.w/2,p.y,'#e9a39b');}}}
 }
 for(const g of l.gates)if(g.type==='timed'){
  const pressed=cats.some(c=>onPlate(c,g.plates[0]));g.remaining=Math.max(0,g.remaining-dt);
  if(pressed&&!g.wasPressed&&!g.latched){g.remaining=g.duration;tone(980,.05);}g.wasPressed=pressed;
 }
 for(const r of l.remotes)if(!r.latched&&cats.some(c=>Math.abs(c.x+c.w/2-r.switchX)<30&&c.y+c.h>385)){r.latched=true;say('渡船改成自動往返！留守的隊友也能過河了。');tone(880);}
 for(const h of l.lasers){const phase=(elapsed+h.offset)%h.period;h.active=phase<h.on;h.warning=!h.active&&phase>h.period-.55;}
}
function respawn(c,i){c.x=checkpoint+i*48;c.y=394;c.vx=0;c.vy=0;c.support=null;c.inv=1.6;c.ground=false;c.coyote=0;c.buffer=0;returns++;say('回到最近的旗子！魚乾和已解開的機關都還在。');tone(200);}
function movePlatforms(dt){for(const p of l.movers){const ox=p.x,oy=p.y;const riders=cats.filter(c=>stands(c,p));if(p.kind==='balance'){const target=434-l.puzzle.level*72;p.y+=clamp(target-p.y,-110*dt,110*dt);}else if(p.kind==='lift'){
 if(!p.active&&riders.length===2){p.active=true;p.wait=.4;say('兩隻都上車了，升降梯啟動！');tone(600);}
 if(p.active){if(p.wait>0)p.wait-=dt;else{p.y+=p.dir*p.speed*dt;if(p.y<=p.to){p.y=p.to;p.dir=1;p.wait=2;}if(p.y>=p.from){p.y=p.from;p.dir=-1;p.wait=2;}}}
 }else{if(p.kind==='remote'&&!p.control.latched)p.dir=onPlate(cats[p.control.owner],p.control.plate)?1:-1;p.x+=p.dir*p.speed*dt;if(p.x>=p.to){p.x=p.to;p.dir=-1;}if(p.x<=p.from){p.x=p.from;p.dir=1;}}
 p.dx=p.x-ox;p.dy=p.y-oy;riders.forEach(c=>{c.x+=p.dx;c.y+=p.dy;c.support=p.id;});}}
function update(dt){if(scene!=='playing')return;clock+=dt;elapsed+=dt;toastTime-=dt;
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
 updatePuzzle(dt);mechanisms(dt);movePlatforms(dt);refreshGates();
 const solids=[...l.ground,...l.platforms.filter(p=>platformSolid(p)),...l.movers,...l.gates.filter(g=>!g.open)];
 for(const h of l.hazards){h.x+=h.dir*h.speed*dt;if(h.x>=h.to){h.x=h.to;h.dir=-1;}if(h.x<=h.from){h.x=h.from;h.dir=1;}}
 cats.forEach((c,i)=>{c.inv=Math.max(0,c.inv-dt);const [left,right,jump]=i?['ArrowLeft','ArrowRight','ArrowUp']:['KeyA','KeyD','KeyW'];
 let dir=Number(keys.has(right))-Number(keys.has(left));const frozen=l.puzzle?.type==='freeze'&&l.puzzle.freezeOwner===i;if(frozen)dir=0;const carrying=l.puzzle?.cargo?.held===i;c.vx=dir*(carrying?135:185);if(dir)c.dir=dir;
 const pressed=keys.has(jump);c.buffer=Math.max(0,c.buffer-dt);if(pressed&&!c.jumpWas)c.buffer=.14;c.jumpWas=pressed;c.coyote=c.ground?.1:Math.max(0,c.coyote-dt);
 if(c.buffer>0&&c.coyote>0&&!carrying&&!frozen){c.vy=-370;c.ground=false;c.coyote=0;c.buffer=0;c.support=null;tone(i?560:470,.05);}
 const wind=l.winds.find(w=>c.x+c.w>w.x&&c.x<w.x+w.w);if(wind&&!c.ground)c.vx+=wind.force*(.7+.3*Math.sin(elapsed*2*Math.PI/wind.period));
 const belt=l.belts.find(b=>c.ground&&Math.abs(c.y+c.h-b.y)<2&&c.x+c.w>b.x&&c.x<b.x+b.w);if(belt)c.vx+=belt.speed;
 c.x=clamp(c.x+c.vx*dt,8,l.width-c.w-8);
 for(const b of l.boxes){if(overlap(c,b)){const push=clamp(b.x+c.vx*dt*.75,b.min,b.max);if(c.vx!==0){if(b.ice){if(!b.v)b.v=Math.sign(c.vx)*220;}else b.x=push;}c.x=c.vx>0?b.x-c.w:c.vx<0?b.x+b.w:c.x;}}
 for(const s of solids){if(!s.oneway&&overlap(c,s)&&s.y<434)c.x=dir>0?s.x-c.w:dir<0?s.x+s.w:c.x;}
 const oldY=c.y;c.vy+=740*dt;c.y+=c.vy*dt;c.ground=false;c.support=null;
 for(const s of [...solids,...l.boxes]){if(!puzzlePlatform(s,i))continue;if(c.x+c.w<=s.x||c.x>=s.x+s.w)continue;
 if(c.vy>=0&&oldY+c.h<=s.y+2&&c.y+c.h>=s.y){c.y=s.y-c.h;c.vy=0;c.ground=true;c.support=s.id||null;}
 else if(!s.oneway&&c.vy<0&&oldY>=s.y+s.h&&c.y<s.y+s.h){c.y=s.y+s.h;c.vy=0;}}
 for(const f of l.fish)if(!f.got&&(f.owner===undefined||f.owner===i)&&Math.abs(c.x+c.w/2-f.x)<30&&Math.abs(c.y+c.h/2-f.y)<30){f.got=true;spark(f.x,f.y);tone(800,.08);}
 if(c.y>560||c.inv<=0&&(l.hazards.some(h=>overlap(c,h))||l.lasers.some(h=>h.active&&overlap(c,h))||l.puzzle?.basins?.some(b=>!b.drained&&c.x+c.w>b.x&&c.x<b.x+b.w&&c.y+c.h>b.y+3)))respawn(c,i);
 });
 refreshGates();
 // Shared checkpoint only advances after BOTH cats arrive, so nobody skips a puzzle.
 for(const cp of l.checkpoints)if(!cp.active&&cats.every(c=>c.x>=cp.x-15)&&cp.x>checkpoint){cp.active=true;checkpoint=cp.x;spark(cp.x,394,'#b9efa5');say('旗子亮了！兩隻貓都記住這個集合點。');}
 if(cameraMode==='split')split=true;else{const distance=Math.abs(cats[0].x-cats[1].x);if(distance>620)split=true;else if(distance<460)split=false;}
 if((!l.puzzle||l.puzzle.solved)&&l.fish.every(f=>f.got)&&cats.every(c=>c.x+c.w/2>l.goal.x-28&&Math.abs(c.y+c.h-l.goal.y)<14)){win();}
 updateHUD();}
function updateHUD(){const count=l.fish.filter(f=>f.got).length;$('fish-count').textContent=count+' / '+l.fish.length;$('timer').textContent=format(elapsed);$('checkpoint-status').textContent=checkpoint>60?'旗子已記錄':'起點';$('view-status').textContent=split?'雙人分割':'共同視角';
 let hint=l.hint;const near=l.signs.filter(s=>s.x<Math.min(...cats.map(c=>c.x))+300).at(-1);if(near)hint=near.text;
 if(count===l.fish.length)hint='魚乾收齊了！一起到最右邊的貓窩。';else if(cats.some(c=>c.x>l.goal.x-100))hint='還有 '+(l.fish.length-count)+' 隻魚乾，沿著上方地圖找亮點。';if(l.puzzle)hint=puzzleStatus()+'｜'+l.puzzle.hint;$('mission-text').textContent=hint;
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function label(s,x,y,c='#f2edcd',size=12,align='center'){ctx.font=`${size}px monospace`;ctx.textAlign=align;ctx.fillStyle=c;ctx.fillText(s,Math.round(x),Math.round(y));}
function star(x,y,c='#f4d890'){rect(x-2,y-7,4,14,c);rect(x-7,y-2,14,4,c);rect(x-4,y-4,8,8,c);}
function plant(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);rect(-10,-24,20,24,'#ac8060');rect(-13,-27,26,6,'#d2a67b');rect(-2,-65,4,38,'#435b3e');for(let i=0;i<3;i++){rect(-18,-58+i*11,18,7,'#516e44');rect(2,-65+i*11,15,7,'#607f4b');}ctx.restore();}
function scenery(){const night=l.tier>=2,palette=[['#91a789','#6d8467'],['#918b78','#655f58'],['#9c937b','#776653'],['#738fa0','#445f70'],['#6f9995','#406b6a'],['#596570','#36434c'],['#657f98','#3e5775'],['#867a96','#5d526b'],['#485f7e','#2a3e5d'],['#786d78','#4d4359'],['#4f747d','#2b505b'],['#575674','#383452']][level%12];rect(0,0,960,480,palette[0]);rect(0,0,960,20,palette[1]);for(let x=16;x<960;x+=46){rect(x,22,2,409,night?'#688184':'#a0b093');for(let y=45;y<420;y+=50)rect(x+17,y,3,3,night?'#849597':'#bac39e');}
 // window and garden
 rect(604,45,210,171,'#4c6355');rect(611,52,196,157,night?'#283f58':'#dbe2b6');rect(616,57,186,145,night?'#385673':'#c4d9bc');if(night){rect(746,76,25,28,'#ebddac');rect(739,76,16,21,'#385673');for(let i=0;i<12;i++)rect(627+(i*47)%164,64+(i*31)%93,2,2,'#d6ddc0');}else{rect(738,72,30,30,'#eee6b4');rect(625,139,50,58,'#95b593');rect(680,125,48,74,'#a4c09a');rect(733,144,67,56,'#87a989');}rect(705,53,8,155,'#607764');rect(612,125,194,7,'#607764');rect(594,207,230,10,'#e0d1a4');rect(589,50,18,144,'#799276');rect(813,50,18,144,'#799276');for(let x=589;x<608;x+=6)rect(x,50,2,144,'#93a687');for(let x=814;x<832;x+=6)rect(x,50,2,144,'#93a687');
 // picture, clock and shelf
 rect(100,58,89,92,'#65745b');rect(106,64,77,80,'#daceab');rect(111,69,67,70,'#a8b997');label('HOME',144,96,'#596d4f',15);label('♥',145,123,'#ba876e',22);
 rect(274,90,183,9,'#d1b387');rect(287,55,13,35,'#b87765');rect(302,60,12,30,'#dec393');rect(317,49,14,41,'#749274');rect(334,58,12,32,'#c4ad72');plant(420,90,.6);
 // Retain the original room furnishings in indoor chapters.
 if([0,2,7,9].includes(level)){rect(36,297,204,78,'#6f896b');rect(30,328,216,60,'#718c6b');rect(38,337,200,41,'#8d9f77');rect(29,319,25,60,'#a5b48a');rect(220,319,25,60,'#a5b48a');rect(50,382,11,26,'#695b43');rect(215,382,11,26,'#695b43');rect(70,305,45,31,'#e4c999');rect(120,307,43,28,'#b4c694');}

}
function drawCat(cat,i){const bob=cat.ground&&cat.vx?Math.sin(clock*19)*1.8:Math.sin(clock*2+i)*.5;ctx.save();ctx.globalAlpha=cat.inv>0&&Math.floor(clock*12)%2?.4:1;rect(cat.x-6,cat.y+cat.h-2,cat.w+12,4,'#263a2a33');ctx.translate(Math.round(cat.x+cat.w/2),Math.round(cat.y+cat.h+bob));ctx.scale(cat.dir,1);const im=sprites[i];if(im.complete&&im.naturalWidth){ctx.drawImage(im,-39,-53,78,53);}ctx.restore();const color=i?'#ffe0a4':'#ecf7d2';label(i?'2P 辛巴':'1P 萊恩',cat.x+cat.w/2,cat.y-26,color,11);rect(cat.x+cat.w/2-2,cat.y-21,4,4,i?'#eab478':'#b0dba1');}
function drawPlate(x,color,active){rect(x-26,428,52,6,'#5a6549');rect(x-23,active?429:422,46,active?3:6,color);}
function drawWorld(camera,width,offset){
 ctx.save();ctx.beginPath();ctx.rect(offset,0,width,480);ctx.clip();ctx.translate(offset,0);
 // Reuse the original room artwork as a parallax backdrop.
 const parallax=camera*.22;for(let k=Math.floor(parallax/960);k<=Math.floor((parallax+width)/960);k++){ctx.save();ctx.translate(k*960-parallax,0);scenery();ctx.restore();}
 ctx.translate(-camera,0);
 for(const g of l.ground){rect(g.x,g.y,g.w,60,'#ad9571');rect(g.x,g.y,g.w,6,'#dbc29c');for(let x=Math.max(g.x,Math.floor(camera/96)*96);x<Math.min(g.x+g.w,camera+width);x+=96)rect(x,453,2,25,'#968261');}
 for(const g of l.gaps){rect(g.x,445,g.w,35,'#263f42');for(let x=g.x;x<g.x+g.w;x+=22)rect(x,463+Math.sin(clock*2+x)*2,12,3,'#679997');}
 for(const p of l.platforms){
 const color=p.kind==='crumble'?'#f4a28d':p.kind==='phase'?(p.phase?'#f6a9d2':'#80e4e0'):p.kind==='refuge'?'#eef0dc':p.kind==='light'?'#ffe5a1':p.kind==='personal'?((p.owner^l.puzzle.polarity)?'#f6bb83':'#c4e7ac'):p.kind==='timeBridge'?(p.phase?'#b8a4ec':'#99dce3'):p.kind==='cargoBridge'?'#b7d7b1':'#d3b98b';
 if(!platformSolid(p)){for(let x=p.x;x<p.x+p.w;x+=12)rect(x,p.y,7,2,color+'66');continue;}
 ctx.save();if(p.kind==='phase'&&2.4-elapsed%2.4<.55)ctx.globalAlpha=Math.floor(elapsed*10)%2?.35:1;
 rect(p.x,p.y,p.w,p.h,'#6e6249');rect(p.x,p.y,p.w,5,color);rect(p.x+8,p.y+12,6,8,'#877957');
 if(p.kind==='crumble'){for(let k=0;k<3;k++)rect(p.x+12+k*20,p.y+2,2,10,'#744c48');if(p.timer>0)rect(p.x,p.y-5,p.w*p.timer/p.delay,3,'#ffebe0');}ctx.restore();}
 for(const b of l.belts){rect(b.x,434,b.w,8,'#54506d');for(let x=b.x+((clock*60)%28);x<b.x+b.w;x+=28)label('‹',x,442,'#e1bdef',17);}
 for(const w of l.winds){ctx.save();ctx.globalAlpha=.55;for(let k=0;k<12;k++){const x=w.x+((k*83-clock*68)%w.w+w.w)%w.w,y=210+(k%4)*43;rect(x,y,22,2,'#d3f3fb');label('‹',x,y+5,'#d3f3fb',17);}ctx.restore();}
 for(const h of l.lasers){rect(h.x-5,h.y-9,26,9,'#424957');rect(h.x-5,429,26,5,'#424957');if(h.active){rect(h.x-5,h.y,26,h.h,'#fb6b7833');rect(h.x+4,h.y,8,h.h,'#ff7a88');rect(h.x+7,h.y,2,h.h,'#fff1ec');}else{for(let y=h.y;y<h.y+h.h;y+=18)rect(h.x+7,y,2,8,h.warning?'#ffc286':'#a2e9bd55');}label(h.active?'停':h.warning?'!':'走',h.x+8,h.y-17,h.active?'#ffb3b9':'#cfedc2',13);}
 for(const r of l.remotes){drawPlate(r.plate,r.owner?'#efb477':'#b0dba1',onPlate(cats[r.owner],r.plate));label((r.owner?'2P':'1P')+' 控船',r.plate,408,'#bfe6e9',13);rect(r.switchX-12,392,24,32,r.latched?'#b3d995':'#6d7952');star(r.switchX,406);}

 for(const p of l.movers){const c=p.kind==='lift'?'#c3a9e7':'#a1d8e1';if(p.kind==='lift'){rect(p.x+12,265,3,169,'#536271');rect(p.x+p.w-15,265,3,169,'#536271');label(p.active?'循環往返':'兩隻一起上來',p.x+p.w/2,p.y-14,c,13);}
 rect(p.x,p.y,p.w,p.h,'#455c68');rect(p.x,p.y,p.w,5,c);for(let x=p.x+8;x<p.x+p.w-8;x+=18)rect(x,p.y+7,8,3,c);}
 for(const g of l.gates){const color=g.type==='box'?'#efb477':g.type==='timed'?'#f1dc8d':g.type==='identity'?(g.owner?'#efb477':'#b0dba1'):g.type==='duo'?'#ebd57b':'#b0dba1';for(const x of g.plates){drawPlate(x,color,cats.some(c=>onPlate(c,x))||l.boxes.some(b=>onPlate(b,x)));label(g.type==='box'?'紙箱':g.type==='timed'?'倒數':g.type==='identity'?(g.owner?'2P 踩':'1P 踩'):g.type==='duo'?'一起踩':'踩住',x,411,color,12);}
 if(g.type==='timed'&&!g.latched)label(g.remaining>0?g.remaining.toFixed(1)+' 秒':'踩鐘啟動',g.x,g.y-14,'#f5e2a2',15);
 rect(g.x-3,g.y,24,8,'#d8c794');if(!g.open){rect(g.x,g.y,18,g.h,'#58664a');for(let y=g.y+13;y<434;y+=20)rect(g.x+2,y,14,12,color);}else rect(g.x,170,18,15,color);
 if(g.switchX){rect(g.switchX-12,392,24,32,g.latched?'#b3d995':'#6d7952');star(g.switchX,405);if(!g.latched)label('碰亮，接隊友',g.switchX,380,'#faf1d3',12);}}
 for(const b of l.boxes){rect(b.x,b.y,b.w,b.h,'#97673f');rect(b.x+3,b.y+3,b.w-6,b.h-6,'#cca06a');rect(b.x+18,b.y+3,8,b.h-6,'#e5c48b');label('↑',b.x+10,b.y+27,'#795a3e',18);}
 for(const cp of l.checkpoints){rect(cp.x,384,3,50,'#d6c6a2');rect(cp.x+3,384,24,16,cp.active?'#c1e6a1':'#6d8570');if(cp.active)star(cp.x+15,392,'#44664a');}
 for(const h of l.hazards){rect(h.x,h.y,36,20,'#4a5660');rect(h.x+3,h.y-3,30,16,'#bec7bd');rect(h.x+14,h.y+3,6,3,'#de9c75');}
 for(const f of l.fish){if(f.got)continue;const y=f.y+Math.sin(clock*2+f.x)*3;if(f.owner!==undefined){rect(f.x-16,y-14,32,28,f.owner?'#efb47744':'#c7f5c444');label(f.owner?'2P':'1P',f.x,y-19,f.owner?'#ffd49f':'#d5f5c8',12);}rect(f.x-8,y-4,13,8,'#f2cd80');rect(f.x-4,y-7,7,14,'#f5d891');rect(f.x+8,y-5,4,10,'#e5b765');rect(f.x-6,y-2,2,2,'#786e4a');}
 const {x:gx,y:gy}=l.goal;rect(gx-18,gy-65,74,65,'#866e54');rect(gx-11,gy-74,60,10,'#b39a70');rect(gx-3,gy-82,42,9,'#c8ae7e');rect(gx-5,gy-51,48,51,'#4d5d45');label('HOME',gx+18,gy-59,'#f4e4b1',10);if(l.fish.every(f=>f.got))star(gx+18,gy-97+Math.sin(clock*3)*3);
 drawPuzzle();cats.forEach(drawCat);particles.forEach(p=>rect(p.x,p.y,3,3,p.c));ctx.restore();
}
function draw(){ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,480);if(split){for(let i=0;i<2;i++)drawWorld(clamp(cats[i].x-220,0,l.width-477),477,i*483);rect(477,0,6,480,'#172d26');rect(10,12,95,24,'#233c31e8');rect(493,12,95,24,'#233c31e8');label('1P 萊恩',58,29,'#d6f2bf',13);label('2P 辛巴',541,29,'#ffce92',13);}else{drawWorld(clamp((cats[0].x+cats[1].x)/2-462,0,Math.max(0,l.width-960)),960,0);}
 // A compact map makes missed fish and distant partners easy to find.
 rect(18,52,924,18,'#20382edb');for(const f of l.fish)if(!f.got)rect(25+f.x/l.width*909,58,4,4,'#efd28b');for(const cp of l.checkpoints)rect(25+cp.x/l.width*909,63,2,4,cp.active?'#c5e9ac':'#7d977c');cats.forEach((c,i)=>rect(25+c.x/l.width*909,54,7,8,i?'#f1ae73':'#edf8df'));rect(25+l.goal.x/l.width*909,56,6,10,'#c2b0e9');
 if(toastTime>0&&scene==='playing'){const w=Math.min(900,toast.length*14+34);rect(480-w/2,82,w,30,'#243e32ee');label(toast,480,103,'#eee6c9',14);}}
function show(html,kind=''){clearInput();$('modal').className='modal '+kind;$('modal').innerHTML=html;$('overlay').classList.remove('hidden');}
function title(){scene='title';show(`<p class="eyebrow">RYAN & SIMBA'S LITTLE ADVENTURE</p><h2>罐罐大作戰<span>合作闖關，或一起在家過生活。</span></h2><div class="cat-lineup"><div><img src="ryan.png" alt="白色長毛的曾萊恩"><strong>曾萊恩</strong><span class="player one">PLAYER 1</span></div><span class="plus">＋</span><div><img src="simba.png" alt="橘色虎斑的曾辛巴"><strong>曾辛巴</strong><span class="player two">PLAYER 2</span></div></div><p class="intro">從雙人冒險到解謎密室，輪流替彼此開路。<br>共用鍵盤或觸控雙人玩 · 手機建議橫放</p><button class="primary" id="start">雙人合作闖關 →</button><button class="primary home-entry" id="start-home">單人自由模式 · 我們家</button><button class="secondary" id="title-levels">選擇關卡</button>`);$('start').onclick=()=>start(0);$('start-home').onclick=homeStart;$('title-levels').onclick=selectLevels;}
function pause(){if(mode==='home'){homePause();return;}if(scene==='playing'){scene='paused';show('<h2>貓咪休息中<span>準備好，再一起出發。</span></h2><p class="result-detail">進度留在這裡，等你們回來。</p><button class="primary" id="resume">繼續冒險 →</button><button class="secondary" id="pause-levels">選擇關卡</button>');$('resume').onclick=resume;$('pause-levels').onclick=selectLevels;}else if(scene==='paused')resume();}
function restoreScene(previous){if(previous==='title')title();else if(previous==='won'){scene='won';renderWin();}else if(previous==='paused'){scene='playing';pause();}else resume();}
function selectLevels(){if(scene==='select')return;const previous=scene;scene='select';show('<h2>去哪裡冒險？</h2><p class="result-detail">1–12 操作冒險 · 13–18 解謎實驗 · 19–24 協作密室 · 25–30 最終挑戰</p><div class="chapter-filters" aria-label="關卡分類"><button data-chapters="all" aria-pressed="true">全部</button><button data-chapters="0,12">1–12</button><button data-chapters="12,18">13–18</button><button data-chapters="18,24">19–24</button><button data-chapters="24,30">25–30</button></div><div class="level-grid">'+chapters.map((c,i)=>`<button class="level-choice ${record[i]?'complete':''}" data-level="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${c[0]}</span><em>${c[4]}</em><small>${record[i]?'✓ '+format(record[i].best):['難度 1/7','難度 2/7','難度 3/7','難度 4/7','難度 5/7','難度 6/7','難度 7/7'][c[3]]}</small></button>`).join('')+'</div><button class="secondary" id="close-levels">返回</button>','selector');document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>start(Number(b.dataset.level)));document.querySelectorAll('[data-chapters]').forEach(b=>b.onclick=()=>{const range=b.dataset.chapters==='all'?[0,chapters.length]:b.dataset.chapters.split(',').map(Number);document.querySelectorAll('[data-level]').forEach(c=>c.hidden=!(Number(c.dataset.level)>=range[0]&&Number(c.dataset.level)<range[1]));document.querySelectorAll('[data-chapters]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));});$('close-levels').onclick=()=>restoreScene(previous);}
function help(){if(mode==='home'){homeHelp();return;}if(scene==='help')return;const previous=scene;scene='help';show('<h2>兩隻貓的合作筆記</h2><div class="help-copy"><p>萊恩：<b>A / D</b> 移動、<b>W</b> 跳。辛巴：<b>← / →</b> 移動、<b>↑</b> 跳。<b>S / ↓</b> 是互動鍵。手機有「用」按鈕，可同時操作兩隻。第 13 關起，用互動轉機關、交換物品、輸入密碼。</p><p><b>薄荷踏板</b>：一隻踩住，另一隻過門碰星星。<b>金色踏板</b>：兩隻同時踩。<b>橘色踏板</b>：把紙箱推上去。</p><p><b>藍色平台</b>會往返；<b>紫色升降梯</b>要兩隻同時站上，啟動後持續往返。分開太遠會自動分割畫面，也可按「視角」固定分割。</p><p>兩隻都經過旗子才會記錄檢查點。跌落或碰掃地機會回旗子，魚乾與已解開的機關保留。收齊魚乾後，一起到最右邊貓窩。</p><p><b>進階機關</b>：紅磚踩下後崩落、3 秒重生。青／粉平台每 2.4 秒交替，白色小島可休息。雷射亮紅光不能碰，閃爍是預告。限時門踩一次開始倒數，離開再踩可重啟。</p><p><b>合作挑戰</b>：指定角色踏板只有標示的貓能啟動；1P／2P 魚乾也要本人收集。控船踏板踩住向右、鬆開向左；隊友上岸碰星星後船會自動往返。風只影響半空，輸送帶只影響地面。</p><p><b>Esc</b> 暫停 · <b>↻</b> 重來本關 · 選關會重新開始所選關卡。</p></div><button class="primary" id="close-help">知道了！</button>','help');$('close-help').onclick=()=>previous==='select'?selectFromHelp():restoreScene(previous);}
function selectFromHelp(){scene='playing';selectLevels();}
function win(){scene='won';const previous=record[level];record[level]={best:previous?Math.min(previous.best,elapsed):elapsed};try{localStorage.setItem('cat-adventure-v3',JSON.stringify(record));}catch{}tone(1047,.3);renderWin();}
function renderWin(){const final=level===chapters.length-1;show(`<p class="eyebrow">CHAPTER ${String(level+1).padStart(2,'0')} COMPLETE</p><h2>${final?'罐罐到手，回家囉！':'一起過關啦！'}<span>${final?'最好的隊友，就是身邊的你。':'因為有你，才走得到這裡。'}</span></h2><div class="cat-lineup"><img src="ryan.png" alt="萊恩"><span class="plus">♡</span><img src="simba.png" alt="辛巴"></div><p class="result-detail">魚乾 ${l.fish.length} / ${l.fish.length} · ${format(elapsed)} · 回旗子 ${returns} 次<br>已完成 ${Object.keys(record).length} / ${chapters.length} 關</p><button class="primary" id="next">${final?'從第一關再出發':'下一關 →'}</button><button class="secondary" id="win-levels">選擇關卡</button>`);$('next').onclick=()=>start(final?0:level+1);$('win-levels').onclick=selectLevels;}
$('puzzle-help').onclick=()=>{if(!l.puzzle){help();return;}const previous=scene;scene='help';show('<h2>'+l.name+'</h2><div class="help-copy"><p>'+l.puzzle.hint+'</p><p>'+puzzleStatus()+'</p><p>靠近機關按 S（萊恩）／↓（辛巴），手機按「用」。錯誤可重試，右上 ↻ 可重置本關。</p></div><button class="primary" id="back-puzzle">回到遊戲</button>','help');$('back-puzzle').onclick=()=>restoreScene(previous);};
$('pause').onclick=pause;$('help').onclick=help;$('level-select').onclick=selectLevels;
$('restart').onclick=()=>{if(mode==='home'){const c=home.cats[home.active];Object.assign(c,{x:470,y:535,z:0,vz:0,ground:true,action:null,ai:null});homeSay('回到客廳了！家具和兩隻貓的需求保持不變。');return;}if(scene==='title')return;const previous=scene;scene='confirm';show('<h2>這關重新開始？<span>本關魚乾、旗子和機關會重置。</span></h2><button class="primary" id="yes-restart">重新開始本關</button><button class="secondary" id="no-restart">返回</button>');$('yes-restart').onclick=()=>start(level);$('no-restart').onclick=()=>restoreScene(previous);};
$('camera').onclick=()=>{cameraMode=cameraMode==='auto'?'split':'auto';split=cameraMode==='split'||Math.abs(cats[0].x-cats[1].x)>620;$('camera').textContent=cameraMode==='auto'?'視角：自動':'視角：分割';$('camera').setAttribute('aria-pressed',String(cameraMode==='split'));updateHUD();};
$('sound').onclick=()=>{muted=!muted;$('sound').innerHTML='♫ <span>音效'+(muted?'關':'開')+'</span>';$('sound').setAttribute('aria-label',muted?'開啟音效':'關閉音效');tone(660);};
const gameKeys=['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp','KeyS','ArrowDown'];
window.addEventListener('keydown',e=>{if(mode==='home'&&e.code==='KeyC'&&!e.repeat){e.preventDefault();homeSwitch();return;}if((gameKeys.includes(e.code)||(mode==='home'&&['Space','KeyE','KeyQ','KeyR'].includes(e.code)))&&(scene==='playing'||scene==='home')){e.preventDefault();keyboard.add(e.code);syncInput();}if(e.code==='Escape'&&!e.repeat)pause();});window.addEventListener('keyup',e=>{keyboard.delete(e.code);syncInput();});
window.addEventListener('blur',()=>{clearInput();if(scene==='playing')pause();else if(mode==='home'&&!home.paused)homePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(scene==='playing')pause();else if(mode==='home'&&!home.paused)homePause();}});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(scene!=='playing'&&scene!=='home')return;b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.key);syncInput();b.classList.add('down');});const release=e=>{pointers.delete(e.pointerId);syncInput();if(![...pointers.values()].includes(b.dataset.key))b.classList.remove('down');};['pointerup','pointercancel','lostpointercapture'].forEach(name=>b.addEventListener(name,release));b.addEventListener('contextmenu',e=>e.preventDefault());});
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(mode==='home'){home.renderDelta=dt||1/60;if(typeof home3DLookUpdate==='function')home3DLookUpdate(dt||0);let remaining=dt||0;while(remaining>0){const step=Math.min(remaining,1/120);homeUpdate(step);remaining-=step;}homeDraw();requestAnimationFrame(frame);return;}if(scene==='playing'){accumulator+=dt;while(accumulator>=1/120){update(1/120);accumulator-=1/120;}}else accumulator=0;draw();requestAnimationFrame(frame);}
$('mode-switch').onclick=()=>mode==='home'?homeLeave():homeStart();$('home-switch').onclick=homeSwitch;$('home-map-toggle').onclick=()=>{home.mapExpanded=!home.mapExpanded;$('home-map-toggle').setAttribute('aria-pressed',String(home.mapExpanded));};$('home-zoom').onclick=()=>{home.view=home.view==='eyes'?'follow':'eyes';$('home-zoom').textContent=home.view==='eyes'?'視角：貓咪':'視角：跟隨';};window.addEventListener('resize',homeResize);window.addEventListener('pagehide',homeSave);
reset(0);title();requestAnimationFrame(frame);
// Preserve the existing optional browser-assistant integration.
if(document.modelContext?.registerTool){const life=new AbortController();const reg=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:life.signal})).catch(()=>{});}catch{}};reg({name:'read_cat_game',description:'Read the current cat cooperative game progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({scene,mode,home:mode==='home'?{activeCat:home.active===0?'曾萊恩':'曾辛巴',cats:home.cats.map(c=>({hunger:Math.round(c.hunger),water:Math.round(c.water),room:homeRoom(c)?.name,status:c.status}))}:null,chapter:level+1,chapters:chapters.length,fish:l.fish.filter(f=>f.got).length,fishTotal:l.fish.length,seconds:Math.floor(elapsed),splitScreen:split,checkpoint,completedChapters:Object.keys(record).length})});reg({name:'start_cat_game',description:'Start a new two-player cat adventure, resetting the current run.',inputSchema:{type:'object',properties:{confirm:{type:'boolean',const:true}},required:['confirm'],additionalProperties:false},execute:input=>{if(input?.confirm!==true)throw new Error('confirm must be true');start();return{scene,chapter:1};}});window.addEventListener('pagehide',()=>life.abort(),{once:true});}
