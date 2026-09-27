'use strict';
// Video-informed home: 1 world unit = 0.62 cm. Dimensions are estimated, not scanned.
// Opaque, full-height rooms and a cat-eye perspective are rendered by home3d.js.
const HOME_LAYOUT={width:2040,height:1360,rooms:[
 {id:'living',name:'客廳',x:0,y:0,w:850,d:740,color:'#b69370',floor:'wood'},
 {id:'hall',name:'走廊',x:850,y:0,w:320,d:1360,color:'#c3a17c',floor:'wood'},
 {id:'kitchen',name:'廚房',x:1170,y:0,w:470,d:510,color:'#c3a183',floor:'wood'},
 {id:'bath',name:'淋浴間',x:1640,y:0,w:400,d:510,color:'#695d57',floor:'tile'},
 {id:'bedroom',name:'臥室',x:0,y:740,w:850,d:620,color:'#ddd5bb',floor:'tile'},
 {id:'laundry',name:'洗衣區',x:1170,y:510,w:430,d:370,color:'#d9d9c9',floor:'tile'},
 {id:'ensuite',name:'衛浴',x:1170,y:880,w:430,d:480,color:'#e6dfc9',floor:'tile'},
 {id:'balcony',name:'陽台',x:1600,y:510,w:440,d:850,color:'#d8c9b3',floor:'tile'}]};
