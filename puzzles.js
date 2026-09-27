'use strict';
// Chapters 13–30 use individual cooperative state machines, not repeated obstacle strings.
const puzzleChapters=[
 ['符號接力室','依線索輪流輸入符號；按 S／↓ 互動。','sequence','順序 × 輪流'],
 ['剛剛好的重量','貓重 1，箱重 2。兩邊同時達到指定重量。','weight','精確配重'],
 ['鑰匙不是我的','先拿自己的鑰匙，見面交換，再送進對方的鎖。','exchange','交換 × 遞送'],
 ['折射實驗室','萊恩供電，辛巴調整三片反射鏡。','mirrors','光線方向'],
 ['隔空合奏','兩人分站兩端，在綠拍同時敲鐘。','rhythm','同步節奏'],
 ['亮燈邏輯','每個按鈕會翻轉兩盞燈，找出全亮的組合。','logic','異或電路'],
 ['傳送站調度','一人選目的地，另一人進傳送門找印章。','portal','傳送路由'],
 ['留下一個我','在左方留下影子，再分頭啟動兩個封印。','echo','影子 × 限時分工'],
 ['天平升降塔','移動配重箱，讓隊友停在不同高度。','balance','重量控制高度'],
 ['光橋護送','只有燈附近的橋能站，必要時把燈交給隊友。','lantern','光源護送'],
 ['你的路我的路','兩隻貓的橋不同，交換極性才能收齊印章。','polarity','個人橋 × 極性'],
 ['雙向抽水站','一人持續抽水，另一人進池底關閥；再換班。','water','水位 × 換班'],
 ['易碎罐罐快遞','拿罐罐不能跳；隊友替你切換兩段平橋。','cargo','搬運 × 架橋'],
 ['冰箱滑塊','推一下箱子就滑走，隊友要先放下正確擋板。','ice','慣性 × 擋板'],
 ['小機器人回家','輪流輸入方向，讓機器人避開洞口找到家。','robot','合作編程'],
 ['只有你看得懂','兩邊各有一半線索，一起算出三位密碼。','cipher','資訊拼合'],
 ['借我三秒鐘','一人按住互動凍結機關，另一人穿過光橋。','freeze','時間控制'],
 ['我們一起回家','啟動電路、交換核心、再同步轉動出口鎖。','finale','多階段協作']
];
puzzleChapters.forEach((c,i)=>chapters.push([c[0],c[1],[],4+Math.floor(i/6),c[3]]));
function makePuzzleLevel(index){
 const def=puzzleChapters[index-12],type=def[2];
 const q={type,solved:false,progress:0,hold:0,elapsed:0,nodes:[],tokens:[],seq:[],phase:0,inventory:[null,null],cooldown:0};
 const l={name:def[0],hint:def[1],tier:4+Math.floor((index-12)/6),width:1720,platforms:[],gaps:[],gates:[],boxes:[],movers:[],checkpoints:[{x:210,y:434,active:false}],fish:[],signs:[],hazards:[],lasers:[],winds:[],belts:[],remotes:[],goal:{x:1590,y:434},puzzle:q};
 const node=(id,x,label,owner=null,y=434)=>{const n={id,x,y,label,owner};q.nodes.push(n);return n;};
 const ledge=(x,y,w=85,extra={})=>l.platforms.push({x,y,w,h:12,oneway:true,...extra});
 const snack=(x,y=407,owner)=>l.fish.push({x,y,got:false,...(owner===undefined?{}:{owner})});
 const box=(x,min,max,extra={})=>{const b={x,y:390,w:44,h:44,min,max,start:x,...extra};l.boxes.push(b);return b;};
 const token=(x,y=407,owner)=>q.tokens.push({x,y,owner,got:false});
 const wall=(x,key)=>l.gates.push({type:'puzzle',x,y:150,w:18,h:284,plates:[],key,open:false});
 snack(125);snack(1515);wall(1450,'exit');
 if(type==='sequence'){
  q.code=[0,2,1,3,0,3];q.ownerOrder=[0,1,0,1,0,1];
  ['月','星','雲','日'].forEach((t,i)=>node('symbol'+i,340+i*245,t,i%2));
  // Role and symbol are independent: each player has a copy of all symbols.
  q.nodes.forEach(n=>n.owner=null);q.hint='線索：1P月 → 2P雲 → 1P星 → 2P日 → 1P月 → 2P日；輪到誰，誰按互動。';
  ledge(560,366);ledge(1050,358);snack(603,342);snack(1090,334);
 }else if(type==='weight'){
  q.plates=[550,1060];q.targets=[3,3];box(390,320,630);box(910,820,1140);
  node('scale0',550,'目標 3');node('scale1',1060,'目標 3');q.hint='每隻貓重 1、箱子重 2。推好兩個箱子，兩隻分站秤上保持 3 秒。';snack(760);snack(1220);
 }else if(type==='exchange'){
  q.keys=[{x:460,y:315,owner:0,held:null,done:false},{x:1050,y:300,owner:1,held:null,done:false}];
  ledge(330,371);ledge(420,339);ledge(890,370);ledge(1000,324);
  node('socket0',350,'橘鑰匙 → 1P',0);node('socket1',1190,'綠鑰匙 → 2P',1);
  q.hint='各自碰到同色鑰匙。靠近隊友按互動交換；萊恩交橘鑰匙、辛巴交綠鑰匙。';snack(660);snack(810);
 }else if(type==='mirrors'){
  q.angles=[0,0,0];q.target=[1,3,2];node('power',320,'1P 供電',0);
  for(let k=0;k<3;k++)node('mirror'+k,650+k*225,'鏡 '+(k+1),1);
  q.hint='供電踏板要萊恩踩住；辛巴按互動轉鏡。光線提示依序：→、←、↓。保持正確 3 秒。';snack(525);snack(1270);
 }else if(type==='rhythm'){
  node('bell0',380,'1P 鐘',0);node('bell1',1180,'2P 鐘',1);q.hits=[-100,-100];q.round=0;q.lastBeat=-1;
  q.hint='每 2.2 秒一拍，綠燈時兩人敲鐘（相差不超過 0.22 秒），完成 4 拍。錯拍只退一拍。';snack(700);snack(830);
 }else if(type==='logic'){
  q.bits=[0,0,0,0];q.masks=[3,12,6,8];q.used=[false,false];
  for(let k=0;k<4;k++)node('logic'+k,350+k*255,['①②','③④','②③','④'][k],k%2);
  q.hint='按鈕翻轉標示的燈。兩人輪流思考，四盞全部亮起；1P 管第 1、3 鍵，2P 管第 2、4 鍵。';snack(610);snack(870);
 }else if(type==='portal'){
  l.width=2360;l.goal.x=2220;l.gates[0].x=2080;q.route=0;q.stamps=[false,false,false];
  node('route',320,'1P 選站',0);node('portalIn',530,'2P 傳送',1);
  [900,1300,1700].forEach((x,k)=>{wall(x-85,'chamber');wall(x+185,'chamber');node('stamp'+k,x+65,'印章 '+(k+1),1);node('return'+k,x,'回大廳',1);snack(x+120);});
  l.fish[1].x=2150;q.hint='萊恩在控制台切換 1／2／3 站，辛巴從入口傳送。拿印章和魚乾，回門口按互動返回；集齊後隔牆全開。';
 }else if(type==='echo'){
  node('echo',340,'留下影子');node('seal0',850,'1P 封印',0);node('seal1',1220,'2P 封印',1);q.remaining=0;q.shadowOwner=0;
  q.hint='在左邊按互動留下 8 秒影子。趁影子守住起點，兩人分站封印保持 1.5 秒；不夠時間可重試。';ledge(660,373);snack(702,349);snack(1040);
 }else if(type==='balance'){
  q.plate=420;q.level=0;box(300,260,490);node('ballast',420,'配重：箱2／貓1');
  const p={id:'balance',kind:'balance',x:760,y:434,w:136,h:14,oneway:true,dx:0,dy:0};l.movers.push(p);
  token(818,335,1);token(818,263,1);token(950,191,1);ledge(900,216,155);node('seal',980,'2P 塔頂封印',1,216);
  q.hint='辛巴搭平台，萊恩調重量：只有貓=1、只有箱=2、貓加箱=3。每級升 72；全部移開會降回地面。依序拿 3 顆印章，再到塔頂按封印。';snack(600);snack(1190);
 }else if(type==='lantern'){
  q.carrier=0;q.lightRadius=170;l.gaps.push({x:370,w:850});
  for(let k=0;k<8;k++){const y=386-(k%2)*38;ledge(350+k*115,y,78,{kind:k%3===0?'refuge':'light'});snack(380+k*115,y-24);}
  node('lightEnd',1340,'一起抵達');q.hint='萊恩帶燈：距離燈 170 內光橋才存在。白台可等人，靠近隊友按互動交燈；兩隻要一起護送到終點。';
 }else if(type==='polarity'){
  q.polarity=0;l.gaps.push({x:380,w:865});
  for(let k=0;k<7;k++){const y=k%2?345:390;ledge(350+k*130,y,88,k%2?{kind:'personal',owner:Math.floor(k/2)%2}:{kind:'refuge'});if(k%2){token(393+k*130,y-23,0);token(393+k*130,y-23,1);}else node('polarity'+k,393+k*130,'切換極性',null,y);}
  q.hint='彩橋只承重標示的貓。白台按互動交換極性；兩隻都得收自己 3 顆印章，再到右岸。';
 }else if(type==='water'){
  q.basins=[{x:560,w:280,y:330,drained:false,pump:350,valve:765,owner:0},{x:1070,w:275,y:330,drained:false,pump:935,valve:1275,owner:1}];
  q.basins.forEach((b,k)=>{node('pump'+k,b.pump,(b.owner?'2P':'1P')+' 按住抽水',b.owner);node('valve'+k,b.valve,'隊友關閥',1-b.owner);snack(b.valve);});
  q.hint='第一池萊恩按住互動抽水，辛巴趁水退後進去關閥。第二池交換角色；水碰到身體會退回旗子。';
 }else if(type==='cargo'){
  q.cargo={x:380,y:410,held:null,done:false};q.mode=0;
  l.gaps.push({x:550,w:220},{x:940,w:250});ledge(550,434,220,{kind:'cargoBridge',mode:0});ledge(940,434,250,{kind:'cargoBridge',mode:1});
  node('cargoSwitch0',470,'空手切橋');node('cargoSwitch1',840,'空手切橋');node('cargoEnd',1320,'交付罐罐');
  q.hint='互動拿罐罐，拿著不能跳、也不能切橋。空手隊友先架第一橋；一起到中島再換第二橋。靠近隊友互動可交接。';snack(820);snack(1270);
 }else if(type==='ice'){
  q.stops=[530,1020];q.brakes=[false,false];
  box(350,300,690,{ice:true,v:0,lane:0});box(830,800,1190,{ice:true,v:0,lane:1});
  node('brake0',260,'1P 擋板',0);node('brake1',760,'2P 擋板',1);
  q.hint='萊恩先放下左擋板，辛巴推第一箱；第二區換辛巴放擋板、萊恩推箱。箱滑進白框後不再亂跑；兩箱同時對準。';snack(715);snack(1270);
 }else if(type==='robot'){
  q.commands=[];q.running=false;q.step=0;q.robot=[0,2];q.walls=[[1,2],[1,1],[3,0],[3,2]];q.target=[4,2];q.tick=0;
  ['↑','→','↓','←'].forEach((v,k)=>node('cmd'+k,390+k*170,v));node('erase',1110,'退一格');node('run',1280,'雙人啟動');
  q.hint='5×3 格：機器人左下出發到右下。輪流輸入上下左右，最多 12 步；兩隻一起站「啟動」按互動。撞牆可退格修改。';snack(600,290);ledge(555,314,95);snack(985,290);ledge(940,314,95);
 }else if(type==='cipher'){
  q.digits=[0,0,0];q.target=[3,1,2];q.confirm=[false,false];
  node('clue0',320,'1P 線索',0);node('clue1',1230,'2P 線索',1);
  for(let k=0;k<3;k++)node('digit'+k,600+k*160,'位數 '+(k+1),k===1?1:0);
  node('confirm0',400,'1P 確認',0);node('confirm1',1140,'2P 確認',1);
  q.hint='左線索：A+B=4、A>C。右線索：B+C=3、A+B+C=6。每位 0～3，按互動調數字，兩人分頭確認。';snack(520);snack(1070);
 }else if(type==='freeze'){
  q.energy=3.2;q.freezeOwner=null;q.worldTime=0;l.gaps.push({x:370,w:900});
  for(let k=0;k<7;k++){const y=k%2?338:390;ledge(350+k*140,y,90,k%2?{kind:'timeBridge',phase:Math.floor(k/2)%2}:{kind:'refuge'});snack(393+k*140,y-24);}
  q.hint='站穩按住互動：自己不能動，但機關時間凍結（最多 3.2 秒）。另一隻先跳；鬆開回充，輪流在白台掩護彼此。';
 }else if(type==='finale'){
  l.width=2840;l.goal.x=2710;l.gates[0].x=2570;q.stage=0;q.code=[0,2,1,0];q.ownerOrder=[0,1,0,1];q.remaining=0;q.hits=[-100,-100];
  ['日','月','星'].forEach((v,k)=>node('finalCode'+k,340+k*180,v));wall(930,'stage1');
  q.keys=[{x:1110,y:407,owner:0,held:null,done:false},{x:1640,y:407,owner:1,held:null,done:false}];node('socket0',1040,'1P 交橘核心',0);node('socket1',1820,'2P 交綠核心',1);wall(1950,'stage2');
  node('finalCharge',2060,'雙人充能');node('finalSeal0',2230,'1P 轉鎖',0);node('finalSeal1',2480,'2P 轉鎖',1);
  q.hint='三道連鎖：① 1P日→2P星→1P月→2P日；② 交換兩顆核心並交付；③ 一起充能，再在 4 秒內各自轉鎖（相差 0.3 秒內）。';
  l.fish[1].x=2630;snack(1330);snack(1550);l.checkpoints.push({x:1010,y:434,active:false},{x:2040,y:434,active:false});
 }
 if(l.fish.length<4){snack(250);snack(l.goal.x-70);}
 l.ground=[];let end=0;for(const g of l.gaps){l.ground.push({x:end,y:434,w:g.x-end,h:100});end=g.x+g.w;}l.ground.push({x:end,y:434,w:l.width-end,h:100});
 q.hint=q.hint||def[1];return l;
}
function puzzleNear(c,n,r=48){return Math.abs(c.x+c.w/2-n.x)<r&&Math.abs(c.y+c.h-n.y)<48;}
function puzzleNode(q,id){return q.nodes.find(n=>n.id===id);}
function puzzleHold(q,id,i){const n=puzzleNode(q,id);return n&&puzzleNear(cats[i],n,36)&&cats[i].ground;}
function puzzleWeight(x){return cats.filter(c=>onPlate(c,x)).length+l.boxes.filter(b=>onPlate(b,x)).length*2;}
function solvePuzzle(q){if(q.solved)return;q.solved=true;say('合作解謎成功！帶齊魚乾，一起回家。');tone(1047,.25);spark(l.goal.x-130,380,'#c2e5ad');}
function puzzleUse(i){
 const q=l.puzzle;if(!q||q.solved)return;const c=cats[i],near=q.nodes.filter(n=>puzzleNear(c,n)).sort((a,b)=>Math.abs(c.x+c.w/2-a.x)-Math.abs(c.x+c.w/2-b.x));
 const n=near[0];
 if(n&&n.owner!==null&&n.owner!==i){say('這個機關要由 '+(n.owner?'辛巴':'萊恩')+' 操作。');return;}
 if(q.keys){
  if(n?.id.startsWith('socket')){const item=q.keys.find(k=>k.held===i&&k.owner!==i&&!k.done);if(item){item.done=true;item.held=null;tone(900);say('交付成功！另一顆也要交給對的人。');}else say('需要隊友交換給你的鑰匙。');return;}
  if(Math.abs(cats[0].x-cats[1].x)<70&&Math.abs(cats[0].y-cats[1].y)<50){const a=q.keys.find(k=>k.held===0&&!k.done),b=q.keys.find(k=>k.held===1&&!k.done);if(a||b){if(q.elapsed<(q.transferUntil||0))return;q.transferUntil=q.elapsed+.3;if(a)a.held=1;if(b)b.held=0;say('交換好了，去找自己的鎖！');return;}}
 }
 if(q.type==='lantern'&&Math.abs(cats[0].x-cats[1].x)<75&&Math.abs(cats[0].y-cats[1].y)<50){if(q.elapsed<(q.transferUntil||0))return;q.transferUntil=q.elapsed+.3;q.carrier=1-q.carrier;say('燈交給'+(q.carrier?'辛巴':'萊恩')+'了。');return;}
 if(q.type==='cargo'){
  const item=q.cargo;
  if(n?.id==='cargoEnd'&&item.held===i){item.done=true;solvePuzzle(q);return;}
  if(n?.id.startsWith('cargoSwitch')){if(item.held===i)say('拿著罐罐不能切橋，請空手隊友幫忙。');else{q.mode=1-q.mode;tone(600);say('目前架起第 '+(q.mode+1)+' 段橋。');}return;}
  if(item.held===null&&Math.abs(c.x+c.w/2-item.x)<48){item.held=i;say('拿穩囉！現在不能跳，讓隊友替你架橋。');return;}
  if(item.held!==null&&Math.abs(cats[0].x-cats[1].x)<70&&Math.abs(cats[0].y-cats[1].y)<50){if(q.elapsed<(q.transferUntil||0))return;q.transferUntil=q.elapsed+.3;item.held=1-item.held;say('罐罐交接成功。');return;}
 }
 if(!n)return;
 if(q.type==='sequence'||q.type==='finale'&&q.stage===0){
  const prefix=q.type==='sequence'?'symbol':'finalCode';if(!n.id.startsWith(prefix))return;const v=Number(n.id.slice(prefix.length));
  if(v===q.code[q.progress]&&i===q.ownerOrder[q.progress]){q.progress++;tone(650+q.progress*60);if(q.progress===q.code.length){if(q.type==='finale'){q.stage=1;say('電力接通！進下一室交換核心。');}else solvePuzzle(q);}}
  else{q.progress=0;say('順序或角色不對，從第一個符號再來。');}return;
 }
 if(q.type==='mirrors'&&n.id.startsWith('mirror')){const k=Number(n.id.slice(6));q.angles[k]=(q.angles[k]+1)%4;tone(550);}
 if(q.type==='rhythm'&&n.id.startsWith('bell')){
  const beat=Math.floor(q.elapsed/2.2),phase=q.elapsed%2.2;
  if(phase<1.25||phase>1.95||q.lastBeat===beat){q.round=Math.max(0,q.round-1);q.hits=[-100,-100];say('等綠拍，再一起敲。');}
  else{q.hits[i]=q.elapsed;if(Math.abs(q.hits[0]-q.hits[1])<=.22){q.round++;q.lastBeat=beat;q.hits=[-100,-100];tone(700+q.round*100);if(q.round>=4)solvePuzzle(q);}}
 }
 if(q.type==='logic'&&n.id.startsWith('logic')){const mask=q.masks[Number(n.id.slice(5))];q.bits=q.bits.map((b,k)=>b^((mask>>k)&1));q.used[i]=true;if(q.bits.every(Boolean)&&q.used.every(Boolean))solvePuzzle(q);}
 if(q.type==='portal'){
  if(n.id==='route'){q.route=(q.route+1)%3;say('目的地：第 '+(q.route+1)+' 站');}
  if(n.id==='portalIn'){c.x=900+q.route*400-18;c.y=400;c.vy=0;}
  if(n.id.startsWith('stamp')){q.stamps[Number(n.id.slice(5))]=true;tone(900);if(q.stamps.every(Boolean))solvePuzzle(q);}
  if(n.id.startsWith('return')){c.x=510;c.y=400;c.vy=0;}
 }
 if(q.type==='echo'&&n.id==='echo'){q.remaining=8;q.shadowOwner=i;say('影子留下了！快去各自的封印。');}
 if(q.type==='balance'&&n.id==='seal'){if(q.tokens.every(t=>t.got))solvePuzzle(q);else say('先收齊三個高度的印章。');}
 if(q.type==='polarity'&&n.id.startsWith('polarity')){q.polarity=1-q.polarity;say('極性交換！先確認隊友站在白台上。');}
 if(q.type==='water'&&n.id.startsWith('valve')){const b=q.basins[Number(n.id.slice(5))];if(b.y>=440){b.drained=true;say('閥門關好了，可以交換角色。');}else say('水還沒退完，請隊友持續抽水。');if(q.basins.every(b=>b.drained))solvePuzzle(q);}
 if(q.type==='ice'&&n.id.startsWith('brake')){const k=Number(n.id.slice(5));q.brakes[k]=!q.brakes[k];say('第 '+(k+1)+' 個擋板'+(q.brakes[k]?'已放下。':'已收起。'));}
 if(q.type==='robot'&&!q.running){
  if(n.id.startsWith('cmd')){if(i!==q.commands.length%2){say('這一步輪到 '+(q.commands.length%2?'辛巴':'萊恩')+' 輸入。');return;}if(q.commands.length<12)q.commands.push(Number(n.id.slice(3)));}
  if(n.id==='erase')q.commands.pop();
  if(n.id==='run'){if(cats.every(c=>puzzleNear(c,n,70))&&q.commands.length){q.running=true;q.step=0;q.tick=0;q.robot=[0,2];}else say('兩隻一起到啟動台再按互動。');}
 }
 if(q.type==='cipher'){
  if(n.id.startsWith('digit')){const k=Number(n.id.slice(5));q.digits[k]=(q.digits[k]+1)%4;q.confirm=[false,false];}
  if(n.id.startsWith('confirm')){q.confirm[i]=true;if(q.confirm.every(Boolean)){if(q.digits.every((v,k)=>v===q.target[k]))solvePuzzle(q);else{q.confirm=[false,false];say('密碼不符合線索，交換一下你們的想法。');}}}
 }
 if(q.type==='finale'&&q.stage===2){
  if(n.id==='finalCharge'){if(cats.every(c=>puzzleNear(c,n,68))){q.remaining=4;q.hits=[-100,-100];say('充能 4 秒！分頭到出口鎖，準備一起按。');}else say('兩隻一起站到充能台。');}
  if(n.id.startsWith('finalSeal')&&q.remaining>0){q.hits[i]=q.elapsed;if(Math.abs(q.hits[0]-q.hits[1])<.3)solvePuzzle(q);}
 }
}
function updatePuzzle(dt){
 const q=l.puzzle;if(!q)return;q.elapsed+=dt;
 const held=[keys.has('KeyS'),keys.has('ArrowDown')];
 if(q.type==='freeze'){
  const owner=held.findIndex((v,i)=>v&&cats[i].ground);q.freezeOwner=owner>=0&&q.energy>0?owner:null;
  if(q.freezeOwner!==null)q.energy=Math.max(0,q.energy-dt);else{q.worldTime+=dt;if(!held.some(Boolean))q.energy=Math.min(3.2,q.energy+dt*.8);}
 }
 for(let i=0;i<2;i++){if(held[i]&&!cats[i].useWas)puzzleUse(i);cats[i].useWas=held[i];}
 if(q.solved)return;
 for(const t of q.tokens)if(!t.got&&cats.some((c,i)=>(t.owner===undefined||t.owner===i)&&Math.abs(c.x+c.w/2-t.x)<26&&Math.abs(c.y+c.h/2-t.y)<28)){t.got=true;tone(860);}
 if(q.keys){for(const k of q.keys)if(!k.done&&k.held===null){const c=cats[k.owner];if(!q.keys.some(o=>o.held===k.owner)&&Math.abs(c.x+c.w/2-k.x)<28&&Math.abs(c.y+c.h/2-k.y)<28){k.held=k.owner;tone(760);}}
  if(q.keys.every(k=>k.done)){if(q.type==='finale'&&q.stage===1){q.stage=2;say('核心交換完成！進最後一室同步轉鎖。');}else if(q.type==='exchange')solvePuzzle(q);}}
 if(q.type==='weight'){const correct=q.plates.every((x,k)=>puzzleWeight(x)===q.targets[k]);q.hold=correct?q.hold+dt:0;if(q.hold>=3)solvePuzzle(q);}
 if(q.type==='mirrors'){q.hold=puzzleHold(q,'power',0)&&q.angles.every((v,k)=>v===q.target[k])?q.hold+dt:0;if(q.hold>=3)solvePuzzle(q);}
 if(q.type==='echo'){q.remaining=Math.max(0,q.remaining-dt);q.hold=q.remaining>0&&puzzleHold(q,'seal0',0)&&puzzleHold(q,'seal1',1)?q.hold+dt:0;if(q.hold>=1.5)solvePuzzle(q);}
 if(q.type==='balance')q.level=clamp(puzzleWeight(q.plate),0,3);
 if(q.type==='lantern'&&cats.every(c=>c.x>1270))solvePuzzle(q);
 if(q.type==='polarity'&&q.tokens.every(t=>t.got)&&cats.every(c=>c.x>1250))solvePuzzle(q);
 if(q.type==='freeze'&&cats.every(c=>c.x>1300))solvePuzzle(q);
 if(q.type==='water')for(const [k,b]of q.basins.entries()){const pumping=held[b.owner]&&puzzleHold(q,'pump'+k,b.owner);b.y=b.drained?480:clamp(b.y+(pumping?88:-36)*dt,330,470);}
 if(q.type==='ice'){
  for(const b of l.boxes){if(!b.v)continue;const prev=b.x;b.x=clamp(b.x+b.v*dt,b.min,b.max);const target=q.stops[b.lane]-b.w/2;
   if(q.brakes[b.lane]&&((prev<=target&&b.x>=target)||(prev>=target&&b.x<=target))){b.x=target;b.v=0;}
   if(b.x===b.min||b.x===b.max)b.v=0;
  }
  if(l.boxes.every(b=>Math.abs(b.x+b.w/2-q.stops[b.lane])<3&&!b.v))solvePuzzle(q);
 }
 if(q.type==='robot'&&q.running){q.tick+=dt;if(q.tick>.42){q.tick=0;const dir=q.commands[q.step++],delta=[[0,-1],[1,0],[0,1],[-1,0]][dir];if(!delta){q.running=false;say('步數用完了，修改路線再試。');return;}const next=q.robot.map((v,k)=>v+delta[k]);if(next[0]<0||next[0]>4||next[1]<0||next[1]>2||q.walls.some(w=>w[0]===next[0]&&w[1]===next[1])){q.running=false;q.robot=[0,2];say('碰到牆了！用退格修改指令，隨時能重試。');}else{q.robot=next;if(next[0]===4&&next[1]===2)solvePuzzle(q);}}}
 if(q.type==='finale')q.remaining=Math.max(0,q.remaining-dt);
}
function puzzleGateOpen(g){const q=l.puzzle;if(!q)return false;if(g.key==='stage1')return q.stage>=1;if(g.key==='stage2')return q.stage>=2;return q.solved;}
function puzzlePlatform(p,i){const q=l.puzzle;if(!q)return true;
 if(p.kind==='light')return q.solved||Math.abs(p.x+p.w/2-(cats[q.carrier].x+18))<=q.lightRadius;
 if(p.kind==='personal')return i===undefined||((p.owner^q.polarity)===i);
 if(p.kind==='cargoBridge')return q.mode===p.mode||q.solved;
 if(p.kind==='timeBridge')return Math.floor(q.worldTime/2.4)%2===p.phase;
 return true;
}
function puzzleStatus(){const q=l.puzzle;if(!q)return '';if(q.solved)return '謎題已解開 · 收齊魚乾，兩隻一起到家';
 const values={sequence:`順序 ${q.progress}/6`,weight:`保持 ${(q.hold||0).toFixed(1)}/3 秒`,exchange:`交付 ${q.keys?.filter(k=>k.done).length}/2`,mirrors:`穩定 ${(q.hold||0).toFixed(1)}/3 秒`,rhythm:`合奏 ${q.round}/4 拍`,logic:`亮燈 ${q.bits?.filter(Boolean).length}/4`,portal:`印章 ${q.stamps?.filter(Boolean).length}/3`,echo:`影子 ${(q.remaining||0).toFixed(1)} 秒`,balance:`配重 ${q.level} · 印章 ${q.tokens.filter(t=>t.got).length}/3`,lantern:`燈在 ${q.carrier?'辛巴':'萊恩'}`,polarity:`印章 ${q.tokens.filter(t=>t.got).length}/6`,water:`關閥 ${q.basins?.filter(b=>b.drained).length}/2`,cargo:`橋 ${q.mode+1} · ${q.cargo?.held===null?'先拿罐罐':'護送中'}`,ice:'兩個滑箱都要停進白框',robot:`指令 ${q.commands?.length}/12`,cipher:`密碼 ${q.digits?.join(' ')}`,freeze:`凍結能量 ${(q.energy||0).toFixed(1)} 秒`,finale:`階段 ${q.stage+1}/3${q.stage===2?' · '+q.remaining.toFixed(1)+' 秒':''}`};return values[q.type];
}
function drawPuzzle(){
 const q=l.puzzle;if(!q)return;
 for(const n of q.nodes){const color=n.owner===0?'#c7e8b2':n.owner===1?'#ffd098':'#c8c3f2';
  rect(n.x-21,n.y-10,42,10,'#3c4855');rect(n.x-17,n.y-35,34,25,q.solved?'#75997c':'#526272');rect(n.x-13,n.y-31,26,3,color);
  label(n.label,n.x,n.y-46,color,13);if(cats.some((c,i)=>puzzleNear(c,n)&& (n.owner===null||n.owner===i)))label('互動 S / ↓',n.x,n.y-67,'#fff2c8',12);
 }
 if(q.type==='sequence'||q.type==='finale'&&q.stage===0){const symbols=q.type==='sequence'?['月','星','雲','日']:['日','月','星'];label(q.code.map((v,k)=>(k<q.progress?'✓ ':((q.ownerOrder[k]+1)+'P '))+symbols[v]).join(' → '),780,165,'#f9e0ae',15);}
 if(q.type==='weight')q.plates.forEach((x,k)=>{rect(x-32,425,64,9,'#c3b8e3');label(`${puzzleWeight(x)} / ${q.targets[k]}`,x,347,'#ffe0b5',22);});
 if(q.keys)for(const k of q.keys){if(k.done)continue;const x=k.held===null?k.x:cats[k.held].x+18,y=k.held===null?k.y:cats[k.held].y-46;rect(x-10,y-6,12,12,k.owner?'#ffc078':'#c5efb8');rect(x,y-2,19,4,k.owner?'#ffc078':'#c5efb8');rect(x+14,y,4,8,k.owner?'#ffc078':'#c5efb8');}
 if(q.type==='mirrors'){q.angles.forEach((a,k)=>{const x=650+k*225;rect(x-24,282,48,44,'#334450');label(['↑','→','↓','←'][a],x,312,'#d9edfa',29);if(puzzleHold(q,'power',0)&&q.angles.slice(0,k+1).every((v,j)=>v===q.target[j]))rect(x-200,278,200,3,'#e4e69e');});label('光路：→　←　↓',850,190,'#ede9b0',20);}
 if(q.type==='rhythm'){const phase=q.elapsed%2.2,green=phase>=1.25&&phase<=1.95;rect(650,190,270,48,green?'#759d74':'#8c686e');label(green?'現在！一起敲':'等綠拍…',785,221,'#fff1d4',22);label(q.round+' / 4',785,268,'#eeddb9',20);}
 if(q.type==='logic')q.bits.forEach((b,k)=>{rect(570+k*115,205,60,50,b?'#e8d78c':'#343e50');label(String(k+1),600+k*115,193,'#e5ddc7',16);});
 if(q.type==='portal'){label('目的地 '+(q.route+1),410,295,'#c5d6ff',22);[530,900,1300,1700].forEach(x=>{rect(x-24,344,48,90,'#7e89b344');rect(x-24,344,5,90,'#b2bef6');rect(x+19,344,5,90,'#b2bef6');});q.stamps.forEach((v,k)=>label(v?'✓':'○',965+k*400,330,'#f2d4a0',24));}
 if(q.type==='echo'&&q.remaining>0){ctx.save();ctx.globalAlpha=.42;if(sprites[q.shadowOwner].complete)ctx.drawImage(sprites[q.shadowOwner],301,381,78,53);ctx.restore();label(q.remaining.toFixed(1)+' s',340,363,'#d9cbff',18);}
 if(q.type==='balance'){label('重量 '+q.level+' → 高度 '+(q.level*72),520,260,'#e1d0f5',16);rect(780,211,4,223,'#8c8cab');rect(870,211,4,223,'#8c8cab');}
 for(const t of q.tokens)if(!t.got){star(t.x,t.y,t.owner===1?'#ffc381':'#c5edb3');label(t.owner===undefined?'印':(t.owner+1)+'P',t.x,t.y-17,'#ece6cb',12);}
 if(q.type==='lantern'){const c=cats[q.carrier];rect(c.x+34,c.y-23,12,20,'#ffe69a');label('燈',c.x+40,c.y-30,'#fff0b2',13);}
 if(q.type==='polarity')for(const p of l.platforms)if(p.kind==='personal')label(((p.owner^q.polarity)+1)+'P',p.x+p.w/2,p.y+29,(p.owner^q.polarity)?'#ffd197':'#ceefb5',14);
 if(q.type==='water')for(const b of q.basins){if(b.y<434){rect(b.x,b.y,b.w,434-b.y,'#85c0d98a');rect(b.x,b.y,b.w,4,'#d4f0f1');}label(b.drained?'已關閥':'水位',b.x+b.w/2,300,'#c1e4f3',14);}
 if(q.type==='cargo'&&!q.cargo.done){const c=q.cargo.held===null?null:cats[q.cargo.held],x=c?c.x+18:q.cargo.x,y=c?c.y-16:q.cargo.y;rect(x-12,y-13,24,26,'#debd84');rect(x-14,y-15,28,5,'#f1dcc0');label('罐',x,y+4,'#6b5237',12);}
 if(q.type==='ice')q.stops.forEach((x,k)=>{rect(x-25,429,50,5,'#f1eee2');if(q.brakes[k])rect(x+23,382,6,52,'#e3bc83');label(q.brakes[k]?'擋板↓':'擋板↑',x,354,'#dbd9ec',14);});
 if(q.type==='robot'){
  for(let y=0;y<3;y++)for(let x=0;x<5;x++){const blocked=q.walls.some(w=>w[0]===x&&w[1]===y);rect(630+x*43,125+y*43,39,39,blocked?'#8c6970':'#344c51');}
  rect(635+q.robot[0]*43,130+q.robot[1]*43,28,28,'#b2dcdc');label('家',821,239,'#e8cfa2',16);label(q.commands.map(v=>['↑','→','↓','←'][v]).join(' '),780,284,'#f1d5a3',20);
 }
 if(q.type==='cipher'){label('A + B = 4',340,211,'#d8eac0',20);label('A > C',340,244,'#d8eac0',20);label('B + C = 3',1220,211,'#ffdab0',20);label('A + B + C = 6',1220,244,'#ffdab0',20);q.digits.forEach((v,k)=>label(String(v),600+k*160,342,'#f7e1ba',30));}
 if(q.type==='freeze'){label(q.freezeOwner!==null?'時間凍結':'時間流動',820,195,'#d4e8ff',20);rect(680,215,280,8,'#374556');rect(680,215,280*q.energy/3.2,8,'#afd4ef');}
 if(q.type==='finale'){label('電力 → 交換核心 → 同步鎖',1430,145,'#e0d0f3',19);if(q.stage===2)label(q.remaining.toFixed(1)+' 秒',2300,290,'#f6dda8',24);}
}
