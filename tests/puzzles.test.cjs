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

run(`function standAt(id,i){const n=puzzleNode(l.puzzle,id);place(cats[i],n.x-18,n.y-34)};function use(i){keys.add(i?'ArrowDown':'KeyS');tick(1);keys.clear();tick(1)};function useAt(id,i){standAt(id,i);use(i)};function collectKey(k){const key=l.puzzle.keys[k];place(cats[key.owner],key.x-18,key.y-17);tick(2)};function meet(){place(cats[0],700);place(cats[1],750);use(0)}`);
for(let i=12;i<30;i++){
 run(`start(${i});tick(2);draw()`);
 check('l.puzzle&&l.fish.length>=4&&l.ground.every(g=>g.w>0)','new chapter valid '+(i+1));
 check('l.checkpoints.every(cp=>!l.gaps.some(g=>cp.x>=g.x&&cp.x<g.x+g.w))','safe checkpoint '+i);
 run('l.fish.forEach(f=>f.got=true);place(cats[0],l.goal.x);place(cats[1],60);tick(1)');
 check("scene==='playing'",'cannot skip puzzle through exit '+i);
}
run("start(12);useAt('symbol1',0)");check('l.puzzle.progress===0','wrong sequence resets');run('var q=l.puzzle;for(let k=0;k<q.code.length;k++)useAt(\'symbol\'+q.code[k],q.ownerOrder[k])');check('q.solved','sequence solved by alternating roles');
run('start(13);var q=l.puzzle;l.boxes.forEach((b,k)=>b.x=q.plates[k]-22);tick(400)');check('!q.solved','boxes alone insufficient weight');run('q.plates.forEach((x,i)=>place(cats[i],x-18));tick(370)');check('q.solved','exact weight sustained solves');
run('start(14);collectKey(0);collectKey(1)');check('l.puzzle.keys.every(k=>k.held===k.owner)','both key owners pick up');run("useAt('socket0',0)");check('!l.puzzle.keys.some(k=>k.done)','wrong key not accepted');run("meet();useAt('socket0',0);useAt('socket1',1)");check('l.puzzle.solved','key exchange and both deliveries');
run("start(15);var q=l.puzzle;for(let k=0;k<3;k++)for(let n=0;n<q.target[k];n++)useAt('mirror'+k,1);tick(400)");check('!q.solved','mirror alignment needs live power');run("standAt('power',0);tick(370)");check('q.solved','powered mirror path solves');
run("start(16);useAt('bell0',0)");check('l.puzzle.round===0','wrong rhythm rejected');run("var q=l.puzzle;for(let k=0;k<4;k++){q.elapsed=k*2.2+1.5;useAt('bell0',0);useAt('bell1',1)}");check('q.solved','four synchronized beats solve');
run("start(17);useAt('logic0',0);useAt('logic1',1)");check('l.puzzle.solved','cooperative XOR solution');
run("start(18);var q=l.puzzle;for(let k=0;k<3;k++){if(k)useAt('route',0);useAt('portalIn',1);if(Math.abs(cats[1].x-(900+k*400-18))>1)throw Error('wrong destination');useAt('stamp'+k,1);if(k<2)useAt('return'+k,1)}");check('q.solved&&l.gates.every(g=>g.open)','portal stamps release chamber walls');
run("start(19);useAt('echo',0);standAt('seal0',0);standAt('seal1',1);tick(190)");check('l.puzzle.solved','echo supports simultaneous distant seals');run("start(19);useAt('echo',0);tick(1000)");check('l.puzzle.remaining===0&&!l.puzzle.solved','expired echo can retry');run("useAt('echo',1)");check('l.puzzle.remaining>7','echo reactivates');
run('start(20);var q=l.puzzle,p=l.movers[0];place(cats[1],p.x+35,p.y-34);place(cats[0],q.plate-18);tick(130)');check('p.y===362&&stands(cats[1],p)&&q.tokens[0].got','single weight reaches lower seal');
run('l.boxes[0].x=q.plate-22;place(cats[0],260);tick(130)');check('p.y===290&&q.tokens[1].got','box weight reaches middle seal');run('place(cats[0],q.plate-18);tick(130)');check('p.y===218','cat plus box reaches top');run("place(cats[1],950-18,191-17);tick(2);useAt('seal',1)");check('q.solved','all tower tokens and top seal');
run('start(21);var q=l.puzzle,p=l.platforms.find(p=>p.kind===\'light\');place(cats[0],p.x);tick(2)');check('platformSolid(p)','near lantern makes light bridge solid');run('place(cats[0],60)');check('!platformSolid(p)','distant lantern removes bridge');run('place(cats[0],300);place(cats[1],340);use(0)');check('q.carrier===1','lantern handoff');run('cats.forEach((c,i)=>place(c,1300+i*45));tick(2)');check('q.solved','both escort lantern to shore');
run('start(22);var q=l.puzzle,p=l.platforms.find(p=>p.kind===\'personal\')');check('puzzlePlatform(p,0)!==puzzlePlatform(p,1)','personal bridge selective');run('var before=puzzlePlatform(p,0);useAt(\'polarity0\',0)');check('puzzlePlatform(p,0)!==before','polarity swaps owner');run('for(const t of q.tokens){place(cats[t.owner],t.x-18,t.y-17);tick(2)};cats.forEach((c,i)=>place(c,1290+i*45));tick(2)');check('q.solved','each cat collects own seals');
run("start(23);var q=l.puzzle;for(let k=0;k<2;k++){const b=q.basins[k];standAt('pump'+k,b.owner);keys.add(b.owner?'ArrowDown':'KeyS');tick(220);if(b.y<440)throw Error('pump not draining');standAt('valve'+k,1-b.owner);keys.add(b.owner?'KeyS':'ArrowDown');tick(2);keys.clear();tick(1)}");check('q.solved&&q.basins.every(b=>b.drained)','alternating pump and valve roles');
run("start(24);place(cats[0],362);use(0)");check('l.puzzle.cargo.held===0','cargo pickup');run("var y=cats[0].y;hold(['KeyW'],30)");check('cats[0].y===400','carrying blocks jump');run("useAt('cargoSwitch0',0)");check('l.puzzle.mode===0','carrier cannot switch bridge');run("useAt('cargoSwitch1',1)");check('l.puzzle.mode===1','empty partner switches bridge');run("useAt('cargoEnd',0)");check('l.puzzle.solved','cargo delivery');
run("start(25);var q=l.puzzle;useAt('brake0',0);var b=l.boxes[0];place(cats[1],b.x-36);hold(['ArrowRight'],125);useAt('brake1',1);b=l.boxes[1];place(cats[0],b.x-36);hold(['KeyD'],135)");check('q.solved','both ice boxes pushed against cooperative brakes');
run("start(26);var q=l.puzzle;var program=[0,0,1,1,2,1,1,2];program.forEach((v,k)=>useAt('cmd'+v,k%2));standAt('run',0);standAt('run',1);use(0);tick(450)");check('q.solved','alternating robot program reaches target');
run("start(27);var q=l.puzzle;for(let k=0;k<3;k++)for(let j=0;j<q.target[k];j++)useAt('digit'+k,k===1?1:0);useAt('confirm0',0);useAt('confirm1',1)");check('q.solved','combined cipher clues and two confirmations');
run('start(28);var q=l.puzzle;keys.add(\'KeyS\');var before=q.worldTime;tick(200)');check('q.worldTime===before&&q.energy<2','freeze stops mechanism clock');run('var x=cats[0].x;keys.add(\'KeyD\');tick(20)');check('cats[0].x===x','timekeeper cannot move');run('keys.clear();tick(500)');check('q.energy===3.2&&q.worldTime>before','release recharges and unfreezes');run('cats.forEach((c,i)=>place(c,1330+i*45));tick(2)');check('q.solved','both reach freeze-course end');
run("start(29);var q=l.puzzle;for(let k=0;k<q.code.length;k++)useAt('finalCode'+q.code[k],q.ownerOrder[k])");check('q.stage===1&&l.gates.find(g=>g.key===\'stage1\').open','final power sequence opens first chamber');
run("collectKey(0);collectKey(1);meet();useAt('socket0',0);useAt('socket1',1)");check('q.stage===2&&l.gates.find(g=>g.key===\'stage2\').open','final exchange opens second chamber');
run("standAt('finalCharge',0);standAt('finalCharge',1);use(0);useAt('finalSeal0',0);useAt('finalSeal1',1)");check('q.solved','final synchronized charged locks');
// Every new solved state must open the final gate; both cats and fish are still required.
run('l.fish.forEach(f=>f.got=true);place(cats[0],l.goal.x);place(cats[1],l.goal.x+45);tick(2)');check("scene==='won'",'chapter 30 completes');
run('renderWin()');check("$('modal').innerHTML.includes('罐罐到手')&&$('modal').innerHTML.includes('/ 30 關')",'final screen counts 30 chapters');
console.log('PASS',checks,'puzzle checks across all 18 new chapters');
// Physics traversal of the cooperative aerial courses (no position resets between platforms).
run(`function jumpOne(i,p,holdOther=null){const c=cats[i],left=i?'ArrowLeft':'KeyA',right=i?'ArrowRight':'KeyD',jump=i?'ArrowUp':'KeyW';keys.add(jump);for(let step=0;step<250;step++){const target=p.x+p.w-38;keys.delete(left);keys.delete(right);if(c.x<target-2)keys.add(right);else if(c.x>target+2)keys.add(left);tick(1);if(step>2)keys.delete(jump);if(step>5&&stands(c,p)){keys.delete(left);keys.delete(right);keys.delete(jump);return true;}if(returns)return false;}return false;}
function jumpDuo(p){keys.add('KeyW');keys.add('ArrowUp');for(let step=0;step<250;step++){for(let i=0;i<2;i++){const left=i?'ArrowLeft':'KeyA',right=i?'ArrowRight':'KeyD',c=cats[i],target=p.x+p.w-38;keys.delete(left);keys.delete(right);if(c.x<target-2)keys.add(right);else if(c.x>target+2)keys.add(left);}tick(1);if(step>2){keys.delete('KeyW');keys.delete('ArrowUp');}if(step>5&&cats.every(c=>stands(c,p))){keys.clear();return true;}if(returns)return false;}return false;}
function walkTargets(targets,limit=1000){for(let step=0;step<limit;step++){keys.clear();let arrived=true;cats.forEach((c,i)=>{if(Math.abs(c.x-targets[i])>2){arrived=false;keys.add(c.x<targets[i]?(i?'ArrowRight':'KeyD'):(i?'ArrowLeft':'KeyA'));}});if(arrived){keys.clear();return true;}tick(1);}keys.clear();return false;}`);
run('start(21);place(cats[0],300);place(cats[1],310)');
for(let j=0;j<8;j++)check(`jumpDuo(l.platforms[${j}])`,'light bridge two-cat continuous jump '+j);
check('returns===0','lantern route has no forced fall');
run('start(22);place(cats[0],320);place(cats[1],330)');check('jumpDuo(l.platforms[0])','polarity first refuge reachable');
for(let j=1;j<7;j+=2){
 run(`var bridge=l.platforms[${j}],safe=l.platforms[${j+1}];if(!puzzlePlatform(bridge,0))use(0)`);
 check('jumpOne(0,bridge)&&jumpOne(0,safe)','first cat crosses polarity pair '+j);
 run('use(0)');check('jumpOne(1,bridge)&&jumpOne(1,safe)','partner crosses switched polarity pair '+j);
}
check('l.puzzle.tokens.every(t=>t.got)&&returns===0','both collect all personal seals along real route');
run('start(28);place(cats[0],315);place(cats[1],325)');check('jumpDuo(l.platforms[0])','time course first refuge');
for(let j=1;j<7;j+=2){
 run(`var bridge=l.platforms[${j}],safe=l.platforms[${j+1}];keys.clear();for(let n=0;n<1600&&(l.puzzle.energy<3.15||!puzzlePlatform(bridge));n++)tick(1);keys.add('KeyS');tick(1)`);
 check('jumpOne(1,bridge)&&jumpOne(1,safe)','frozen crossing second cat '+j);
 run(`keys.clear();for(let n=0;n<1600&&(l.puzzle.energy<3.15||!puzzlePlatform(bridge));n++)tick(1);keys.add('ArrowDown');tick(1)`);
 check('jumpOne(0,bridge)&&jumpOne(0,safe)','partner becomes timekeeper '+j);run('keys.clear()');
}
check('returns===0','freeze route completable through alternating timekeepers');
run("start(19);place(cats[0],322);place(cats[1],355);use(0);walkTargets([832,1202],900);tick(190)");check('l.puzzle.solved','echo timing reachable by actual walking');
run("start(24);place(cats[0],362);place(cats[1],400);use(0);walkTargets([800,822],900);useAt('cargoSwitch1',1);walkTargets([1302,1350],900);use(0)");check('l.puzzle.solved&&returns===0','fragile cargo crosses both bridges without jumping');
run("start(29);var q=l.puzzle;for(let k=0;k<q.code.length;k++)useAt('finalCode'+q.code[k],q.ownerOrder[k]);collectKey(0);collectKey(1);meet();useAt('socket0',0);useAt('socket1',1);standAt('finalCharge',0);standAt('finalCharge',1);use(0);walkTargets([2212,2462],450);keys.add('KeyS');keys.add('ArrowDown');tick(1);keys.clear()");check('q.solved&&q.remaining>0','final countdown reachable by simultaneous walking and interaction');
console.log('PASS',checks,'puzzle checks, including cooperative physics traversals');
run('start(14);collectKey(0);collectKey(1);place(cats[0],700);place(cats[1],750);keys.add(\'KeyS\');keys.add(\'ArrowDown\');tick(1);keys.clear();tick(1)');check('l.puzzle.keys.every(k=>k.held===1-k.owner)','simultaneous interaction swaps keys only once');
run('start(21);place(cats[0],300);place(cats[1],340);keys.add(\'KeyS\');keys.add(\'ArrowDown\');tick(1);keys.clear();tick(1)');check('l.puzzle.carrier===1','simultaneous lantern handoff happens once');
run('start(19);standAt(\'echo\',0)');touch[6].pointerdown({pointerId:71,preventDefault(){}});run('tick(1)');check('l.puzzle.remaining>7','mobile interact activates puzzle');touch[6].pointercancel({pointerId:71});check('!keys.has(\'KeyS\')','mobile interact cancellation clears state');
console.log('FINAL',checks,'puzzle checks passed');

run("start(11);scene='won';renderWin();$('next').onclick()");check("level===12&&l.puzzle.type==='sequence'",'chapter 12 continues into new puzzle campaign');
run("start(29);scene='won';renderWin();$('next').onclick()");check("level===0&&scene==='playing'",'chapter 30 restarts adventure correctly');
console.log('FINAL',checks,'puzzle and progression checks passed');