let home=null;
function homeFurniture(){const f=[];
 const add=(id,x,y,w,d,h,color,type='block',extra={})=>{f.push({id,x,y,w,d,h,z:0,color,type,solid:true,...extra});return f.at(-1);};
 // The green L sofa, low wood table and pale blinds follow the supplied walkthrough.
 add('sofa-back',100,120,370,90,62,'#93a868','sofa');add('sofa-seat',100,210,370,95,34,'#abc083','sofa');add('sofa-chaise',100,305,110,155,34,'#a8bc7f','sofa');
 add('coffee',285,335,215,125,40,'#b9976d','table');add('tv-low',635,95,135,65,38,'#847560','cabinet');add('tv',650,105,108,12,80,'#354746','screen',{z:38,solid:false});
 add('rug',300,490,295,120,1,'#899c82','rug',{solid:false});
 // Cat tree: one-way landings spaced within the cats' jump reach.
 add('tree-base',605,335,140,150,9,'#9b8871','treebase');
 add('tree-post-a',635,360,17,17,170,'#c2a276','post');add('tree-post-b',702,423,17,17,142,'#c2a276','post');
 add('tree-step1',575,430,105,90,8,'#b5a9d2','platform',{z:40,oneway:true,solid:false});
 add('tree-step2',650,363,100,90,8,'#cbc2e2','platform',{z:88,oneway:true,solid:false});
 add('tree-step3',600,293,105,95,8,'#a6cdb4','platform',{z:136,oneway:true,solid:false});
 add('tree-top',680,270,88,83,8,'#d0c6e6','platform',{z:178,oneway:true,solid:false});
 add('scratch',400,580,40,40,65,'#bfaa80','post');add('tunnel',210,585,135,63,35,'#acbca1','tunnel');
 add('feeder',710,620,48,52,70,'#e5e8df','feeder');add('fountain',625,625,54,52,20,'#b3dbe0','water');
 // White kitchen cabinetry, compact sink, fridge and the laundry area from the film.
 add('kitchen-counter',1200,80,360,90,80,'#e1e2d8','counter');add('sink',1255,100,90,52,5,'#819b9b','sink',{z:80,solid:false});
 add('stove',1450,102,75,50,4,'#4a5555','stove',{z:80,solid:false});add('fridge',1490,330,100,120,157,'#d4dddd','fridge');
 add('kitchen-stool',1250,240,65,65,33,'#be9a6b','stool');
 add('shelf-k1',1330,210,80,70,8,'#b5d0b7','platform',{z:48,oneway:true,solid:false});add('shelf-k2',1430,225,85,65,8,'#cec1df','platform',{z:98,oneway:true,solid:false});
 add('washer',1420,540,112,102,90,'#dedfd9','washer');add('laundry-basket',1210,560,74,72,45,'#b8a47f','basket');
 // Bedroom: pink low mattress, white/grey wardrobe, added cat steps and hammock.
 add('bed-base',140,910,350,260,22,'#74554b','bed');add('mattress',140,910,350,260,18,'#d38e9f','mattress',{z:22});
 add('pillow',164,930,100,45,11,'#eac5ce','pillow',{z:40,solid:false});add('pillow2',292,930,100,45,11,'#eac5ce','pillow',{z:40,solid:false});
 add('wardrobe',55,780,300,70,180,'#d9d9d2','wardrobe');
 add('bed-step',550,1140,82,82,22,'#c6b695','stool');add('cat-hammock',590,925,110,95,38,'#a9bdaf','hammock');
 add('bed-shelf1',540,820,90,70,8,'#bdadd5','platform',{z:40,oneway:true,solid:false});add('bed-shelf2',640,805,85,70,8,'#b4d1ba','platform',{z:88,oneway:true,solid:false});
 add('bed-feeder',710,1210,48,52,70,'#e6e7e0','feeder');add('bed-water',610,1210,54,52,20,'#a9d7de','water');
 // Two distinct washrooms and the red lattice balcony parapet.
 add('shower',1760,60,200,190,8,'#81716b','shower');add('toilet-a',1700,365,65,92,38,'#ede8d9','toilet');add('sink-a',1690,75,65,65,68,'#e1e3d7','sink');
 add('toilet-b',1460,1200,65,92,38,'#eee9d8','toilet');add('sink-b',1215,1195,90,70,68,'#e9e4d5','sink');
 add('balcony-bench',1790,920,110,210,34,'#91ae91','bench');add('balcony-tree1',1770,600,80,75,8,'#baa2ca','platform',{z:40,oneway:true,solid:false});add('balcony-tree2',1850,675,80,75,8,'#aad0ba','platform',{z:88,oneway:true,solid:false});
 add('plant-a',1880,550,70,70,50,'#638667','plant');add('plant-b',1860,1205,85,65,55,'#769368','plant');
 // Real-world height estimates (world units × .62 = centimeters).
 const heights={'sofa-back':140,'sofa-seat':68,'sofa-chaise':68,coffee:64,'tv-low':68,'kitchen-counter':140,fridge:285,washer:145,wardrobe:350,'bed-base':36,mattress:28,'kitchen-stool':70,'bed-step':36,'cat-hammock':65,'balcony-bench':70};
 for(const b of f){if(heights[b.id])b.h=heights[b.id];if(b.type==='feeder')b.h=65;if(b.id==='mattress')b.z=36;if(b.type==='pillow')b.z=64;if(b.id==='sink'||b.id==='stove')b.z=140;if(b.id==='tv')b.z=68;if(b.type==='toilet')b.h=65;if(b.id==='sink-a'||b.id==='sink-b')b.h=130;}
 // Wall-mounted routes: a climb from floor to broad resting decks, then walkable ledges.
 const ledge=(id,x,y,w,d,top)=>add(id,x,y,w,d,8,'#c8a778','catwalk',{z:top-8,oneway:true,solid:false});
 ledge('living-wall-step1',744,320,82,82,70);
 ledge('living-wall-step2',752,230,82,82,145);
 ledge('living-wall-step3',752,140,82,82,220);
 ledge('living-wall-deck',710,22,124,120,290);
 ledge('living-wall-run',410,22,304,64,290);
 ledge('living-wall-gap',240,22,104,64,290);
 ledge('living-wall-rest',48,22,160,100,290);
 ledge('bed-wall-step1',746,860,82,82,72);
 ledge('bed-wall-step2',746,775,82,76,148);
 ledge('bed-wall-step3',650,758,88,76,222);
 ledge('bed-wall-deck',515,758,116,76,295);
 ledge('bed-wall-run',365,758,150,76,295);
 ledge('bed-wall-window',365,835,72,110,295);
 return f;
}
function homeWalls(){const walls=[];const v=(x,a,b)=>walls.push({x:x-8,y:a,w:16,d:b-a,h:435});const h=(y,a,b)=>walls.push({x:a,y:y-8,w:b-a,d:16,h:435});
 // Perimeter is collision-only at the front; the cutaway view keeps the cats visible.
 v(0,0,1360);v(2040,0,1360);h(0,0,2040);h(1360,0,2040);
 v(850,0,535);v(850,655,1010);v(850,1130,1360);h(740,0,850);
 v(1170,0,270);v(1170,390,590);v(1170,710,1020);v(1170,1140,1360);
 v(1640,0,210);v(1640,330,510);h(510,1170,1280);h(510,1400,2040);
 h(880,1170,1600);v(1600,510,650);v(1600,770,1360);
 return walls;
}
function makeHome(){return{active:0,time:0,saveTimer:0,zoom:1,yaw:-2.05,pitch:-.18,view:'follow',camera:{x:0,y:0},paused:false,hint:'歡迎回家！先試試走動、跳上沙發，再去吃點東西。',hintTime:5,
 cats:[{x:470,y:535,z:0,vz:0,dir:1,hunger:20,water:85,ground:true,jumpWas:false,useWas:false,action:null,ai:null,status:'你在操控'},
       {x:535,y:555,z:0,vz:0,dir:-1,hunger:28,water:78,ground:true,jumpWas:false,useWas:false,action:null,ai:null,status:'四處看看'}],
 furniture:homeFurniture(),walls:homeWalls(),doors:[
 {id:'living-door',name:'客廳門',x:850,y:535,w:16,d:120,axis:'y',open:false},
 {id:'bed-door',name:'臥室門',x:850,y:1010,w:16,d:120,axis:'y',open:false},
 {id:'kitchen-door',name:'廚房門',x:1170,y:270,w:16,d:120,axis:'y',open:true},
 {id:'laundry-door',name:'洗衣區門',x:1170,y:590,w:16,d:120,axis:'y',open:true},
 {id:'bath-door',name:'淋浴間門',x:1640,y:210,w:16,d:120,axis:'y',open:false},
 {id:'inner-kitchen',name:'廚房拉門',x:1280,y:510,w:120,d:16,axis:'x',open:true},
 {id:'ensuite-door',name:'衛浴門',x:1170,y:1020,w:16,d:120,axis:'y',open:false},
 {id:'balcony-door',name:'陽台門',x:1600,y:650,w:16,d:120,axis:'y',open:false}],
 stations:[{id:'food1',type:'eat',x:705,y:694,name:'客廳自動餵食機'},{id:'water1',type:'drink',x:644,y:697,name:'客廳自動飲水機'},
 {id:'food2',type:'eat',x:747,y:1288,name:'臥室自動餵食機'},{id:'water2',type:'drink',x:637,y:1288,name:'臥室自動飲水機'}],
 toys:[{x:420,y:515,vx:0,vy:0,color:'#e7b1c5'},{x:540,y:630,vx:0,vy:0,color:'#a8d9db'},{x:530,y:1030,vx:0,vy:0,color:'#e8c782'}],
 visits:new Set(['living']),navRevision:0};}
