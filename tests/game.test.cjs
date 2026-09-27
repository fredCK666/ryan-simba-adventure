const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map(),events={},touch=[];
function el(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(n,f){this[n]=f},dataset:{},setPointerCapture(){},getContext:()=>ctx});return elements.get(id)}
const ctx=new Proxy({measureText:s=>({width:s.length*14})},{get:(o,p)=>o[p]||(()=>{})});
for(const k of ['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp','KeyS','ArrowDown']){const e=el(k);e.dataset.key=k;touch.push(e)}
const sandbox={console,Math,Set,Map,Number,String,Array,Object,JSON,Infinity,Image:class{complete=true;naturalWidth=96},document:{getElementById:el,querySelectorAll:q=>q==='[data-key]'?touch:[],addEventListener:(n,f)=>events[n]=f},window:{addEventListener:(n,f)=>events[n]=f},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){}};
vm.createContext(sandbox);for(const file of ['levels.js','puzzles.js','home.js','game.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..',file),'utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox);let checks=0;
function check(s,name){assert(run(s),name);checks++}
run(`function tick(n=1){for(let i=0;i<n;i++)update(1/120)};function place(c,x,y=400){Object.assign(c,{x,y,vy:0,vx:0,ground:true,inv:0,jumpWas:false,coyote:.1,buffer:0})};function hold(a,n){keys.clear();a.forEach(k=>keys.add(k));tick(n);keys.clear()}`);
check('chapters.length===30','12 chapters');
check('new Set(chapters.map(c=>c[4])).size===30','every chapter has a distinct challenge');
for(let i=0;i<12;i++){
 run(`start(${i});tick(2);draw()`);
 check('l.width>960&&l.fish.length>=3','chapter '+(i+1)+' complete geometry');
 check('l.ground.every(g=>g.w>0)&&l.checkpoints.every(cp=>!l.gaps.some(g=>cp.x>=g.x&&cp.x<g.x+g.w))','safe shared checkpoints '+i);
 run('l.fish[0].got=true;var cp=l.checkpoints[0];place(cats[0],cp.x+10);tick(2)');check('checkpoint===60','checkpoint waits for both '+i);
 run('place(cats[1],cp.x+55);tick(2);var saved=checkpoint;cats[0].y=580;tick(1)');check('checkpoint===saved&&cats[0].x===saved&&l.fish[0].got','checkpoint retains collectibles '+i);
 run('place(cats[0],l.goal.x,l.goal.y-34);place(cats[1],l.goal.x+40,l.goal.y-34);tick(1)');check("scene==='playing'",'missing fish blocks completion '+i);
 run('l.fish.forEach(f=>f.got=true);place(cats[1],60);tick(1)');check("scene==='playing'",'requires both cats '+i);
 run('place(cats[1],l.goal.x+40,l.goal.y-34);tick(1)');check("scene==='won'&&record[level]",'chapter completes '+i);
}
run('start(0);var g=l.gates[0];place(cats[0],g.plates[0]-18);place(cats[1],g.x-75);tick(2)');check('g.open&&!g.latched','relay held open');run("hold(['ArrowRight'],120)");check('g.latched&&cats[1].x>g.x+g.w','relay physically crossed');
run("start(2);var b=l.boxes[0],g=l.gates[0];place(cats[0],b.x-36);hold(['KeyD'],110)");check('g.open&&b.x>b.start','box still opens gate');
for(const i of [2,5,11]){
 run(`start(${i});var g=l.gates.find(g=>g.type==='timed');place(cats[0],g.plates[0]-18);tick(1)`);check('g.open&&g.remaining>2','timer trigger '+i);
 run('tick(450)');check('!g.open&&g.remaining===0','held plate cannot extend countdown '+i);
 run('place(cats[0],g.plates[0]-100);tick(2);place(cats[0],g.plates[0]-18);tick(1)');check('g.open&&g.remaining>2','rearming timer '+i);
 run("hold(['KeyD'],330)");check('g.latched&&cats[0].x>g.x','timed route can be traversed before closing '+i);
}
for(const i of [4,10]){
 run(`start(${i});var p=l.movers.find(p=>p.kind==='remote'),r=p.control;place(cats[1-r.owner],p.x+20,p.y-34);place(cats[r.owner],r.plate-18);var before=p.x;tick(120)`);check('p.x>before+90&&stands(cats[1-r.owner],p)','correct operator drives ferry '+i);
 run('var before=p.x;place(cats[r.owner],r.plate-110);tick(60)');check('p.x<before','release reverses ferry '+i);
 run('place(cats[r.owner],r.plate-18);while(p.x<p.to)tick(1);keys.add(r.owner===0?\'ArrowRight\':\'KeyD\');keys.add(r.owner===0?\'ArrowUp\':\'KeyW\');tick(140);keys.clear();keys.add(r.owner===0?\'ArrowLeft\':\'KeyA\');tick(50);keys.clear()');check('r.latched','rider disembarks and unlocks automatic ferry '+i);
 run('var before=p.x;place(cats[r.owner],r.plate-100);tick(120)');check('Math.abs(before-p.x)>30','ferry keeps moving after latch '+i);
}
for(const i of [4,10,11]){
 run(`start(${i});var p=l.movers.find(p=>p.kind==='lift');place(cats[0],p.x+8,p.y-34);tick(100)`);check('!p.active','lift requires two cats '+i);
 run('place(cats[1],p.x+64,p.y-34);tick(120)');check('p.active&&p.y<434&&cats.every(c=>stands(c,p))','lift carries two '+i);
 run("tick(270);hold(['KeyD','KeyW','ArrowRight','ArrowUp'],105)");check('cats.every(c=>c.x>p.x+p.w&&c.y<300)','upper ledge accessible '+i);
}
run('start(7);var g=l.gates[0];place(cats[1],g.plates[0]-18);tick(1)');check('!g.open','wrong cat cannot activate identity plate');run('place(cats[0],g.plates[0]-18);tick(1)');check('g.open','right cat activates identity plate');
run('start(7);var f=l.fish.find(f=>f.owner===1);place(cats[0],f.x-18,f.y-17);tick(1)');check('!f.got','wrong cat cannot collect identity fish');run('place(cats[1],f.x-18,f.y-17);tick(1)');check('f.got','right cat collects identity fish');
run('start(3);var p=l.platforms.find(p=>p.kind===\'crumble\');place(cats[0],p.x+10,p.y-34);tick(50)');check('p.timer>0&&platformSolid(p)','crumble has visible grace time');run('tick(90)');check('p.gone>0&&!platformSolid(p)','crumble vanishes after contact');run('place(cats[0],60);tick(380)');check('p.gone===0&&platformSolid(p)','crumble regenerates without restart');
run('start(8);var p=l.platforms.find(p=>p.kind===\'phase\'),safe=l.platforms.find(p=>p.kind===\'refuge\');elapsed=p.phase*2.4+.1');check('platformSolid(p)&&platformSolid(safe)','phase and refuge active');run('elapsed+=2.4');check('!platformSolid(p)&&platformSolid(safe)','phase changes but refuge remains');
run('start(5);var h=l.lasers[0];elapsed=h.period-h.offset-.1;mechanisms(0)');check('h.warning&&!h.active','laser warning before danger');run('elapsed=h.period-h.offset+.1;mechanisms(0);place(cats[0],h.x);tick(1)');check('returns===1&&cats[0].inv>0','active laser resets cat');run('elapsed=h.on-h.offset+.2;mechanisms(0);place(cats[0],h.x);var before=returns;tick(1)');check('!h.active&&returns===before','inactive laser safe');
run('start(6);var w=l.winds[0];place(cats[0],w.x+100,250);cats[0].ground=false;var before=cats[0].x;tick(20)');check('cats[0].x<before','airborne wind pushes cat');
run('start(9);var b=l.belts[0];place(cats[0],b.x+100);var before=cats[0].x;tick(15)');check('cats[0].x<before','conveyor pushes grounded cat');
// Traverse every jump in the new aerial courses using only movement/jump inputs.
run(`function jumpTo(p){
 const c=cats[0];let n=0;
 if(p.kind==='phase')while((!platformSolid(p)||2.4-elapsed%2.4<1.3)&&n++<650)tick(1);
 keys.clear();keys.add('KeyW');
 for(let i=0;i<240;i++){
  const target=p.x+p.w-38;keys.delete('KeyD');keys.delete('KeyA');
  if(c.x<target-2)keys.add('KeyD');else if(c.x>target+2)keys.add('KeyA');
  tick(1);if(i>2)keys.delete('KeyW');
  if(i>5&&c.ground&&stands(c,p)){keys.clear();return true;}
  if(returns>0){keys.clear();return false;}
 }keys.clear();return false;
}`);
for(const i of [1,3,6,8]){
 run(`start(${i});var route=l.platforms;place(cats[0],l.gaps[0].x-60);`);
 for(let j=0;j<run('route.length');j++)check(`jumpTo(route[${j}])`,'course '+(i+1)+' jump '+(j+1)+' reachable');
 check('returns===0','whole aerial route completed without falling '+i);
}
run('start(11);place(cats[0],l.gaps[0].x-60)');for(let j=0;j<7;j++)check(`jumpTo(l.platforms[${j}])`,'final chapter crumble jump '+j);
run('start(6);place(cats[0],60);place(cats[1],800);tick(1);draw()');check('split','split screen when separated');run('place(cats[1],160);tick(1)');check('!split','shared camera when reunited');
run('start(0)');const event=id=>({pointerId:id,preventDefault(){}});touch[0].pointerdown(event(1));touch[2].pointerdown(event(2));touch[4].pointerdown(event(3));check("keys.has('KeyA')&&keys.has('KeyW')&&keys.has('ArrowRight')",'multitouch for both players');touch[0].pointercancel(event(1));check("!keys.has('KeyA')&&keys.has('KeyW')",'cancel releases correct pointer');run('pause()');check('keys.size===0&&pointers.size===0','pause clears controls');run('resume();var t=elapsed;pause();tick(120)');check('elapsed===t','pause freezes challenge timers');run('help();draw();title();draw()');
console.log('PASS',checks,'checks including continuous platform-course traversals');
