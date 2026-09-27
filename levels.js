'use strict';
// Each chapter introduces a mechanism, then combines it with earlier ones.
const chapters=[
 ['客廳搭檔','先練默契：替隊友守住踏板。',['gate'],0,'合作入門'],
 ['書架登頂','連續窄台跳躍，跳到最高處再下來。',['stairs'],0,'精準跳躍'],
 ['紙箱倒數計時','推箱解門，再搶在倒數結束前衝刺。',['box','timed'],1,'推箱 × 限時門'],
 ['快塌了，快跑！','踏上紅磚就開始崩落，兩隻要抓好間距。',['crumble'],1,'崩落平台'],
 ['你開船，我過河','一隻在岸上控制渡船，另一隻上岸解鎖。',['remote','lift'],1,'遙控渡船'],
 ['紅光停，綠光行','觀察雷射節奏，在安全空檔穿越。',['lasers','timed'],2,'雷射 × 倒數'],
 ['逆風屋頂','起跳後會被風吹，落點要提早修正。',['wind'],2,'風場 × 高低台'],
 ['萊恩辛巴換班日','先由萊恩開路，再換辛巴接手；各自找自己的魚乾。',['identity'],2,'指定角色接力'],
 ['忽隱忽現的路','青色與粉色平台輪流出現，在白色小島等下一拍。',['phase'],3,'節奏跳躍'],
 ['輸送帶大逃脫','逆向輸送帶與巡邏機，把握空檔連跳。',['conveyor','lasers'],3,'逆向傳送 × 巡邏'],
 ['高空調度員','先幫隊友開船，再一起穿越換色平台。',['remote','phase','lift'],3,'遠距合作 × 節奏'],
 ['最後的罐罐試煉','連續崩落、雷射、限時門，最後一起搭電梯回家。',['crumble','lasers','timed','lift'],3,'終極綜合挑戰']
];
function makeLevel(index){
 if(index>=12)return makePuzzleLevel(index);
 const [name,hint,modules,tier]=chapters[index];
 const l={name,hint,tier,width:0,platforms:[],gaps:[],gates:[],boxes:[],movers:[],checkpoints:[],fish:[],signs:[],hazards:[],lasers:[],winds:[],belts:[],remotes:[],goal:null};
 const snack=(x,y=407)=>l.fish.push({x,y,got:false});
 const ledge=(x,y,w,extra={})=>l.platforms.push({x,y,w,h:12,oneway:true,...extra});
 if(index===0){ledge(180,371,120);snack(237,347);}snack(115);let x=index===0?370:270;
 modules.forEach((type,n)=>{
  const begin=x;l.checkpoints.push({x:x-65,y:434,active:false});
  if(type==='gate'||type==='widegate'){
   const wide=type==='widegate', gx=x+(wide?660:250);
   l.gates.push({type:'relay',x:gx,y:170,w:18,h:264,plates:[x+35],switchX:gx+100,open:false,latched:false});
   l.signs.push({x:x+30,text:'薄荷踏板：一隻留守，另一隻碰星星'});
   if(wide){ledge(x+220,371,115);snack(x+275,347);}
   snack(gx-65);snack(gx+110);x=gx+300;
  }else if(type==='duo'){
   l.gates.push({type:'duo',x:x+300,y:170,w:18,h:264,plates:[x+70,x+215],latched:false,open:false});
   l.signs.push({x:x+30,text:'兩塊金色踏板，要兩隻貓一起踩'});snack(x+365);x+=500;
  }else if(type==='box'){
   l.boxes.push({x:x+60,y:390,w:44,h:44,min:x+10,max:x+235,start:x+60});
   l.gates.push({type:'box',x:x+340,y:170,w:18,h:264,plates:[x+205],open:false,latched:false});
   l.signs.push({x:x+20,text:'走向紙箱推動它，推到橘色踏板上'});snack(x+280,362);ledge(x+264,387,62);snack(x+405);x+=550;
  }else if(type==='stairs'||type==='wind'){
   const start=x+90,gap=type==='wind'?860:700;
   l.gaps.push({x:start,w:gap});
   const heights=type==='wind'?[382,326,268,326,382,322,375]:[382,322,262,202,262,322];
   const spacing=type==='wind'?120:124;
   heights.forEach((y,k)=>{const px=start-18+k*spacing;ledge(px,y,type==='wind'?66:60);snack(px+28,y-25);});
   if(type==='wind')l.winds.push({x:start,y:170,w:gap,h:265,force:-58,period:5});
   // The final low shelf leaves a reachable descent to shore.
   ledge(start+gap-68,382,80);snack(start+gap-25,357);
   l.signs.push({x:x+10,text:type==='wind'?'半空會被陣風吹動；落腳後再判斷下一跳':'窄平台高低交錯；按一下跳，落穩再跳下一格'});x=start+gap+135;
  }else if(type==='crumble'){
   const start=x+90,gap=700;l.gaps.push({x:start,w:gap});
   for(let k=0;k<7;k++){const y=392-(k%2)*54;ledge(start-20+k*110,y,70,{kind:'crumble',delay:tier===3?.72:1.05,timer:0,gone:0});snack(start+10+k*110,y-24);}
   l.signs.push({x:x+10,text:'紅磚踩下後會崩落，3 秒後重生；兩隻可貼近連跳或分批過'});x=start+gap+135;
  }else if(type==='phase'){
   const start=x+90,gap=850;l.gaps.push({x:start,w:gap});
   for(let k=0;k<7;k++){const y=388-(k%2)*44;ledge(start-20+k*125,y,78,k%2?{kind:'phase',phase:Math.floor(k/2)%2}:{kind:'refuge'});snack(start+17+k*125,y-24);}
   l.signs.push({x:x+10,text:'青／粉平台每 2.4 秒輪換；白色平台永遠安全，閃爍時先等'});x=start+gap+140;
  }else if(type==='timed'){
   const gx=x+430;
   l.gates.push({type:'timed',x:gx,y:170,w:18,h:264,plates:[x+45],switchX:gx+70,open:false,latched:false,remaining:0,duration:tier===3?2.8:3.3,wasPressed:false});
   for(let k=0;k<2;k++){ledge(x+145+k*140,382,58);snack(x+174+k*140,357);}
   l.signs.push({x:x+10,text:'踩下黃色鐘只開門幾秒！離開踏板再踩可重啟，過門碰星星固定'});snack(gx+75);x=gx+185;
  }else if(type==='lasers'){
   for(let k=0;k<4;k++){
    l.lasers.push({x:x+95+k*140,y:210,w:16,h:224,period:3.6-tier*.2,on:1.5+tier*.08,offset:k*.65,active:false,warning:false});
    snack(x+55+k*140,407);
   }
   l.signs.push({x:x+5,text:'雷射紅色會重生，綠色可通過；虛線閃爍代表即將亮起'});x+=680;
  }else if(type==='remote'){
   const start=x+190,gap=420,control={plate:x+40,switchX:start+gap+90,latched:false,owner:index===10?1:0};l.remotes.push(control);l.gaps.push({x:start,w:gap});
   l.movers.push({id:'m'+n,kind:'remote',control,x:start-35,y:412,w:108,h:14,oneway:true,from:start-35,to:start+gap-72,speed:106,dir:1,dx:0,dy:0});
   l.signs.push({x:x+5,text:(control.owner?'辛巴':'萊恩')+'踩住藍色踏板，船向右；鬆開就向左。隊友過河碰星星後自動往返'});snack(start+gap/2,378);snack(start+gap+95);x=start+gap+205;
  }else if(type==='identity'){
   for(let k=0;k<2;k++){
    const b=x+k*660; l.gates.push({type:'identity',owner:k,x:b+440,y:170,w:18,h:264,plates:[b+35],switchX:b+520,open:false,latched:false});
    for(let j=0;j<3;j++){const y=374-(j%2)*60;ledge(b+135+j*95,y,55);l.fish.push({x:b+160+j*95,y:y-24,owner:1-k,got:false});}
    l.signs.push({x:b,text:(k?'換辛巴':'萊恩')+'踩自己的踏板；'+(k?'萊恩':'辛巴')+'收同色魚乾，再過門碰星星'});
   }x+=1350;
  }else if(type==='conveyor'){
   l.belts.push({x:x+55,y:434,w:620,speed:-96});
   for(let k=0;k<4;k++){ledge(x+100+k*150,365-(k%2)*52,64);snack(x+132+k*150,341-(k%2)*52);}
   for(let k=0;k<2;k++)l.hazards.push({from:x+50+k*320,to:x+325+k*320,x:x+150+k*320,y:414,w:36,h:20,speed:142,dir:k?1:-1});
   l.signs.push({x:x+5,text:'地面輸送帶會往後拉；用跳躍避開巡邏機，走上層比較快'});x+=800;
  }else if(type==='moving'){
   const gap=250+tier*45, start=x+125;
   l.gaps.push({x:start,w:gap});
   l.movers.push({id:'m'+n,kind:'ferry',x:start-35,y:412,w:112-tier*4,h:14,oneway:true,from:start-35,to:start+gap-72,speed:48+tier*12,dir:1,dx:0,dy:0});
   l.signs.push({x:x+15,text:'等藍色平台靠岸，搭到對面再跳'});
   snack(start+gap/2,378);snack(start+gap+80);x=start+gap+220;
  }else if(type==='sweep'){
   l.hazards.push({from:x+40,to:x+350,x:x+40,y:414,w:36,h:20,speed:65+tier*24,dir:1});
   for(let k=0;k<3;k++){ledge(x+55+k*110,365-(k%2)*55,75);snack(x+90+k*110,341-(k%2)*55);}
   l.signs.push({x:x+10,text:'跳過掃地機，也可以走上方的小平台'});x+=490;
  }else if(type==='lift'){
   l.movers.push({id:'m'+n,kind:'lift',x:x+95,y:434,w:130,h:14,oneway:true,from:434,to:270,speed:55+tier*5,dir:-1,dx:0,dy:0,active:false,wait:0});
   l.signs.push({x:x+5,text:'兩隻一起站上紫色升降梯，啟動後循環往返'});
   ledge(x+246,270,390);snack(x+307,245);snack(x+440,245);x+=565;l.goal={x:x,y:270};
  }
  if(type!=='lift')l.checkpoints.push({x:x-55,y:434,active:false});
 });
 if(!l.goal){l.goal={x:x+75,y:434};snack(x+25);x+=150;}
 l.width=x+180;
 let end=0;l.ground=[];for(const g of l.gaps){l.ground.push({x:end,y:434,w:g.x-end,h:100});end=g.x+g.w;}l.ground.push({x:end,y:434,w:l.width-end,h:100});
 return l;
}