function homeRoom(c){return HOME_LAYOUT.rooms.find(r=>c.x>=r.x&&c.x<r.x+r.w&&c.y>=r.y&&c.y<r.y+r.d);}
function homeSay(s){home.hint=s;home.hintTime=5;$('announcement').textContent=s;}
function homeRectHit(x,y,radius,b){return x+radius>b.x&&x-radius<b.x+b.w&&y+radius>b.y&&y-radius<b.y+b.d;}
function homeBlocked(x,y,z=0,ignoreDoors=false,ignoreFurniture=null){
 if(x<20||y<20||x>HOME_LAYOUT.width-20||y>HOME_LAYOUT.height-20)return true;
 if(home.walls.some(b=>homeRectHit(x,y,11,b)))return true;
 if(!ignoreDoors&&home.doors.some(b=>!b.open&&homeRectHit(x,y,11,b)))return true;
 if(home.doors.some(b=>b.open&&homeRectHit(x,y,11,{x:b.x,y:b.y,w:b.axis==='y'?111:10,d:b.axis==='y'?10:111})))return true;
 return home.furniture.some(b=>{if(!b.solid||b.oneway||b.id===ignoreFurniture||z>=b.z+b.h-2||z+32<=b.z+2||!homeRectHit(x,y,11,b))return false;if(b.type==='table'&&z+32<=b.h-9)return [8,b.w-20].some(dx=>[8,b.d-20].some(dy=>homeRectHit(x,y,11,{x:b.x+dx,y:b.y+dy,w:12,d:12})));return true;});
}
function homeSupport(c){let top=0;for(const f of home.furniture)if(homeRectHit(c.x,c.y,10,f)&&c.z>=f.z+f.h-3)top=Math.max(top,f.z+f.h);return top;}
function homeDoorNear(c){return home.doors.filter(d=>Math.hypot(c.x-(d.x+d.w/2),c.y-(d.y+d.d/2))<82).sort((a,b)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];}
function homeJump(c){if(c.ground){c.vz=500;c.ground=false;c.status='跳！';tone(530,.04);return true;}return false;}
function homeUse(c,i,automatic=false){const door=homeDoorNear(c);
 if(door){if(!door.open&&c.z<104){if(!automatic)homeSay('門把在上面：靠近門，跳起來再按「互動」。');return false;}
  if(door.open&&automatic)return false;
  if(door.open&&home.cats.some(cat=>homeRectHit(cat.x,cat.y,22,door))){if(!automatic)homeSay('先離開門口，才可以關門。');return false;}
  door.open=!door.open;home.navRevision++;if(!automatic)homeSay(door.name+(door.open?'打開了！':'關好了。'));return true;}
 const station=home.stations.filter(s=>Math.hypot(c.x-s.x,c.y-s.y)<68&&c.z<25).sort((a,b)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
 if(station){c.action={type:station.type,station:station.id};c.status=station.type==='eat'?'吃罐罐':'喝水';if(!automatic)homeSay(station.type==='eat'?'餵食機補好餐了，慢慢吃。':'咕嚕咕嚕…水分正在補充。');return true;}
 const ball=home.toys.find(t=>Math.hypot(c.x-t.x,c.y-t.y)<80);
 if(ball){const angle=Math.atan2(ball.y-c.y,ball.x-c.x);ball.vx=Math.cos(angle)*260;ball.vy=Math.sin(angle)*260;c.status='拍球球';if(!automatic)homeSay('球球滾走了，追上去！');return true;}
 const scratch=home.furniture.find(f=>['post','hammock','bed','sofa','tunnel'].includes(f.type)&&Math.hypot(c.x-(f.x+f.w/2),c.y-(f.y+f.d/2))<90);
 if(scratch){c.action={type:scratch.type==='post'?'scratch':'rest',remaining:3};c.status=scratch.type==='post'?'磨磨爪子':'舒服地休息';return true;}
 if(!automatic)homeSay('靠近餵食機、飲水機或玩具按互動；門把要跳起來才能拉。');return false;
}
// Cardinal A* with expanded furniture/wall clearance. Closed doors remain on the route:
// the autonomous cat jumps to their handles before attempting to cross.
function homePath(start,target,ignoreFurniture=null){const step=34,cols=60,rows=40;
 const cell=(x,y)=>({x:clamp(Math.floor(x/step),0,cols-1),y:clamp(Math.floor(y/step),0,rows-1)});
 const a=cell(start.x,start.y),b=cell(target.x,target.y),idx=(x,y)=>y*cols+x,unpack=id=>({x:id%cols,y:Math.floor(id/cols)}),center=n=>({x:n.x*step+step/2,y:n.y*step+step/2});
 const navKey=home.doors.map(d=>Number(d.open)).join('')+':'+(ignoreFurniture||'');if(!home.navGrids)home.navGrids=new Map();let grid=home.navGrids.get(navKey);if(!grid){if(home.navGrids.size>18)home.navGrids.clear();grid=new Uint8Array(cols*rows);home.navGrids.set(navKey,grid);}const pass=n=>{const k=idx(n.x,n.y);if(grid[k])return grid[k]===1;const p=center(n),free=!homeBlocked(p.x,p.y,0,true,ignoreFurniture);grid[k]=free?1:2;return free;};
 let goal=b;if(!pass(goal)){let best=null;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const n={x:b.x+dx,y:b.y+dy};if(n.x>=0&&n.y>=0&&n.x<cols&&n.y<rows&&pass(n)){const distance=Math.abs(dx)+Math.abs(dy);if(!best||distance<best.distance)best={...n,distance};}}if(!best)return[];goal=best;}
 const aid=idx(a.x,a.y),bid=idx(goal.x,goal.y),open=[aid],came=new Map(),g=new Map([[aid,0]]),closed=new Set();
 while(open.length&&closed.size<2400){let pick=0;for(let k=1;k<open.length;k++){const n=unpack(open[k]),v=unpack(open[pick]);if(g.get(open[k])+Math.abs(n.x-goal.x)+Math.abs(n.y-goal.y)<g.get(open[pick])+Math.abs(v.x-goal.x)+Math.abs(v.y-goal.y))pick=k;}
  const current=open.splice(pick,1)[0];if(current===bid){const result=[];let n=current;while(n!==aid){result.push(center(unpack(n)));n=came.get(n);}return result.reverse();}closed.add(current);const c=unpack(current);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:c.x+dx,y:c.y+dy},id=idx(n.x,n.y);if(n.x<0||n.y<0||n.x>=cols||n.y>=rows||closed.has(id)||!pass(n))continue;const score=g.get(current)+1;if(score<(g.get(id)??Infinity)){came.set(id,current);g.set(id,score);if(!open.includes(id))open.push(id);}}
 }return[];
}
function homePlan(c){
 let target,kind='wander',perch=null;
 if(c.water<60||c.hunger>58){kind=c.water<60?'drink':'eat';target=home.stations.filter(s=>s.type===kind).sort((a,b)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];}
 else{const n=Math.random();if(n<.30){kind='toy';target=home.toys[Math.floor(Math.random()*home.toys.length)];}
 else if(n<.55){kind='perch';const options=home.furniture.filter(f=>['sofa','table','bed','bench','stool','hammock'].includes(f.type)&&f.z+f.h<=72);perch=options[Math.floor(Math.random()*options.length)];target={x:perch.x+perch.w/2,y:perch.y+perch.d/2};}
 else{const spots=[{x:535,y:525},{x:750,y:485},{x:970,y:830},{x:1040,y:1170},{x:1300,y:385},{x:1820,y:835},{x:540,y:1190},{x:1790,y:300},{x:1335,y:1090}];target=spots[Math.floor(Math.random()*spots.length)];}}
 c.ai={kind,target:{x:target.x,y:target.y},perch:perch?.id,path:homePath(c,target,perch?.id),timer:0,idle:0,stuck:0,lastX:c.x,lastY:c.y};c.status={wander:'四處巡邏',toy:'想玩球球',perch:'找個高處',eat:'肚子餓了，找飯吃',drink:'口渴了，找水喝'}[kind];
}
function homeAI(c,dt){if(!c.ai)homePlan(c);const a=c.ai;a.timer+=dt;
 if(c.action){if(c.action.type==='eat'&&c.hunger<=5||c.action.type==='drink'&&c.water>=97){c.action=null;c.ai=null;}return{dx:0,dy:0,jump:false,use:false};}
 if(a.idle>0){a.idle-=dt;if(a.idle<=0)c.ai=null;return{dx:0,dy:0,jump:false,use:false};}
 if(a.timer>22){c.ai=null;return{dx:0,dy:0,jump:false,use:false};}
 const nearDoor=homeDoorNear(c);if(nearDoor&&!nearDoor.open){if(c.ground)homeJump(c);if(c.z>=104)homeUse(c,1-home.active,true);}
 let point=a.path[0]||a.target;
 if(a.path.length&&Math.hypot(c.x-point.x,c.y-point.y)<23){a.path.shift();point=a.path[0]||a.target;}
 const dist=Math.hypot(c.x-a.target.x,c.y-a.target.y);
 let jump=a.kind==='perch'&&dist<100&&c.ground&&c.z<20;
 if(dist<((a.kind==='eat'||a.kind==='drink')?20:43)){if(a.kind==='eat'||a.kind==='drink'){homeUse(c,1-home.active,true);a.idle=.3;}
 else if(a.kind==='toy'){homeUse(c,1-home.active,true);a.idle=1.2;}
 else if(a.kind==='perch'){if(c.ground&&c.z>15){a.idle=2.5;c.status='在高處看看';}else jump=c.ground;}
 else{a.idle=1.5+Math.random()*2;if(Math.random()<.35)jump=true;c.status='看看你在做什麼';}}
 if(c.action||a.idle>0)return{dx:0,dy:0,jump,use:false};
 if(Math.hypot(c.x-a.lastX,c.y-a.lastY)<.15){a.stuck+=dt;if(a.stuck>.65)jump=true;if(a.stuck>2.4){a.path=homePath(c,a.target,a.perch);a.stuck=0;}}else a.stuck=0;a.lastX=c.x;a.lastY=c.y;
 const angle=Math.atan2(point.y-c.y,point.x-c.x);return{dx:Math.cos(angle),dy:Math.sin(angle),jump,use:false};
}
function homeSwitch(){if(!home)return;home.active=1-home.active;home.cameraRig=null;home.lookDrag=null;home.lookTarget=null;home.cats.forEach(c=>{c.ai=null;c.action=null;c.useWas=false;c.jumpWas=false;});clearInput();homeSay('現在操控'+(home.active?'曾辛巴':'曾萊恩')+'，'+(home.active?'萊恩':'辛巴')+'會自己活動。');homeUpdateHUD();}
function homeUpdate(dt){if(!home||home.paused)return;home.time+=dt;home.hintTime=Math.max(0,home.hintTime-dt);
 home.cats.forEach((c,i)=>{c.hunger=clamp(c.hunger+dt*.10,0,100);c.water=clamp(c.water-dt*.13,0,100);
  let input;if(i===home.active){const sx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),sy=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
   // Keyboard/touch directions follow the screen, not the rotated floor axes.
   let dx=typeof home3DMovement==='function'?home3DMovement(sx,sy).dx:(sx+sy)*.7071,dy=typeof home3DMovement==='function'?home3DMovement(sx,sy).dy:(sy-sx)*.7071;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}input={dx,dy,jump:keys.has('Space'),use:keys.has('KeyE')};
  }else input=homeAI(c,dt);
  const moving=Math.hypot(input.dx,input.dy)>.1;c.moving=moving;if(moving)c.action=null;
  if(input.jump&&!c.jumpWas)homeJump(c);c.jumpWas=input.jump;
  if(input.use&&!c.useWas){const used=homeUse(c,i);c.useWas=used||!homeDoorNear(c)||homeDoorNear(c).open;}if(!input.use)c.useWas=false;
  const speed=154*(c.water<15||c.hunger>90?.72:1),nx=c.x+input.dx*speed*dt,ny=c.y+input.dy*speed*dt;
  if(!homeBlocked(nx,c.y,c.z))c.x=nx;if(!homeBlocked(c.x,ny,c.z))c.y=ny;
  if(moving){c.heading=Math.atan2(input.dy,input.dx);c.dir=input.dx-input.dy>=0?1:-1;if(i===home.active)c.status=c.z>5?'跳躍中':'自由探索';}
  const oldZ=c.z;c.vz-=1100*dt;c.z+=c.vz*dt;for(const f of home.furniture)if(f.type==='table'&&homeRectHit(c.x,c.y,12,f)&&c.vz>0&&oldZ+32<=f.h-9&&c.z+32>f.h-9){c.z=f.h-9-32;c.vz=0;}if(c.z>379){c.z=379;c.vz=Math.min(0,c.vz);}c.ground=false;let landing=0;
  for(const f of home.furniture){const top=f.z+f.h;if(homeRectHit(c.x,c.y,10,f)&&c.vz<=0&&oldZ>=top-.6&&c.z<=top)landing=Math.max(landing,top);}
  if(c.z<=landing){c.z=landing;c.vz=0;c.ground=true;}
  if(c.action){if(c.action.type==='eat'){c.hunger=Math.max(0,c.hunger-13*dt);c.status='吃飯中';if(c.hunger===0)c.action=null;}
   else if(c.action.type==='drink'){c.water=Math.min(100,c.water+17*dt);c.status='喝水中';if(c.water===100)c.action=null;}
   else{c.action.remaining-=dt;if(c.action.remaining<=0)c.action=null;}}
  const room=homeRoom(c);if(room)home.visits.add(room.id);
  for(const t of home.toys)if(c.z<25&&Math.hypot(c.x-t.x,c.y-t.y)<33&&moving){t.vx=input.dx*205;t.vy=input.dy*205;}
 });
 for(const t of home.toys){const nx=t.x+t.vx*dt,ny=t.y+t.vy*dt;if(homeBlocked(nx,t.y,0))t.vx*=-.65;else t.x=nx;if(homeBlocked(t.x,ny,0))t.vy*=-.65;else t.y=ny;t.vx*=Math.pow(.20,dt);t.vy*=Math.pow(.20,dt);}
 home.saveTimer+=dt;if(home.saveTimer>5){home.saveTimer=0;homeSave();}home.hudTimer=(home.hudTimer||0)+dt;if(home.hudTimer>=.1){home.hudTimer=0;homeUpdateHUD();}
}
function homeSave(){if(!home)return;try{localStorage.setItem('cat-home-v1',JSON.stringify({active:home.active,cats:home.cats.map(c=>({x:c.x,y:c.y,z:c.z,hunger:c.hunger,water:c.water})),doors:home.doors.map(d=>({id:d.id,open:d.open})),visits:[...home.visits]}));}catch{}}
function homeLoad(){home=makeHome();try{const saved=JSON.parse(localStorage.getItem('cat-home-v1')||'null');if(saved&&Array.isArray(saved.cats)&&saved.cats.length===2){home.active=saved.active===1?1:0;saved.cats.forEach((s,i)=>{if(Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.z)&&s.x>20&&s.y>20&&s.x<2020&&s.y<1340){Object.assign(home.cats[i],{x:s.x,y:s.y,z:clamp(s.z,0,420),hunger:clamp(Number(s.hunger)||0,0,100),water:clamp(Number(s.water)||0,0,100)});}});for(const d of home.doors){const old=saved.doors?.find(x=>x.id===d.id);if(old)d.open=Boolean(old.open);}home.visits=new Set(Array.isArray(saved.visits)?saved.visits:['living']);}}catch{}
 for(const c of home.cats)if(homeBlocked(c.x,c.y,c.z)){c.x=470;c.y=535;c.z=0;}}
