const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map(),events={},touch=[],savedHome=new Map();
function el(id){if(!elements.has(id))elements.set(id,{width:960,height:480,textContent:'',innerHTML:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(n,f){this[n]=f},dataset:{},setPointerCapture(){},getContext:()=>ctx});return elements.get(id)}
const ctx=new Proxy({measureText:s=>({width:s.length*14})},{get:(o,p)=>o[p]||(()=>{})});
for(const k of ['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp','KeyS','ArrowDown','Space','KeyE']){const e=el(k);e.dataset.key=k;touch.push(e)}
const sandbox={console,Math,Set,Map,Number,String,Array,Object,JSON,Infinity,Image:class{complete=true;naturalWidth=96},document:{body:{classList:{add(){},remove(){}}},getElementById:el,querySelectorAll:q=>q==='[data-key]'?touch:[],addEventListener:(n,f)=>events[n]=f},window:{innerWidth:1280,innerHeight:900,addEventListener:(n,f)=>events[n]=f},localStorage:{getItem:k=>savedHome.get(k)||null,setItem:(k,v)=>savedHome.set(k,v)},performance:{now:()=>0},requestAnimationFrame(){}};
vm.createContext(sandbox);for(const file of ['levels.js','puzzles.js','home.js','game.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..',file),'utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox);let checks=0;
function check(s,name){assert(run(s),name);checks++}
run(`function tick(n=1){for(let i=0;i<n;i++)update(1/120)};function place(c,x,y=400){Object.assign(c,{x,y,vy:0,vx:0,ground:true,inv:0,jumpWas:false,coyote:.1,buffer:0})};function hold(a,n){keys.clear();a.forEach(k=>keys.add(k));tick(n);keys.clear()}`);

run(`function homeTick(n){for(let i=0;i<n;i++)homeUpdate(1/60)};function homePlace(c,x,y,z=0){Object.assign(c,{x,y,z,vz:0,ground:true,action:null,ai:null,jumpWas:false,useWas:false})};function homeHold(a,n){keys.clear();a.forEach(k=>keys.add(k));homeTick(n);keys.clear()}`);
run('homeStart();home.cats[1].action={type:\'rest\',remaining:1000};homeDraw()');check("mode==='home'&&scene==='home'&&chapters.length===30",'free mode alongside original 30 chapters');
check('home.furniture.some(f=>f.type===\'feeder\')&&home.furniture.some(f=>f.type===\'water\')&&home.furniture.filter(f=>f.oneway).length>=7','cat furniture and automatic stations');
check('HOME_LAYOUT.rooms.filter(r=>r.id===\'bath\'||r.id===\'ensuite\').length===2','two washrooms from walkthrough');
// All room entrances are navigable, allowing closed doors to be opened along the way.
const spots=[[535,525],[970,830],[1300,385],[1790,300],[540,1190],[1320,740],[1335,1090],[1810,835]];
for(const [x,y] of spots)check(`homePath(home.cats[0],{x:${x},y:${y}}).length>0`,'reachable room point '+x+','+y);
run('var c=home.cats[0];homePlace(c,815,595);var door=home.doors[0];homeHold([\'KeyD\',\'KeyS\'],35)');check('c.x+11<=door.x&&!door.open','closed door stops walking');
run('homeUse(c,0)');check('!door.open','grounded cat cannot reach handle');run('homeJump(c);homeTick(22);homeUse(c,0)');check('door.open&&c.z>=94','jump and interact pulls handle');run('homeHold([\'KeyD\',\'KeyS\'],75)');check('c.x>900','cat can cross opened door');
run('homePlace(c,856,595);homeUse(c,0)');check('door.open','cannot close door on either cat');
run('homePlace(c,805,595);homeUse(c,0)');check('!door.open','door can be closed from side');
// Jumping on a sofa and successive climbing-tree landings are physically possible.
run('homePlace(c,300,326);homeJump(c);homeHold([\'KeyD\',\'KeyW\'],30);homeTick(65)');check('c.z===68&&c.ground','cat lands on original green sofa');
run('homePlace(c,580,466);homeJump(c);homeTick(65)');check('c.z===48&&c.ground','first cat-tree platform reachable');
run('homePlace(c,665,425,48);homeJump(c);homeTick(65)');check('c.z===96&&c.ground','second cat-tree platform reachable from first height');
// Human needs are independent; stationary interaction fills only the selected cat.
run('homePlace(c,644,697);c.water=25;c.hunger=70;homeUse(c,0);homeTick(120)');check('c.water>55&&c.hunger>=70','nearest drinking station replenishes water, not food');
run('homePlace(c,705,694);c.hunger=85;homeUse(c,0);homeTick(120)');check('c.hunger<61','automatic feeder lowers hunger');
run('homeHold([\'KeyA\'],2)');check('c.action===null','walking stops eating');
run('var before=[c.hunger,c.water];home.paused=true;homeTick(600)');check('c.hunger===before[0]&&c.water===before[1]','pause freezes needs');run('home.paused=false');
// Switching transfers control and preserves each cat's position/needs.
run('home.cats[0].hunger=61;home.cats[1].hunger=23;var pos=home.cats.map(c=>[c.x,c.y]);homeSwitch()');check('home.active===1&&home.cats[0].hunger===61&&home.cats[1].hunger===23&&home.cats.every((c,i)=>c.x===pos[i][0]&&c.y===pos[i][1])','switch preserves individual state');run('homeSwitch()');check('home.active===0','switch back works');
// AI can open a closed door and walk into the hall, not teleport through it.
run('home=makeHome();homePlace(home.cats[1],790,595);var ai=home.cats[1];ai.ai={kind:\'wander\',target:{x:990,y:595},path:homePath(ai,{x:990,y:595}),timer:0,idle:0,stuck:0,lastX:ai.x,lastY:ai.y};homeTick(150)');check('home.doors[0].open&&ai.x>880','AI jumps to handle and traverses door');
// AI prioritizes water, then hunger, without any player commands.
run('home=makeHome();home.cats[1].water=20;home.cats[1].hunger=88;homeTick(2400)');check('home.cats[1].water>80&&home.cats[1].hunger<25','AI independently drinks then eats');
run('home=makeHome();var ai=home.cats[1];homePlace(ai,310,323);ai.ai={kind:\'perch\',target:{x:315,y:255},perch:\'sofa-seat\',path:[],timer:0,idle:0,stuck:0,lastX:ai.x,lastY:ai.y};homeTick(85)');check('ai.z>=34&&ai.ground','AI jumps onto a furniture perch');
// Toys move and respect the apartment boundary.
run('home=makeHome();c=home.cats[0];var ball=home.toys[0];homePlace(c,ball.x-25,ball.y);var bx=ball.x;homeUse(c,0);homeTick(30)');check('ball.x>bx+20','interacting kicks toy ball');
run('home.cats[0].water=43;home.cats[0].hunger=57;home.doors[0].open=true;home.active=1;homeSave();home=null;homeLoad()');check('home.active===1&&home.cats[0].water===43&&home.cats[0].hunger===57&&home.doors[0].open','home state persists without offline depletion');
run('homeStart();homeDraw();home.mapExpanded=true;homeDraw();homeLeave()');check("mode==='adventure'&&scene==='title'&&canvas.height===480",'returns to adventure with original canvas');run('start(12);tick(2);draw()');check("l.puzzle.type==='sequence'&&scene==='playing'",'puzzle campaign intact after free mode');
console.log('PASS',checks,'home, AI, door, needs and persistence checks');
run('var originalElapsed=elapsed,originalX=cats[0].x;l.fish[0].got=true;homeStart();homeTick(100);homeLeave()');check('elapsed===originalElapsed&&cats[0].x===originalX&&l.fish[0].got&&scene===\'paused\'','switching modes preserves unfinished chapter');
run('homeStart();home=makeHome();var c=home.cats[0];homePlace(c,810,595);home.doors[0].open=false;home.active=0;scene=\'home\'');touch[8].pointerdown({pointerId:901,preventDefault(){}});run('homeTick(22)');touch[9].pointerdown({pointerId:902,preventDefault(){}});run('homeTick(1)');check('home.doors[0].open','multitouch jump plus interaction opens door');touch[8].pointercancel({pointerId:901});touch[9].pointerup({pointerId:902});check('!keys.has(\'Space\')&&!keys.has(\'KeyE\')','touch release clears free-mode actions');
run('home.active=0');events.keydown({code:'KeyC',repeat:false,preventDefault(){}});check('home.active===1','keyboard C switches active cat');
console.log('FINAL',checks,'home checks passed');
// Exercise actual AI movement through the entire connected apartment, not just A* output.
run('home=makeHome();home.active=0;home.cats[0].action={type:\'rest\',remaining:1000};var ai=home.cats[1]');
for(const [x,y]of [[990,830],[1300,385],[1790,300],[1320,740],[1810,835],[1335,1090],[540,1190]]){
 run(`ai.hunger=15;ai.water=95;ai.action=null;ai.ai={kind:'wander',target:{x:${x},y:${y}},path:homePath(ai,{x:${x},y:${y}}),timer:0,idle:0,stuck:0,lastX:ai.x,lastY:ai.y};for(let n=0;n<1800&&Math.hypot(ai.x-${x},ai.y-${y})>45;n++)homeUpdate(1/60)`);
 check(`Math.hypot(ai.x-${x},ai.y-${y})<=45`,'AI reaches room via real doors '+x+','+y);
}
run('home=makeHome();homePlace(home.cats[0],720,310,186);home.cats[0].water=20;home.cats[0].hunger=80;homeSwitch();homeTick(2400)');check('home.active===1&&home.cats[0].water>65&&home.cats[0].hunger<35','switched-away cat descends tree and meets needs autonomously');
console.log('FINAL',checks,'home checks including whole-apartment AI routes');
// The new renderer and movement are loaded after legacy screen-space regressions.
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../home3d.js'),'utf8'),sandbox);
run('home=makeHome();home.active=0;var c=home.cats[0];home.cats[1].action={type:"rest",remaining:1000};home.yaw=-Math.PI/2;homePlace(c,790,440);homeHold(["Space","KeyW"],30);homeTick(40)');check('c.z===70','jump from floor onto wall stair');
run('homeHold(["Space","KeyW"],36);homeTick(40)');check('c.z===145','second attached wall stair');
run('homeHold(["Space","KeyW"],36);homeTick(40)');check('c.z===220','third attached wall stair');
run('homeHold(["Space","KeyW"],36);homeTick(40)');check('c.z===290','reach 180 cm wall deck by continuous play');
run('homeHold(["KeyW"],10);homeHold(["KeyA"],145)');check('c.z===290&&c.x<425','walk along continuous elevated catwalk');
run('homeHold(["Space","KeyA"],45);homeTick(40)');check('c.z===290&&c.x<345','jump the gap between wall perches');
run('homeHold(["Space"],20)');check('c.z<=379&&h3Camera().pos[2]<435','ceiling stops upward travel and keeps camera inside');
run('home=makeHome();c=home.cats[0];homePlace(c,805,595);homeHold(["Space","KeyE"],48)');check('home.doors[0].open','holding jump and interaction reaches real-height handle without exact timing');
run('home=makeHome();c=home.cats[0];homePlace(c,390,425);home.yaw=-Math.PI/2;homeHold(["KeyW"],15)');check('c.y<400&&c.z===0','cat fits under coffee table');
run('homeHold(["Space"],15)');check('c.z<=23','table underside stops jumping through tabletop');
run('home=makeHome();home.yaw=0;var forward=home3DMovement(0,-1);var side=home3DMovement(1,0)');check('forward.dx===1&&forward.dy===0&&side.dy===1','movement follows cat view');
run('home.pitch=.2;var camera=h3Camera();var mat=h3Matrix(camera,1.5);var front=camera.pos.map((x,i)=>x+camera.f[i]*100);var projected=[0,1,2,3].map(row=>mat[row]*front[0]+mat[4+row]*front[1]+mat[8+row]*front[2]+mat[12+row])');check('Math.abs(projected[0])<.01&&Math.abs(projected[1])<.01&&Math.abs(projected[3]-100)<.01','perspective matrix projects eye direction to center');
run('var mesh=h3BuildStatic()');check('mesh.positions.length===mesh.colors.length&&mesh.triangles.length>1000&&mesh.positions.every(Number.isFinite)','3D geometry and vertex colors are complete and finite');
run('home.cats[0].x=805;home.cats[0].y=595;home.yaw=0;home.pitch=0;home.view="follow";var camera=h3Camera()');check('camera.pos[0]>600&&camera.pos[0]<805','follow camera stays close to cat');
// Ray/triangle intersection verifies room visibility with the same meshes sent to WebGL.
run(`function sceneRay(origin,dir,mesh){let hit=Infinity;const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((v,i)=>v-b[i]);for(const tri of mesh.triangles){const [a,b,c]=tri.v,e1=sub(b,a),e2=sub(c,a),h=cross(dir,e2),det=h3Dot(e1,h);if(Math.abs(det)<1e-7)continue;const t=sub(origin,a),u=h3Dot(t,h)/det;if(u<0||u>1)continue;const q=cross(t,e1),v=h3Dot(dir,q)/det;if(v<0||u+v>1)continue;const distance=h3Dot(e2,q)/det;if(distance>0)hit=Math.min(hit,distance);}return hit;}`);
run('home=makeHome();var staticMesh=h3BuildStatic();var closed=sceneRay([805,595,46],[1,0,0],h3BuildDynamic());home.doors[0].open=true;var opened=sceneRay([805,595,46],[1,0,0],h3BuildDynamic())');check('closed<65&&opened>250','closed door hides hallway, opening reveals doorway');
check('sceneRay([800,500,46],[1,0,0],staticMesh)<60','opaque living wall blocks adjacent room at cat eye height');
check('sceneRay([800,500,320],[1,0,0],staticMesh)<60','wall remains opaque while cat is on high catwalk');
check('sceneRay([805,595,380],[1,0,0],staticMesh)<70','lintel blocks visibility above door');
run('home=makeHome();homePlace(home.cats[0],300,55,290);home.cats[0].water=20;home.cats[0].hunger=80;homeSwitch();homeTick(3000)');check('home.cats[0].water>65&&home.cats[0].hunger<35','AI descends new high catwalk and autonomously eats and drinks');
console.log('FINAL',checks,'home and perspective 3D checks passed');

run('home=makeHome();home.active=0;var c=home.cats[0];home.cats[1].action={type:"rest",remaining:1000};home.yaw=-Math.PI/2;homePlace(c,787,983);homeHold(["Space","KeyW"],34);homeTick(40)');check('c.z===72','bedroom wall stair one');
run('homeHold(["Space","KeyW"],34);homeTick(40)');check('c.z===148','bedroom wall stair two');
run('homeHold(["Space","KeyA"],38);homeTick(40)');check('c.z===222','bedroom wall stair three');
run('homeHold(["Space","KeyA"],47);homeTick(40)');check('c.z===295','bedroom high deck reached by continuous inputs');
run('homeHold(["KeyA"],60);homeHold(["KeyS"],30)');check('c.z===295&&c.y>870','bedroom corner walkway is physically traversable');
console.log('FINAL',checks,'home and 3D room checks passed');
run('home=makeHome();var c=home.cats[0];var camera=h3Camera()');check('home.view==="follow"&&Math.hypot(camera.pos[0]-c.x,camera.pos[1]-c.y)>85','new sessions default to visible-cat follow view');
run('homePlace(c,520,1200);home.yaw=-2.2;home.pitch=.12;var camera=h3Camera()');check('Math.hypot(...camera.pos.map((v,i)=>v-[c.x,c.y,c.z+32][i]))>75&&!h3CameraBlocked(...camera.pos)','follow camera clears low bedroom furniture without entering cat');
run('var ryan=h3Mesh(),simba=h3Mesh();h3Cat(ryan,home.cats[0],0);h3Cat(simba,home.cats[1],1)');check('ryan.positions.every(Number.isFinite)&&simba.positions.every(Number.isFinite)&&ryan.triangles.length>simba.triangles.length','distinct fur and body geometry remain finite');
check('ryan.colors.every(v=>v>=0&&v<=1)&&simba.colors.every(v=>v>=0&&v<=1)','curved cat materials remain valid');
run('var before=ryan.positions.slice();c.moving=true;home.time=.14;var pose=h3Mesh();h3Cat(pose,c,0)');check('pose.positions.some((v,i)=>v!==before[i])','walking animates legs and tail geometry');
console.log('FINAL',checks,'home and detailed-model checks passed');
run('home=makeHome();var m=h3BuildStatic();var cmesh=h3Mesh();h3Cat(cmesh,{x:0,y:0,z:0,heading:0,ground:true,moving:false,status:"",model:true},0)');
check('m.surfaces.length===m.positions.length/3*4&&m.joints.length===m.positions.length/3&&m.surfaces.every(Number.isFinite)','all room vertices have valid surface normals and materials');
check('cmesh.joints.includes(1)&&cmesh.joints.includes(4)&&cmesh.joints.includes(5)&&cmesh.surfaces.every(Number.isFinite)','cat meshes carry articulated leg and tail metadata');
run('var uploads=0,draws=0;var originalUpload=h3Upload,originalGLDraw=h3GLDraw;h3Upload=(e,m)=>{uploads++;return {count:m.positions.length/3}};h3GLDraw=(e,c,list)=>{draws++;globalThis.meshList=list};home3d={engine:{gl:{deleteBuffer(){}}},surface:{width:960,height:600},staticBuffer:{count:1}};h3CachedGPU(h3Camera());var firstUploads=uploads;home.cats[0].x+=5;home.cats[0].moving=true;home.time+=.1;h3CachedGPU(h3Camera())');
check('uploads===firstUploads&&draws===2&&meshList.filter(m=>m.isCat).length===2','moving frames reuse GPU geometry rather than rebuild cats');
check('meshList.find(m=>m.isCat).pose[0]===home.cats[0].x&&meshList.find(m=>m.isCat).moving','cat translation and gait update independently of cached meshes');
run('home.doors[0].open=!home.doors[0].open;h3CachedGPU(h3Camera())');check('uploads===firstUploads+1','door changes rebuild only the door mesh');
run('h3Upload=originalUpload;h3GLDraw=originalGLDraw');
console.log('FINAL',checks,'home, material and cached-render checks passed');
// Interaction and camera regressions from the reported phone stutter.
run('home=makeHome();mode="home";homeLookDown({pointerId:70,clientX:100,clientY:100,preventDefault(){}});var yawStart=home.yaw;homeLookMove({pointerId:70,clientX:200,clientY:130});var yawTarget=home.lookTarget.yaw');
check('home.yaw===yawStart&&yawTarget>yawStart','drag records intent without an instantaneous camera jump');
run('home3DLookUpdate(1/60)');check('home.yaw>yawStart&&home.yaw<yawTarget','camera eases into rotation');
run('homeLookUp({pointerId:71});homeLookMove({pointerId:71,clientX:900,clientY:900})');check('home.lookDrag.id===70&&home.lookTarget.yaw===yawTarget','second touch cannot release or move the look finger');
run('homeLookUp({pointerId:70});for(let k=0;k<30;k++)home3DLookUpdate(1/60)');check('home.lookDrag===null&&Math.abs(home.yaw-yawTarget)<.001','look settles and correct finger releases capture');
run('home=makeHome();home.lookTarget={yaw:home.yaw+1,pitch:.2};for(let k=0;k<30;k++)home3DLookUpdate(1/30);var at30=home.yaw;home=makeHome();home.lookTarget={yaw:home.yaw+1,pitch:.2};for(let k=0;k<120;k++)home3DLookUpdate(1/120)');check('Math.abs(at30-home.yaw)<.00001','look smoothing is stable at different refresh rates');
run('home=makeHome();var c=home.cats[0];homePlace(c,600,550);home.yaw=0;home.pitch=-.18;home.cameraRig={active:0,elevation:.53,arm:35};var cam=h3Camera(1/60)');check('home.cameraRig.arm>35&&home.cameraRig.arm<90&&!h3CameraBlocked(...cam.pos)','camera extends gradually without entering geometry');
run('homePlace(c,825,595);home.yaw=Math.PI;home.doors[0].open=false;var cam=h3Camera(1/60)');check('!h3CameraBlocked(...cam.pos)&&cam.pos[0]<842','camera retracts safely before a closed wall or door');
run('home=makeHome();var visible=h3VisibleRooms()');check('visible.size===1&&visible.has("living")','closed living room excludes unseen rooms from rendering');
run('home.doors[0].open=true;visible=h3VisibleRooms()');check('visible.has("hall")&&!visible.has("bedroom")','opening a door reveals connected rooms while closed bedroom stays hidden');
run('var full=h3BuildStatic(),chunks=h3Partition(full);var living=chunks.find(c=>c.room==="living").mesh');check('living.positions.length<full.positions.length*.72&&living.surfaces.length===living.positions.length/3*4','room partition substantially reduces submitted geometry with complete attributes');
run('home=makeHome();c=home.cats[0];var local=h3Mesh(),world=h3Mesh();h3Cat(local,{...c,x:0,y:0,z:0,heading:0,model:true},0);h3Cat(world,{...c,x:0,y:0,z:0,heading:0},0);var topLocal=Math.max(...local.positions.filter((v,i)=>i%3===2)),topWorld=Math.max(...world.positions.filter((v,i)=>i%3===2))');check('Math.abs(topWorld/topLocal-.74)<.0001&&H3_VERTEX.includes("p*=0.74")','software and GPU cats both use the requested smaller scale');
run('c.heading=0;c.renderHeading=0;c.moving=false;h3CatPose(c);c.heading=Math.PI/2;c.moving=true;var pose=h3CatPose(c)');check('pose.pose[3]>0&&pose.pose[3]<Math.PI/2&&pose.moving>0&&pose.moving<1','body turn and walking blend smoothly');
run('home=makeHome();var hcount=0,oldHUD=homeUpdateHUD;homeUpdateHUD=()=>hcount++;homeTick(60);homeUpdateHUD=oldHUD');check('hcount<=10','needs HUD no longer triggers layout writes every physics tick');
console.log('FINAL',checks,'home, appearance and smooth-camera checks passed');
// Regression: a safe camera boom must not force the gaze below the horizon.
run('home=makeHome();mode="home";homePlace(home.cats[0],600,550);home.yaw=-Math.PI/2;home.pitch=-.18;homeLookDown({pointerId:80,clientX:200,clientY:500,preventDefault(){}});homeLookMove({pointerId:80,clientX:200,clientY:200});for(let k=0;k<60;k++)home3DLookUpdate(1/60);var upCamera=h3Camera(1/60);homeLookUp({pointerId:80})');
check('upCamera.f[2]>.6&&!h3CameraBlocked(...upCamera.pos)','upward drag looks above horizon while follow camera remains collision-safe');
run('var catwalk=[600,60,290],delta=catwalk.map((v,i)=>v-upCamera.pos[i]),screenY=h3Dot(delta,upCamera.up)/(h3Dot(delta,upCamera.f)*Math.tan(upCamera.fov/2))');
check('h3Dot(delta,upCamera.f)>0&&Math.abs(screenY)<1','high living-room catwalk is visible when looking up from the floor');
run('home.lookTarget=null;home.cameraRig=null;var slopes=[];for(const pitch of[-.7,0,.4,.8,1.4]){home.pitch=pitch;slopes.push(h3Camera().f[2])}');
check('slopes.every((v,i)=>i===0||v>slopes[i-1])','follow gaze moves continuously upward through the horizon');
run('homePlace(home.cats[0],825,595);home.yaw=Math.PI;home.pitch=1.4;home.doors[0].open=false;var blockedUp=h3Camera(1/60)');
check('blockedUp.f[2]>.8&&!h3CameraBlocked(...blockedUp.pos)','door collision retracts boom without cancelling upward gaze');
run('home.view="eye";var eyeUp=h3Camera();home.pitch=-1.12;var eyeDown=h3Camera()');
check('eyeUp.f[2]>.9&&eyeDown.f[2]<-.8','cat-eye view still looks both up and down');
run('home.view="follow";home.lookTarget=null;homeLookDown({pointerId:81,clientX:200,clientY:100,preventDefault(){}});homeLookMove({pointerId:81,clientX:200,clientY:800});for(let k=0;k<60;k++)home3DLookUpdate(1/60);var downCamera=h3Camera();homeLookUp({pointerId:81})');
check('downCamera.f[2]<-.9','downward drag can still inspect paws and floor');
console.log('FINAL',checks,'home checks including upward-camera regression passed');