function homeStart(){if(!home)homeLoad();if(typeof home3DInit==='function')home3DInit();if(mode!=='home')home.adventureScene=scene;mode='home';scene='home';home.paused=false;homeResize();const camera=homeProject(home.cats[home.active].x,home.cats[home.active].y);home.camera={...camera};clearInput();$('overlay').classList.add('hidden');document.body.classList.add('home-mode');if(typeof home3DResize==='function')home3DResize();$('mode-switch').textContent='闖關模式';$('stat-label').textContent='已探索';$('restart').setAttribute('aria-label','回到客廳');$('home-panel').hidden=false;$('home-touch').hidden=false;$('camera').hidden=true;$('level-select').hidden=true;$('puzzle-help').hidden=true;homeUpdateHUD();$('home-zoom').textContent=home.view==='follow'?'視角：跟隨':'視角：貓咪';homeSay('畫面往上拖可抬頭、往下拖低頭；WASD 前後左右走。跳躍時按住互動拉門把；木階通往牆上貓道。');}
function homeLeave(){homeSave();if(typeof home3DHide==='function')home3DHide();mode='adventure';canvas.height=480;ctx.imageSmoothingEnabled=false;$('mode-switch').textContent='自由模式';$('stat-label').textContent='小魚乾';$('restart').setAttribute('aria-label','重新開始本關');document.body.classList.remove('home-mode');$('home-panel').hidden=true;$('home-touch').hidden=true;$('camera').hidden=false;$('level-select').hidden=false;$('puzzle-help').hidden=false;clearInput();$('chapter').textContent=String(level+1).padStart(2,'0');$('level-title').textContent=l.name;updateHUD();if(home.adventureScene==='won'){scene='won';renderWin();}else if(home.adventureScene&&home.adventureScene!=='title'){scene='playing';pause();}else title();}
function homeUpdateHUD(){if(!home)return;const c=home.cats[home.active],other=home.cats[1-home.active],room=homeRoom(c);$('chapter').textContent='HOME';$('level-title').textContent=(room?.name||'家裡')+' · '+(home.active?'曾辛巴':'曾萊恩');$('fish-count').textContent=home.visits.size+' / '+HOME_LAYOUT.rooms.length;$('timer').textContent=format(home.time);$('checkpoint-status').textContent='單人自由模式';$('view-status').textContent='另一隻由電腦控制';
 home.cats.forEach((cat,i)=>{$('home-hunger-'+i).value=cat.hunger;$('home-water-'+i).value=cat.water;$('home-needs-'+i).textContent='飢餓 '+Math.round(cat.hunger)+' · 水分 '+Math.round(cat.water);$('home-role-'+i).textContent=i===home.active?'你在操控':'電腦 · '+cat.status;});
 $('home-switch').textContent='切換成'+(home.active?'萊恩':'辛巴')+'（C）';let hint=home.hintTime>0?home.hint:'WASD 移動 · 拖曳畫面轉頭 · 空白鍵跳 · E 互動 · C 切換';if(home.hintTime<=0){const door=homeDoorNear(c);const station=home.stations.filter(s=>Math.hypot(c.x-s.x,c.y-s.y)<75).sort((a,b)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(door)hint=door.open?'E 關門（先離開門口）':'靠近門把，跳躍時按住 E／互動，伸爪拉下把手。';else if(station)hint='E '+(station.type==='eat'?'到自動餵食機吃飯，降低飢餓度。':'到自動飲水機喝水，補充水分。');}
 $('mission-text').textContent=hint;
}
function homeProject(x,y,z=0){return{x:(x-y)*.72,y:(x+y)*.40-z*.92};}
function homeShade(hex,n){const v=parseInt(hex.slice(1),16);return '#'+[v>>16,(v>>8)&255,v&255].map(c=>clamp(c+n,0,255).toString(16).padStart(2,'0')).join('');}
function homePolygon(points,fill,stroke=null){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function homeBox(b,color=b.color,alpha=1){const z=b.z||0,h=b.h||0,p=(x,y,t)=>homeProject(x,y,t),a=p(b.x,b.y,z+h),bb=p(b.x+b.w,b.y,z+h),c=p(b.x+b.w,b.y+b.d,z+h),d=p(b.x,b.y+b.d,z+h),e=p(b.x+b.w,b.y,z),f=p(b.x+b.w,b.y+b.d,z),g=p(b.x,b.y+b.d,z);ctx.save();ctx.globalAlpha*=alpha;
 homePolygon([bb,e,f,c],homeShade(color,-29),homeShade(color,-45));homePolygon([d,c,f,g],homeShade(color,-14),homeShade(color,-38));homePolygon([a,bb,c,d],homeShade(color,10),homeShade(color,-35));ctx.restore();}
function homeFloor(){homeBox({x:0,y:0,w:2040,d:1360,z:-14,h:12,color:'#817361'});
 for(const r of HOME_LAYOUT.rooms){homePolygon([[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>homeProject(x,y)),r.color,'#756956');
  ctx.save();ctx.beginPath();[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.d],[r.x,r.y+r.d]].map(([x,y])=>homeProject(x,y)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.strokeStyle=homeShade(r.color,r.floor==='wood'?-13:-20);ctx.lineWidth=1;
  if(r.floor==='wood'){for(let y=r.y;y<r.y+r.d;y+=43){const a=homeProject(r.x,y),b=homeProject(r.x+r.w,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();for(let x=r.x+(Math.floor(y/43)%2)*100;x<r.x+r.w;x+=200){const a=homeProject(x,y),b=homeProject(x,y+43);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
  else{for(let y=r.y;y<r.y+r.d;y+=72){const a=homeProject(r.x,y),b=homeProject(r.x+r.w,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(let x=r.x;x<r.x+r.w;x+=72){const a=homeProject(x,r.y),b=homeProject(x,r.y+r.d);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
  ctx.restore();const pos=homeProject(r.x+r.w/2,r.y+r.d/2);label(r.name,pos.x,pos.y,'#554d4399',22);
 }
}
function homeDrawFurniture(f){if(f.type==='table'){for(const x of [10,f.w-25])for(const y of [10,f.d-25])homeBox({x:f.x+x,y:f.y+y,w:13,d:13,z:0,h:f.h-6,color:'#675d4b'});homeBox({...f,z:f.h-6,h:6});return;}const active=home.cats[home.active],near=Math.hypot(active.x-(f.x+f.w/2),active.y-(f.y+f.d/2))<230;homeBox(f,f.color,f.h>115&&near?.48:1);
 const extra=(dx,dy,w,d,z,h,color)=>homeBox({x:f.x+dx,y:f.y+dy,w,d,z:(f.z||0)+z,h,color});
 if(f.type==='sofa'){for(let x=12;x<f.w-25;x+=82)extra(x,12,3,f.d-24,f.h,1,'#c0ce96');}
 if(f.type==='table'){for(const x of [10,f.w-25])for(const y of [10,f.d-25])extra(x,y,13,13,0,f.h,'#675d4b');}
 if(f.type==='post')for(let z=12;z<f.h;z+=12)extra(-1,-1,f.w+2,f.d+2,z,2,'#a28562');
 if(f.type==='feeder'){extra(8,9,32,35,f.h,7,'#d0d4ce');extra(12,f.d-3,25,4,22,16,'#4e605a');extra(8,f.d+3,36,27,0,6,'#97af9c');for(let k=0;k<5;k++)extra(13+(k%3)*8,f.d+8+Math.floor(k/3)*8,5,5,6,3,'#a47949');extra(17,f.d-1,10,3,50,4,'#a6dba0');}
 if(f.type==='water'){extra(5,5,f.w-10,f.d-10,f.h,3,'#73b4c9');extra(22,18,10,10,f.h,9,'#d9eeee');const p=homeProject(f.x+27,f.y+28,f.h+8);ctx.strokeStyle='#e3f5f0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,12+Math.sin(home.time*4)*3,5,0,0,Math.PI*2);ctx.stroke();}
 if(f.type==='wardrobe'){extra(100,0,70,f.d,f.h-178,178,'#58606b');extra(245,f.d,6,3,75,35,'#8d918d');extra(82,f.d,6,3,75,35,'#8d918d');}
 if(f.type==='fridge'){extra(2,f.d,96,2,72,3,'#969f9d');extra(75,f.d,5,3,90,37,'#7d8b89');}
 if(f.type==='sink'){extra(10,8,f.w-20,f.d-16,f.h,2,'#91aaa9');extra(f.w/2,2,5,5,f.h,23,'#bac8c3');}
 if(f.type==='stove'){for(let k=0;k<2;k++)extra(9+k*35,10,23,27,4,2,'#232e30');}
 if(f.type==='washer'){extra(20,f.d,70,3,22,51,'#64777e');extra(28,f.d+3,54,3,29,37,'#a5c3ca');extra(12,f.d,90,3,73,8,'#aeb8b6');}
 if(f.type==='toilet'){extra(5,-8,f.w-10,24,15,42,'#e3e5d7');extra(12,32,f.w-24,42,f.h,2,'#bbc5bd');}
 if(f.type==='mattress'){for(let x=15;x<f.w-20;x+=65)for(let y=90;y<f.d-15;y+=60)extra(x,y,10,10,f.h,1,'#e6b2bd');}
 if(f.type==='hammock'){extra(-3,-3,8,f.d+6,0,55,'#af9673');extra(f.w-5,-3,8,f.d+6,0,55,'#af9673');extra(10,10,f.w-20,f.d-20,32,5,'#c5d5c3');}
 if(f.type==='tunnel'){extra(0,f.d-2,37,4,3,24,'#56695c');extra(f.w-37,f.d-2,37,4,3,24,'#56695c');}
 if(f.type==='plant'){extra(7,6,f.w-14,f.d-12,0,32,'#a77d61');extra(16,14,f.w-30,f.d-28,32,26,'#69946e');}
}
function homeDrawCat(c,i){const pos=homeProject(c.x,c.y,c.z),shadow=homeProject(c.x,c.y,Math.max(0,c.z-Math.max(0,c.vz)*.1));ctx.save();ctx.fillStyle=i===home.active?'#e7ebbc66':'#383e3444';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,27,12,0,0,Math.PI*2);ctx.fill();
 ctx.translate(pos.x,pos.y);ctx.scale(c.dir,1);const im=sprites[i];const bob=c.ground&&c.status==='自由探索'?Math.sin(home.time*16)*1.3:0;if(im.complete&&im.naturalWidth)ctx.drawImage(im,-39,-53+bob,78,53);ctx.restore();label((i?'辛巴':'萊恩')+(i===home.active?' · 你':' · 自動'),pos.x,pos.y-64,i?'#ffe1b3':'#edffd8',14);
 if(c.action){const words={eat:'吃飯',drink:'喝水',scratch:'磨爪',rest:'休息'};label(words[c.action.type]||'',pos.x,pos.y-84,'#fff2c8',13);}}
function homeDrawDoor(d){if(d.open){homeBox({x:d.x,y:d.y,w:d.axis==='y'?105:12,d:d.axis==='y'?12:105,z:0,h:103,color:'#938b7c'},'#938b7c',.65);}else{homeBox({...d,z:0,h:108,color:'#b5a68c'},'#b5a68c',.78);const p=homeProject(d.x+d.w/2,d.y+d.d/2,44);rect(p.x-9,p.y-3,18,5,'#e5daba');const c=home.cats[home.active];if(homeDoorNear(c)?.id===d.id)label('跳起來拉門把',p.x,p.y-48,'#f4edd6',14);}}
function homeDrawMap(){const expanded=home.mapExpanded,w=expanded?Math.min(800,canvas.width-36,(canvas.height-55)*1.5):(window.innerWidth<600?320:212),h=w*1360/2040+32,x=canvas.width-w-16,y=14,s=(w-16)/2040;
 ctx.save();rect(x,y,w,h,'#152b25ed');ctx.strokeStyle='#acc8a4';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);label(expanded?'我們家 · 環境圖':'環境圖',x+12,y+18,'#e5efd8',expanded?20:(window.innerWidth<600?26:13),'left');
 for(const r of HOME_LAYOUT.rooms){rect(x+8+r.x*s,y+26+r.y*s,r.w*s-1,r.d*s-1,r.color);}
 if(expanded)for(const f of home.furniture)if(f.w>70&&f.d>50)rect(x+8+f.x*s,y+26+f.y*s,f.w*s,f.d*s,homeShade(f.color,-20));
 for(const r of HOME_LAYOUT.rooms)if(expanded||r.w>400)label(r.name,x+8+(r.x+r.w/2)*s,y+26+(r.y+r.d/2)*s+4,'#31423a',expanded?(canvas.height>700?30:20):(window.innerWidth<600?22:10));
 for(const d of home.doors)rect(x+8+d.x*s-1,y+26+d.y*s-1,Math.max(3,d.w*s),Math.max(3,d.d*s),d.open?'#65b989':'#bc5d64');
 for(const station of home.stations){const px=x+8+station.x*s,py=y+26+station.y*s;rect(px-3,py-3,6,6,station.type==='drink'?'#4d9dbc':'#ffe0a4');}
 home.cats.forEach((c,i)=>{const px=x+8+c.x*s,py=y+26+c.y*s;ctx.beginPath();ctx.arc(px,py,i===home.active?5:4,0,Math.PI*2);ctx.fillStyle=i?'#efad66':'#f4f7e4';ctx.fill();ctx.strokeStyle='#254535';ctx.stroke();if(expanded)label(i?'辛巴':'萊恩',px,py-11,'#fffdf0',18);});ctx.restore();
}
function homeDraw(){if(!home)return;if(typeof home3DDraw==='function'){home3DDraw();return;}ctx.imageSmoothingEnabled=false;rect(0,0,canvas.width,canvas.height,'#152923');
 const cat=home.cats[home.active],target=homeProject(cat.x,cat.y,Math.min(cat.z,90)),scale=home.zoom;home.camera.x+=(target.x-home.camera.x)*.14;home.camera.y+=(target.y-home.camera.y)*.14;
 ctx.save();ctx.translate(canvas.width/2-home.camera.x*scale,canvas.height*.57-home.camera.y*scale);ctx.scale(scale,scale);homeFloor();
 // Back walls and blinds; all other walls are cut away for a playable dollhouse view.
 homeBox({x:0,y:0,w:2040,d:14,z:0,h:150,color:'#d9d2bc'},'#d9d2bc',.80);homeBox({x:0,y:0,w:14,d:1360,z:0,h:125,color:'#d7cfb9'},'#d7cfb9',.60);
 homeBox({x:200,y:15,w:330,d:5,z:45,h:105,color:'#9bbab9'});for(let z=47;z<148;z+=11)homeBox({x:194,y:22,w:342,d:4,z,h:3,color:'#b5a27e'});
 const objects=[];
 for(const w of home.walls){if(w.x<1||w.y<1||w.x>2000||w.y>1320)continue;objects.push({depth:w.x+w.y+w.w/2+w.d/2,draw:()=>homeBox({...w,h:64,z:0,color:'#e1dbcc'},'#e1dbcc',.45)});}
 for(const f of home.furniture)objects.push({depth:f.x+f.y+(f.w+f.d)/2+(f.z||0)*.5,draw:()=>homeDrawFurniture(f)});
 for(const d of home.doors)objects.push({depth:d.x+d.y+(d.w+d.d)/2,draw:()=>homeDrawDoor(d)});
 for(const t of home.toys)objects.push({depth:t.x+t.y,draw:()=>{const p=homeProject(t.x,t.y,8);ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();rect(p.x-3,p.y-6,4,4,'#ffffff88');}});
 home.cats.forEach((c,i)=>objects.push({depth:c.x+c.y+c.z*.8+22,draw:()=>homeDrawCat(c,i)}));objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
 // Red openwork parapet seen on the balcony; enclosed boundary stays safe.
 for(let y=510;y<1360;y+=58)homeBox({x:2010,y,w:18,d:38,z:0,h:65,color:'#b67c6c'},'#b67c6c',.7);
 homeBox({x:2004,y:510,w:30,d:850,z:65,h:8,color:'#d3c6b3'},'#d3c6b3',.7);ctx.restore();homeDrawMap();
}
function homeResize(){if(mode!=='home')return;canvas.height=window.innerWidth<600?850:window.innerHeight<540?340:560;ctx.imageSmoothingEnabled=false;if(typeof home3DResize==='function')home3DResize();}
function homePause(){if(home.paused){home.paused=false;scene='home';$('overlay').classList.add('hidden');clearInput();return;}home.paused=true;clearInput();scene='home-paused';show('<h2>貓咪休息中</h2><p class="result-detail">兩隻貓和需求值都暫停了。</p><button class="primary" id="resume-home">繼續在家玩</button><button class="secondary" id="leave-home">回闖關模式</button>');$('resume-home').onclick=homePause;$('leave-home').onclick=homeLeave;}
function homeHelp(){home.paused=true;scene='home-help';show('<h2>歡迎來我們家</h2><div class="help-copy"><p><b>WASD／方向鍵</b>移動、<b>空白鍵</b>跳、<b>E</b>互動。手機用方向盤和右邊的按鈕；拖曳場景轉頭，往上滑抬頭看高處、往下滑低頭。Q／R 向左右轉頭。</p><p><b>C／切換貓咪</b>：切換萊恩或辛巴，另一隻會自己巡邏、跳上家具、玩球，餓了或渴了會找餵食機和飲水機。</p><p><b>開門</b>：靠近門把，跳起來再按互動拉下門把。開著的門可在旁邊按互動關上。</p><p><b>飢餓度</b>越低越飽；<b>水分</b>越高越充足。靠近自動設備按互動即可吃喝，走開會停止。離開遊戲不扣需求值。</p><p>右上角是即時環境圖，白點是萊恩、橘點是辛巴。用「環境圖」按鈕展開；「視角」可切換貓眼與近距離跟隨。牆壁會擋住視線，走到門口開門才能看見另一區。靠牆的木階可以一路跳上高處貓道。探索位置、門和需求會存在這台裝置。</p></div><button class="primary" id="close-home-help">回家玩</button>','help');$('close-home-help').onclick=()=>{home.paused=false;scene='home';$('overlay').classList.add('hidden');clearInput();};}
