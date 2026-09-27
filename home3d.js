'use strict';
// Small self-contained perspective renderer. WebGL depth buffering keeps every wall,
// door and furnishing opaque. A triangle fallback supports non-WebGL devices.
let home3d=null;
const H3_SCALE_CM=.62,H3_EYE=33,H3_CEILING=435,H3_CAT_SCALE=.74;
function h3Color(hex){const n=parseInt(hex.replace('#',''),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function h3Mesh(){return{positions:[],colors:[],surfaces:[],joints:[],triangles:[],material:6,part:0};}
function h3Normal(v){const a=v[1].map((x,i)=>x-v[0][i]),b=v[2].map((x,i)=>x-v[0][i]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...n)||1;return n.map(x=>x/len);}
function h3Quad(m,v,color,shade=1){const rgb=h3Color(color).map(x=>Math.min(1,x*shade)),n=h3Normal(v);for(const ix of Array.from({length:v.length-2},(_,i)=>[0,i+1,i+2])){const tri=ix.map(i=>v[i]);m.triangles.push({v:tri,color:rgb});for(const p of tri){m.positions.push(...p);m.colors.push(...rgb);m.surfaces.push(...n,m.material);m.joints.push(m.part||0);}}}
// Scene coordinates match collision coordinates: x, y on floor and z upwards.
function h3Box(m,x,y,z,w,d,h,color,angle=0){const ca=Math.cos(angle),sa=Math.sin(angle);const pt=(a,b,c)=>[x+a*ca-b*sa,y+a*sa+b*ca,z+c];
 const v=[pt(0,0,0),pt(w,0,0),pt(w,d,0),pt(0,d,0),pt(0,0,h),pt(w,0,h),pt(w,d,h),pt(0,d,h)];
 for(const [face,shade]of [[[0,3,2,1],.55],[[0,1,5,4],.80],[[1,2,6,5],.70],[[2,3,7,6],.91],[[3,0,4,7],.76],[[4,5,6,7],1.06]])h3Quad(m,face.map(i=>v[i]),color,shade);
}
// Gently faceted curved surfaces keep only a restrained pixel / low-poly character.
function h3Surface(m,vertices,normals,color,shade=1){for(let t=1;t<vertices.length-1;t++){const ids=[0,t,t+1],tri=ids.map(i=>vertices[i]),colors=ids.map(i=>{const base=h3Color(Array.isArray(color)?color[i]:color),n=normals[i],light=.72+.26*Math.max(0,n[2])+.14*Math.max(0,-n[0]*.5-n[1]*.75+n[2]*.45);return base.map(x=>Math.min(1,x*light*shade));});m.triangles.push({v:tri,color:colors[0]});for(let k=0;k<3;k++){m.positions.push(...tri[k]);m.colors.push(...colors[k]);m.surfaces.push(...normals[ids[k]],m.material);m.joints.push(m.part||0);}}}
function h3Ellipsoid(m,x,y,z,rx,ry,rz,color,angle=0,paint=null,power=1,segments=24,rings=16){
 const ca=Math.cos(angle),sa=Math.sin(angle),pow=v=>Math.abs(v)<1e-10?0:Math.sign(v)*Math.pow(Math.abs(v),power);
 const point=(u,v)=>{const a=u*Math.PI*2,b=v*Math.PI-Math.PI/2,n=[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)],p=[pow(n[0])*rx,pow(n[1])*ry,pow(n[2])*rz];return{p:[x+p[0]*ca-p[1]*sa,y+p[0]*sa+p[1]*ca,z+p[2]],n:[n[0]*ca-n[1]*sa,n[0]*sa+n[1]*ca,n[2]],local:p};};
 for(let j=0;j<rings;j++)for(let k=0;k<segments;k++){const q=[point(k/segments,j/rings),point((k+1)/segments,j/rings),point((k+1)/segments,(j+1)/rings),point(k/segments,(j+1)/rings)],mid=q.reduce((r,p)=>r.map((x,i)=>x+p.local[i]/4),[0,0,0]);h3Surface(m,q.map(p=>p.p),q.map(p=>p.n),paint?q.map(p=>paint(...p.local)):color);}
}
function h3Tube(m,points,radius,color,sides=12){for(let j=0;j<points.length-1;j++){const a=points[j],b=points[j+1],d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d);if(len<.01)continue;const axis=d.map(v=>v/len),ref=Math.abs(axis[2])>.9?[1,0,0]:[0,0,1],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],u=cross(axis,ref),ul=Math.hypot(...u);u.forEach((v,i)=>u[i]=v/ul);const v=cross(axis,u);for(let k=0;k<sides;k++){const at=(p,k,ring)=>{const rad=typeof radius==='function'?radius(ring/(points.length-1)):radius,t=k*Math.PI*2/sides,n=u.map((x,i)=>x*Math.cos(t)+v[i]*Math.sin(t));return{p:p.map((x,i)=>x+n[i]*rad),n};};const q=[at(a,k,j),at(b,k,j+1),at(b,k+1,j+1),at(a,k+1,j)];h3Surface(m,q.map(o=>o.p),q.map(o=>o.n),typeof color==='function'?color(j):color);}}}
function h3RoundBox(m,x,y,z,w,d,h,color,r=.22){h3Ellipsoid(m,x+w/2,y+d/2,z+h/2,w/2,d/2,h/2,color,0,null,r,32,18);}
function h3Furniture(m,f){m.material=({table:1,catwalk:1,platform:2,post:2,sofa:2,hammock:2,mattress:2,pillow:2,water:8,sink:3,toilet:7,washer:3,fridge:3,screen:4,rug:2,wardrobe:1,counter:7})[f.type]||6;const b=(x,y,z,w,d,h,col=f.color)=>h3Box(m,f.x+x,f.y+y,(f.z||0)+z,w,d,h,col);const top=f.h;
 if(f.type==='table'){h3RoundBox(m,f.x,f.y,top-9,f.w,f.d,9,'#ab8c68',.075);for(const x of[8,f.w-20])for(const y of[8,f.d-20])b(x,y,0,12,12,top-9,'#695d4a');return;}
 if(f.type==='platform'||f.type==='catwalk'){b(0,0,0,f.w,f.d,f.h);b(4,4,f.h,f.w-8,f.d-8,1,'#decbae');if(f.type==='catwalk'){b(6,5,-20,7,f.d-10,20,'#797365');b(f.w-13,5,-20,7,f.d-10,20,'#797365');}return;}
 if(f.type==='post'){h3Tube(m,[[f.x+f.w/2,f.y+f.d/2,0],[f.x+f.w/2,f.y+f.d/2,f.h]],f.w/2,'#bba883',12);for(let z=4;z<f.h;z+=6)h3Ellipsoid(m,f.x+f.w/2,f.y+f.d/2,z,f.w/2+.4,f.d/2+.4,1,'#a99270',0,null,1,12,4);return;}
 if(f.type==='sofa'){b(5,5,0,f.w-10,f.d-10,12,'#4b4a35');h3RoundBox(m,f.x,f.y,10,f.w,f.d,top-10,'#889951',.24);const back=f.id==='sofa-back';for(let x=7;x<f.w-15;x+=92){const width=Math.min(85,f.w-x-7);if(back){h3RoundBox(m,f.x+x,f.y+f.d-35,56,width,36,top-58,'#a5b572',.38);h3RoundBox(m,f.x+x,f.y+10,top-29,width,50,28,'#b0bd7c',.48);}else{h3RoundBox(m,f.x+x,f.y+4,top-24,width,f.d-8,24,'#a7b673',.3);for(let y=18;y<f.d-20;y+=55)b(x+width*.5,y,top-.6,1.1,13,.7,'#91a061');}}return;}
 if(f.type==='hammock'){for(const x of[0,f.w-9])b(x,0,0,9,f.d,top,'#a48c64');b(9,5,top-12,f.w-18,f.d-10,7,'#b1c5af');return;}
 if(f.type==='tunnel'){b(0,0,0,f.w,8,40);b(0,f.d-8,0,f.w,8,40);b(0,0,40,f.w,f.d,8);return;}

 if(f.type==='mattress'||f.type==='pillow'){h3RoundBox(m,f.x,f.y,f.z,f.w,f.d,top,f.type==='pillow'?'#dfb3c1':'#ca8c9e',.24);if(f.type==='mattress'){for(let x=17;x<f.w-10;x+=53)for(let y=18;y<f.d-10;y+=48){h3Ellipsoid(m,f.x+x,f.y+y,f.z+top+.4,3,4,.4,'#e5b8c4',0,null,1,8,4);b(x-3,y,top+.3,7,.7,.2,'#b47d91');}b(4,f.d-1,top-7,f.w-8,1,1,'#e0abba');}return;}
 if(f.type==='toilet'){h3RoundBox(m,f.x+4,f.y,0,f.w-8,25,top+22,'#e6e5d9',.18);h3Ellipsoid(m,f.x+f.w/2,f.y+58,top-10,f.w/2,34,20,'#e9eadf');h3Ellipsoid(m,f.x+f.w/2,f.y+59,top+8,f.w/2-4,29,3,'#f3f1e6');h3Ellipsoid(m,f.x+f.w/2,f.y+59,top+10,f.w/2-10,22,1,'#9dadaa');h3RoundBox(m,f.x+15,f.y+27,0,f.w-30,47,top-8,'#dcdfd5',.4);return;}
 if(f.type==='water'){h3RoundBox(m,f.x,f.y,0,f.w,f.d,top,'#cbdedc',.4);h3Ellipsoid(m,f.x+f.w/2,f.y+f.d/2,top,f.w/2-5,f.d/2-5,2,'#82b8c6');h3Ellipsoid(m,f.x+f.w/2,f.y+f.d/2,top+4,5,5,8,'#eaf1e8');return;}
 if(f.type==='feeder'){h3RoundBox(m,f.x,f.y,0,f.w,f.d,top,'#e1e6dc',.25);h3RoundBox(m,f.x+1,f.y+1,top-5,f.w-2,f.d-2,5,'#c4ccc3',.4);b(12,f.d,15,24,1,14,'#48594f');h3Ellipsoid(m,f.x+f.w/2,f.y+f.d+15,4,21,18,4,'#abb7aa');for(let k=0;k<10;k++)h3Ellipsoid(m,f.x+12+k%4*7,f.y+f.d+6+Math.floor(k/4)*8,7,2.5,2.3,2,'#a27c4b',0,null,1,8,4);return;}
 if(f.type==='fridge'){h3RoundBox(m,f.x,f.y,0,f.w,f.d,top,'#ced5d2',.07);h3RoundBox(m,f.x+1,f.y+f.d-4,4,f.w-2,7,top*.39-5,'#d6ddda',.12);h3RoundBox(m,f.x+1,f.y+f.d-4,top*.4,f.w-2,7,top*.6-3,'#dbe1dc',.12);b(12,f.d+4,top*.4-3,73,2,2,'#8a9690');h3Tube(m,[[f.x+80,f.y+f.d+7,top*.58],[f.x+80,f.y+f.d+8,top*.76]],2.5,'#909b96',12);return;}
 if(f.type==='washer'){h3RoundBox(m,f.x,f.y,0,f.w,f.d,top,'#d6dcd6',.10);h3RoundBox(m,f.x+5,f.y+4,top-8,f.w-10,f.d-8,8,'#aebbb8',.16);b(12,16,top+1,f.w-24,f.d-39,1,'#718986');b(16,20,top+2,f.w-32,f.d-48,1,'#a2b8b4');b(8,f.d-19,top+2,f.w-16,12,2,'#a5b0aa');for(let x=15;x<80;x+=14)b(x,f.d-16,top+4,6,4,1,'#516b63');b(4,f.d,12,f.w-8,2,1,'#a6afa6');return;}
 if(f.type==='sink'){const z=f.z+top;h3RoundBox(m,f.x,f.y,f.z,f.w,f.d,top,'#d5dfd9',.17);h3Ellipsoid(m,f.x+f.w/2,f.y+f.d/2,z+1,f.w*.42,f.d*.39,2,'#79958f');h3Ellipsoid(m,f.x+f.w/2,f.y+f.d/2,z+2,f.w*.32,f.d*.29,1,'#9fb4ad');h3Tube(m,[[f.x+f.w/2,f.y+8,z],[f.x+f.w/2,f.y+8,z+23],[f.x+f.w/2,f.y+15,z+30],[f.x+f.w/2,f.y+28,z+27]],2.4,'#d3dedb',16);return;}
 if(f.type==='tunnel'){return;}
 b(0,0,0,f.w,f.d,top);
 if(f.type==='wardrobe'){b(99,f.d,4,91,2,top-8,'#50525a');for(const x of[90,193,267])b(x,f.d+2,120,5,4,62,'#343d3c');b(0,f.d,top-40,f.w,2,2,'#b0aea5');}
 if(f.type==='counter'){for(let x=3;x<f.w;x+=90){b(x,f.d,0,2,2,top,'#a3aaa8');b(x+25,f.d+2,top-27,38,4,4,'#757d7d');}b(-3,-3,top,f.w+6,f.d+6,6,'#b5b9b3');}
 if(f.type==='fridge'){b(1,f.d,top*.4,f.w-2,2,3,'#8e9998');b(f.w-18,f.d+2,top*.57,5,5,40,'#75817e');}
 if(f.type==='washer'){b(17,f.d,23,f.w-34,2,78,'#657a80');b(26,f.d+3,32,f.w-52,2,58,'#b0d0d6');b(9,f.d,top-22,f.w-18,3,12,'#b6bdb6');for(let x=20;x<75;x+=16)b(x,f.d+3,top-19,6,3,6,'#64746e');}
 if(f.type==='feeder'){b(8,5,top,f.w-16,f.d-10,4,'#f2f3e9');b(10,f.d,14,f.w-20,2,19,'#3b4e45');b(4,f.d+2,0,f.w-8,29,7,'#98aa9d');for(let i=0;i<7;i++)b(10+i%3*9,f.d+7+Math.floor(i/3)*7,7,5,5,3,'#a67849');b(20,f.d+1,top-15,7,2,5,'#9dd9b1');}
 if(f.type==='water'){b(4,4,top,f.w-8,f.d-8,2,'#65b6c9');b(23,18,top,8,8,11,'#ecf6f1');}
 if(f.type==='sink'){b(8,9,top,f.w-16,f.d-18,2,'#708a8e');b(f.w/2,2,top,5,6,28,'#c9d4d0');b(f.w/2,2,top+26,5,24,4,'#c9d4d0');}
 if(f.type==='stove'){for(const x of[10,43])b(x,9,top,23,31,2,'#17262b');}
 if(f.type==='toilet'){b(3,0,top-20,f.w-6,22,47,'#edeae0');b(12,30,top,f.w-24,f.d-41,2,'#b7c5c3');}
 if(f.type==='mattress'){b(0,0,top-4,f.w,f.d,3,'#c97d95');for(let x=15;x<f.w;x+=58)for(let y=75;y<f.d;y+=53)b(x,y,top,5,8,1,'#eac3cc');}
 if(f.type==='plant'){b(6,6,0,f.w-12,f.d-12,32,'#a67c5d');b(13,13,32,f.w-26,f.d-26,40,'#4b7850');}
 if(f.type==='screen')b(4,f.d,4,f.w-8,1,top-8,'#1e3037');
}
function h3BuildStatic(){const m=h3Mesh();
 for(const r of HOME_LAYOUT.rooms){m.material=r.floor==='wood'?1:7;h3Box(m,r.x,r.y,-9,r.w,r.d,9,r.color);h3Box(m,r.x,r.y,H3_CEILING,r.w,r.d,9,'#e7e4d9');
  const wood=r.floor==='wood',step=wood?32:65;
  if(wood){for(let y=r.y;y<r.y+r.d;y+=32)for(let x=r.x;x<r.x+r.w;x+=160){const row=Math.floor((y-r.y)/32),seed=Math.sin(x*.17+y*.39),col=homeShade('#a88563',Math.round(seed*10)),w=Math.min(159,r.x+r.w-x),d=Math.min(31,r.y+r.d-y);h3Quad(m,[[x,y,.12],[x+w,y,.12],[x+w,y+d,.12],[x,y+d,.12]],col);}}

  if(!wood)for(let y=r.y;y<r.y+r.d;y+=step)h3Box(m,r.x,y,.08,r.w,.65,.1,wood?'#937458':'#a7a294');
  for(let x=r.x;x<r.x+r.w;x+=wood?190:65){if(!wood)h3Box(m,x,r.y,.08,.7,r.d,.1,'#a7a294');}
 }
 m.material=6;for(const w of home.walls){h3Box(m,w.x,w.y,0,w.w,w.d,H3_CEILING,'#dfdfd4');h3Box(m,w.x-1,w.y-1,0,w.w+2,w.d+2,13,'#8f9187');}
 // Complete lintels and jambs keep walls opaque above each door opening.
 for(const d of home.doors){h3Box(m,d.x,d.y,340,d.w,d.d,H3_CEILING-340,'#dfdfd4');const vertical=d.axis==='y';for(const off of[0,vertical?d.d-4:d.w-4])h3Box(m,d.x+(vertical?0:off)-2,d.y+(vertical?off:0)-2,0,vertical?d.w+4:4,vertical?4:d.d+4,340,'#696f6b');}
 for(const f of home.furniture){h3Furniture(m,f);if(['sofa','wardrobe','counter','bed','fridge'].includes(f.type)){m.material=0;const room=homeRoom({x:f.x+f.w/2,y:f.y+f.d/2});for(let k=3;k>=1;k--)h3Quad(m,[[f.x-k*2,f.y-k*2,.22+(4-k)*.01],[f.x+f.w+k*2,f.y-k*2,.22+(4-k)*.01],[f.x+f.w+k*2,f.y+f.d+k*2,.22+(4-k)*.01],[f.x-k*2,f.y+f.d+k*2,.22+(4-k)*.01]],homeShade(room?.color||'#a88563',-36+k*8));}}
 m.material=6;
 // Living room window and pale timber blinds from the film, above the green sofa.
 h3Box(m,185,10,154,350,5,214,'#95b8c5');for(let x=185;x<535;x+=87)h3Box(m,x,16,150,4,5,224,'#6f7b76');for(let z=161;z<360;z+=16)h3Box(m,179,23,z,362,5,4,'#c0ad87');
 h3Box(m,590,16,350,166,26,52,'#eef0e6');h3Box(m,598,44,352,150,2,9,'#818e89');
 // Bedroom: slatted dark glazed door, air conditioner, contrasting wardrobe.
 h3Box(m,8,1030,30,5,175,307,'#394845');for(let z=62;z<315;z+=22)h3Box(m,15,1040,z,3,155,8,'#a4c1bd');h3Box(m,8,795,350,25,145,47,'#dddbc8');
 // Kitchen backsplash, hanging cabinets, exhaust and utensils.
 h3Box(m,1190,12,141,408,4,285,'#e7e9df');for(let x=1190;x<1600;x+=61)h3Box(m,x,18,142,1,2,280,'#abb3af');for(let z=141;z<425;z+=61)h3Box(m,1190,18,z,408,2,1,'#abb3af');
 h3Box(m,1200,20,265,355,74,114,'#e0e4dc');for(let x=1220;x<1540;x+=90)h3Box(m,x,95,274,42,4,4,'#6e7b78');h3Box(m,1415,25,224,140,90,34,'#899895');
 // Bathroom mirrors and dark tiled shower. No invisible cutaway walls.
 for(const [x,y]of[[1688,18],[1208,1350]]){h3Box(m,x,y,155,105,4,115,'#a8c1c4');h3Box(m,x-5,y-1,151,115,2,4,'#ddddce');}
 for(let z=15;z<430;z+=56)h3Box(m,1652,18,z,370,1,1,'#9fa6a1');
 h3Box(m,1760,22,12,245,5,415,'#6d554d');for(let x=1760;x<2000;x+=35)h3Box(m,x,28,12,2,2,415,'#b1a298');h3Box(m,1875,35,120,5,8,210,'#b4c6c6');h3Box(m,1850,30,325,45,22,5,'#bbc8c7');
 // Red lattice on the balcony, with tiled coping at a realistic waist height.
 for(let y=530;y<1340;y+=55){h3Box(m,2009,y,20,19,12,145,'#b57164');h3Box(m,2009,y+12,45,19,40,12,'#b57164');h3Box(m,2009,y+12,105,19,40,12,'#b57164');}h3Box(m,2000,516,169,35,820,12,'#d8d5c5');h3Box(m,2030,518,184,2,820,238,'#a6c9d4');
 // Subtle room-specific fixtures: outlet plates, window frames and cabinet seams.
 for(const [x,y]of[[839,980],[839,380]]){h3RoundBox(m,x-2,y,60,3,22,29,'#efeee3',.18);h3Box(m,x-4,y+6,71,1,2,5,'#777e77');h3Box(m,x-4,y+15,71,1,2,5,'#777e77');}
 
 return m;
}
function h3Mix(a,b,t){const x=h3Color(a),y=h3Color(b);return '#'+x.map((v,i)=>Math.round((v+(y[i]-v)*clamp(t,0,1))*255).toString(16).padStart(2,'0')).join('');}
function h3Cat(m,c,i){const vertexStart=m.positions.length,triangleStart=m.triangles.length;m.material=5;m.part=0;const catTime=c.model?0:home.time;const angle=c.heading??home.yaw??0,ca=Math.cos(angle),sa=Math.sin(angle),fur=i?'#c99450':'#f4f0e5',dark=i?'#95642f':'#51483a',cream=i?'#e5c18c':'#fff9ed';
 const moving=!!c.moving,phase=catTime*12,breath=Math.sin(catTime*2)*.45,bob=moving?Math.sin(phase*2)*.65:breath,crouch=!c.ground?-4:0;
 const point=(x,y,z)=>[c.x+x*ca-y*sa,c.y+x*sa+y*ca,c.z+z];
 const ell=(x,y,z,rx,ry,rz,col,paint=null,seg=24)=>h3Ellipsoid(m,...point(x,y,z+bob+crouch),rx,ry,rz,col,angle,paint,1,seg,paint?22:14);
 const tube=(pts,r,col,sides=8)=>h3Tube(m,pts.map(p=>point(...p)),r,col,sides);
 const bodyPaint=(x,y,z)=>{if(!i){const white=clamp((x-4)/7,0,1)+clamp((-z-4)/7,0,1)+clamp((Math.sin(x*.14+y*.08)-.9)*5,0,1),stripe=clamp((Math.sin(x*.53+y*.12+Math.sin(z*.21))-.27)*2.8,0,1);return h3Mix(h3Mix('#9d8561','#4b4133',stripe),cream,white);}const stripe=clamp((Math.sin(x*.62+y*.10+Math.sin(z*.28))-.44)*2.3,0,1);return h3Mix(h3Mix(fur,'#ae804c',stripe),cream,clamp((-z-9)/7,0,.65));};
 ell(-6,0,30,i?34:31,i?11.8:16.5,i?14.5:18,fur,bodyPaint,32);
 // Forelegs and hind legs animate in opposing pairs, paws remain at floor contact.
 for(const [x,y,phaseOffset]of[[-24,-10,0],[-24,10,Math.PI],[17,-10,Math.PI],[17,10,0]]){m.part=x<0?(y<0?1:2):(y<0?3:4);const swing=moving?Math.sin(phase+phaseOffset)*6:0,lift=moving?Math.max(0,Math.cos(phase+phaseOffset))*4:0,leg=i?fur:cream;
 ell(x,y,18,x<0?8:5.8,5.5,12,leg);tube([[x,y,23+crouch],[x+swing*.45,y,12],[x+swing,y,5+lift]],i?3.9:5.2,leg);ell(x+2+swing,y,4+lift,7,5.4,4,leg,null,12);
 if(i)for(let z=10;z<23;z+=7)ell(x+swing*.2,y,z,4.2,5.8,1.1,dark,null,12);}
 m.part=0;ell(18,0,32,i?10.5:16,i?11.8:19,i?14:23,cream);
 if(!i)for(let k=0;k<12;k++){const t=k/12*Math.PI*2;ell(16+Math.cos(t)*5,Math.sin(t)*15,25+Math.cos(t*2)*5,6,4.5,11,cream,null,12);}
 // A tapered face, narrower jaw and continuous bridge replace the round toy-like head.
 ell(26,0,46,i?13:14,i?11.5:12.4,i?13.5:14,fur,(x,y,z)=>{
  if(!i){const blaze=2.5+Math.max(0,9-z)*.43;if((x>0&&Math.abs(y)<blaze)||z<-4)return cream;
   const stripe=clamp((Math.sin(y*.83+z*.21)-.15)*1.7,0,1);return h3Mix('#a58c67',dark,stripe);}
  if(z<-7)return cream;return h3Mix(fur,dark,z>3?clamp((Math.sin(y*.89+x*.3)-.2)*1.7,0,1):0);
 },36);
 ell(34,0,43.5,6.4,9.6,8,i?fur:cream);
 ell(36,0,44,3.5,i?3.2:3.5,7,i?fur:cream);
 // Triangular outer ears with inset pink pinnae, rather than square blocks.
 for(const sign of[-1,1]){
  const ear=(u,v,back=false)=>{const x=24*(1-u-v)+26*u+17*v+(back?-2.5:Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*3),y=sign*(5*(1-u-v)+18*u+16*v),z=54*(1-u-v)+52*u+(i?74:71)*v;return point(x,y,z);};
  const steps=8;for(let row=0;row<steps;row++)for(let col=0;col<steps-row;col++){const u=col/steps,v=row/steps,front=[ear(u,v),ear(u+1/steps,v),ear(u,v+1/steps)],inner=u>.13&&v>.12&&u+v<.88,color=inner?'#c8a29b':i?fur:'#8a816f';h3Surface(m,front,front.map(()=>[ca,sa,.15]),color);h3Quad(m,[ear(u,v,true),ear(u,v+1/steps,true),ear(u+1/steps,v,true)],i?'#bf925c':'#766f62',1);if(col+row<steps-1){const q=[ear(u+1/steps,v),ear(u+1/steps,v+1/steps),ear(u,v+1/steps)];h3Surface(m,q,q.map(()=>[ca,sa,.15]),color);h3Quad(m,[ear(u+1/steps,v,true),ear(u,v+1/steps,true),ear(u+1/steps,v+1/steps,true)],i?'#bf925c':'#766f62',1);}}
  h3Tube(m,[ear(0,0),ear(1,0),ear(0,1),ear(0,0)],.65,i?'#dcb47a':'#b7ad99',8);
 }

 if(!i)for(const sign of[-1,1]){
  ell(27,sign*10.5,39,8,4.8,8.5,cream);
  for(let k=0;k<7;k++){const z=43-k*1.45;h3Tube(m,[point(30,sign*12,z),point(26,sign*(15+k*.35),z-1),point(22,sign*(17+k*.3),z-4)],t=>1.45*(1-t)+.08,cream,6);}
 }
 // Fine whisker fur around Ryan's chest and cheeks, with actual tapered strands.
 if(!i)for(let k=0;k<22;k++){const a=k/22*Math.PI*2,y=Math.sin(a)*16,z=29+Math.cos(a)*12;h3Tube(m,[point(17,y,z),point(20,y*1.2,z-3),point(19,y*1.26,z-7)],t=>1.1*(1-t)+.12,'#eeeae0',5);}
 // Small muzzle pads and almond eyelids follow the supplied photos.
 ell(38,-3.6,37.5,5.1,4.1,3.6,cream);ell(38,3.6,37.5,5.1,4.1,3.6,cream);ell(35,0,33.8,5.1,5.3,2.5,cream);
 for(const sign of[-1,1]){
  ell(36.9,sign*7.5,47,1.8,4.25,3.25,'#494334');
  m.material=4;ell(38,sign*7.5,47,.65,3.4,2.85,i?'#8e9361':'#929e6f');ell(38.55,sign*7.5,47,.2,1.9,2.6,'#20261f');ell(38.75,sign*8.3,48,.12,.4,.45,'#fffbea',null,8);m.material=5;
  tube([[37.5,sign*3.1,46.6],[38,sign*5.2,49.4],[37.5,sign*8.1,50.2],[35.3,sign*11.7,48]],.42,i?'#705333':'#484639',8);
  tube([[37.5,sign*3.1,46.6],[38,sign*6.2,44.1],[36.9,sign*9.4,44.6],[35.3,sign*11.7,48]],.28,'#7c6c51',6);
  // Tabby eyeliner and cheek bars wrap around the actual head surface.
  tube([[36.8,sign*11.4,47.8],[33,sign*12.2,46.5],[29,sign*12.4,45.7]],.65,dark,6);
  tube([[33,sign*11.9,42.3],[29,sign*12.5,41],[25,sign*12.2,40.1]],.6,i?dark:'#8c806a',6);
  if(i)tube([[33,sign*11.3,40],[29,sign*12,38.4],[26,sign*11.3,37.5]],.5,dark,6);
  if(!i)for(let k=0;k<3;k++)tube([[21,sign*(14+k*.5),62+k*2],[19,sign*(15+k*.7),67+k*2]],t=>.3*(1-t)+.05,cream,4);
 }
 h3Quad(m,[[42.9,-2.5,40.1],[42.9,2.5,40.1],[44,0,36.8]].map(p=>point(...p)),i?'#b88070':'#bd8585',1);
 tube([[43.5,0,36.8],[43.3,0,35.5],[41,2.8,34.9]],.24,'#72584c',5);tube([[43.3,0,35.5],[41,-2.8,34.9]],.24,'#72584c',5);
 for(const sign of[-1,1])for(let k=0;k<4;k++)tube([[41,sign*4,36.8+k*.85],[40-k,sign*15,36+k*1.9],[33-k*2,sign*(25+k),33+k*3]],.13,'#eee9de',4);
 // Bushy tabby tail for Ryan; slimmer ringed tail for Simba.
 m.part=5;const tail=[];for(let k=0;k<=9;k++){const t=k/9;tail.push(point(-29-t*32,(i?-1:1)*(Math.sin(t*1.7)*25)+Math.sin(catTime*.8+t)*3,29+t*22+Math.sin(t*Math.PI)*9));}
 h3Tube(m,tail,t=>(i?3.4:7.8)*(1-t*.66),k=>i?(k%3===0?dark:fur):(k%3===0?'#47463f':'#8c8477'),10);h3Ellipsoid(m,...tail.at(-1),i?1.5:2.5,i?1.5:2.5,i?1.5:2.5,dark,angle,null,1,12,8);m.part=0;if(!c.model){for(let k=vertexStart;k<m.positions.length;k+=3){m.positions[k]=c.x+(m.positions[k]-c.x)*H3_CAT_SCALE;m.positions[k+1]=c.y+(m.positions[k+1]-c.y)*H3_CAT_SCALE;m.positions[k+2]=c.z+(m.positions[k+2]-c.z)*H3_CAT_SCALE;}for(let k=triangleStart;k<m.triangles.length;k++)m.triangles[k].v=m.triangles[k].v.map(p=>p.map((v,j)=>[c.x,c.y,c.z][j]+(v-[c.x,c.y,c.z][j])*H3_CAT_SCALE));}
}

function h3BuildDynamic(){const m=h3Mesh();m.material=1;for(const d of home.doors){if(!d.open){h3Box(m,d.x,d.y,0,d.w,d.d,336,'#b7ad92');if(d.axis==='y'){h3Box(m,d.x-7,d.y+79,145,d.w+14,24,5,'#6b7774');}else h3Box(m,d.x+79,d.y-7,145,24,d.d+14,5,'#6b7774');}else{h3Box(m,d.x,d.y,0,d.axis==='y'?111:10,d.axis==='y'?10:111,336,'#b7ad92');}}
 for(const t of home.toys)h3Ellipsoid(m,t.x,t.y,9,8,8,8,t.color,0,(x,y,z)=>Math.abs(z)<1.8?'#f3eadb':t.color);
 home.cats.forEach((c,i)=>{if(i!==home.active||home.view==='follow')h3Cat(m,c,i);});return m;
}
function h3CameraBlocked(x,y,z){if(x<9||y<9||x>2031||y>1351||z<7||z>H3_CEILING-9)return true;if(home.walls.some(w=>homeRectHit(x,y,7,w)))return true;if(home.doors.some(d=>homeRectHit(x,y,7,d.open?{x:d.x,y:d.y,w:d.axis==='y'?111:10,d:d.axis==='y'?10:111}:d)&&z<345))return true;return home.furniture.some(f=>{const bottom=f.type==='table'?f.h-9:f.z;return z+6>bottom&&z-6<f.z+f.h&&homeRectHit(x,y,6,f);});}
function h3Camera(dt=0){const c=home.cats[home.active],yaw=home.yaw??-2.05,pitch=home.pitch??-.18;
 let pos=[c.x,c.y,c.z+H3_EYE],lookPitch=pitch;
 if(home.view==='follow'){
  const target=[c.x,c.y,c.z+32],distance=175,wanted=clamp(.35-pitch,.12,1.12);
  const cast=e=>{const v=[-Math.cos(yaw)*Math.cos(e),-Math.sin(yaw)*Math.cos(e),Math.sin(e)];let safe=0;for(let d=4;d<=distance;d+=4){if(h3CameraBlocked(...target.map((p,k)=>p+v[k]*d)))break;safe=d;}return{safe,v};};
  let elevation=wanted,result=cast(wanted);if(result.safe<64){for(const alt of[.2,.9,1.25]){const candidate=cast(alt);if(candidate.safe>result.safe+24){result=candidate;elevation=alt;}}}
  if(dt>0){const rig=home.cameraRig;if(!rig||rig.active!==home.active){home.cameraRig={active:home.active,elevation,arm:result.safe};}else{rig.elevation+=(elevation-rig.elevation)*(1-Math.exp(-10*dt));elevation=rig.elevation;result=cast(elevation);rig.arm=result.safe<rig.arm?result.safe:rig.arm+(result.safe-rig.arm)*(1-Math.exp(-7*dt));result.safe=rig.arm;}}
  pos=target.map((v,k)=>v+result.v[k]*result.safe);
  // The collision-safe boom and the player's gaze are independent. Clamping
  // the boom above the floor must never clamp looking up at a high catwalk.
  lookPitch=clamp(pitch-.35,-1.35,1.05);
 }
 const cp=Math.cos(lookPitch),f=[Math.cos(yaw)*cp,Math.sin(yaw)*cp,Math.sin(lookPitch)],right=[-Math.sin(yaw),Math.cos(yaw),0],up=[-Math.cos(yaw)*Math.sin(lookPitch),-Math.sin(yaw)*Math.sin(lookPitch),cp];
 return{pos,f,right,up,fov:(home.view==='follow'?67:78)*Math.PI/180,near:2,far:3500};
}
function h3Dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function h3Matrix(c,aspect){const t=1/Math.tan(c.fov/2),n=c.near,f=c.far,A=(f+n)/(f-n),B=-2*f*n/(f-n),r=c.right,u=c.up,v=c.f,p=c.pos;return new Float32Array([t/aspect*r[0],t*u[0],A*v[0],v[0],t/aspect*r[1],t*u[1],A*v[1],v[1],t/aspect*r[2],t*u[2],A*v[2],v[2],-t/aspect*h3Dot(r,p),-t*h3Dot(u,p),B-A*h3Dot(v,p),-h3Dot(v,p)]);}
const H3_VERTEX=`attribute vec3 position;attribute vec3 color;attribute vec4 surface;attribute float joint;uniform mat4 camera;uniform vec4 pose;uniform vec2 anim;uniform float isCat;varying vec3 tint;varying float depth;varying vec3 world;varying vec3 normal;varying float material;varying vec3 local;
void main(){vec3 p=position;local=position;float tick=anim.x;
 if(isCat>0.5){if(joint>0.5&&joint<4.5){float phase=(joint<1.5||joint>3.5)?0.0:3.14159265;float weight=clamp((25.0-p.z)/22.0,0.0,1.0);p.x+=sin(tick*12.0+phase)*6.0*anim.y*weight;p.z+=max(0.0,cos(tick*12.0+phase))*4.0*anim.y*weight;}if(joint>4.5){p.y+=sin(tick*.8+(p.x+29.0)*.04)*2.4;}p.z+=sin(tick*2.0)*.25+sin(tick*24.0)*.6*anim.y;p*=0.74;}
 float ca=cos(pose.w),sa=sin(pose.w);world=vec3(p.x*ca-p.y*sa,p.x*sa+p.y*ca,p.z)+pose.xyz;normal=vec3(surface.x*ca-surface.y*sa,surface.x*sa+surface.y*ca,surface.z);material=surface.w;gl_Position=camera*vec4(world,1.0);tint=color;depth=gl_Position.w;}`;
const H3_FRAGMENT=`precision highp float;
varying vec3 tint;varying float depth;varying vec3 world;varying vec3 normal;varying float material;varying vec3 local;uniform vec3 eye;uniform vec3 catFeet[2];
float hash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
void main(){vec3 n=normalize(normal+vec3(0.00001)),v=normalize(eye-world),light=normalize(vec3(-0.4,-0.55,0.85));float grain=hash(floor(world*3.0))-0.5;vec3 col=tint;float rough=0.85,spec=0.04;
 if(material>0.5&&material<1.5){float wave=sin(world.y*.62+sin(world.x*.041)*1.7+sin(world.x*.12)*.3);col*=.96+.035*wave+.045*grain;rough=.6;spec=.06;if(n.z>.8&&world.z<1.0){float seam=step(.983,fract(world.y/32.0))+step(.995,fract((world.x+floor(world.y/32.0)*80.0)/160.0));col*=1.0-min(seam,1.0)*.11;}}
 else if(material>1.5&&material<2.5){float weave=sin(world.x*7.0)*sin(world.y*7.0)*sin(world.z*7.0);col*=.99+.016*weave+.025*grain;rough=.95;}
 else if(material>2.5&&material<3.5){col*=.99+.014*grain;rough=.28;spec=.2;}
 else if(material>3.5&&material<4.5){rough=.16;spec=.33;}
 else if(material>4.5&&material<5.5){float fur=sin(local.z*6.2+sin(local.y*1.7)+local.x*.41);col*=.99+.017*fur+.025*grain;rough=.9;spec=.025;}
 else if(material>6.5&&material<7.5){rough=.34;spec=.13;col*=1.0+.012*grain;}
 else if(material>7.5){rough=.18;spec=.3;col*=1.0+.025*sin(world.x*.45+world.y*.35);}
 else{col*=1.0+.014*grain;}
 float diffuse=max(dot(n,light),0.0),shine=pow(max(dot(n,normalize(light+v)),0.0),mix(95.0,9.0,rough))*spec;
 col*=.86+.23*diffuse;col+=vec3(1.0,.97,.88)*shine;
 // Soft local contact shadows follow each cat, including raised perches.
 for(int i=0;i<2;i++){vec2 d=(world.xy-catFeet[i].xy)/vec2(28.0,16.0);float radius=dot(d,d);float nearFloor=1.0-smoothstep(.6,4.0,abs(world.z-catFeet[i].z));col*=1.0-.26*exp(-radius*1.7)*nearFloor*max(n.z,0.0);}
 float fog=clamp((depth-650.0)/3300.0,0.0,0.2);col=mix(col,vec3(.71,.74,.71),fog);
 // Delicate two-pixel grain; geometry and silhouettes remain full resolution.
 col+=(hash(vec3(floor(gl_FragCoord.xy/2.0),1.0))-.5)*.004;
 gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);}`;
function h3MakeGL(surface){const gl=surface.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});if(!gl)return null;
 const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,H3_VERTEX));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,H3_FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 return{gl,program,position:gl.getAttribLocation(program,'position'),color:gl.getAttribLocation(program,'color'),surface:gl.getAttribLocation(program,'surface'),joint:gl.getAttribLocation(program,'joint'),pose:gl.getUniformLocation(program,'pose'),anim:gl.getUniformLocation(program,'anim'),isCat:gl.getUniformLocation(program,'isCat'),eye:gl.getUniformLocation(program,'eye'),catFeet:gl.getUniformLocation(program,'catFeet[0]'),camera:gl.getUniformLocation(program,'camera'),buffers:[]};
}
function h3Upload(engine,m){const gl=engine.gl,result={count:m.positions.length/3};for(const name of['positions','colors','surfaces','joints']){result[name]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,result[name]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m[name]),gl.STATIC_DRAW);}return result;}
function h3GLDraw(e,c,meshes,w,h){const gl=e.gl;gl.viewport(0,0,w,h);gl.clearColor(.76,.79,.75,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(e.camera,false,h3Matrix(c,w/h));gl.uniform3fv(e.eye,new Float32Array(c.pos));gl.uniform3fv(e.catFeet,new Float32Array(home.cats.flatMap(cat=>[cat.x,cat.y,homeSupport(cat)])));for(const m of meshes){gl.uniform4fv(e.pose,new Float32Array(m.pose||[0,0,0,0]));gl.uniform2fv(e.anim,new Float32Array([home.time,typeof m.moving==='number'?m.moving:m.moving?1:0]));gl.uniform1f(e.isCat,m.isCat?1:0);for(const [name,loc]of[['positions',e.position],['colors',e.color],['surfaces',e.surface],['joints',e.joint]]){gl.bindBuffer(gl.ARRAY_BUFFER,m[name]);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,name==='surfaces'?4:name==='joints'?1:3,gl.FLOAT,false,0,0);}gl.drawArrays(gl.TRIANGLES,0,m.count);}}
// Perspective clipping shared with test snapshots and the non-WebGL fallback.
function h3Clip(poly,near){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=a[2]>=near,inb=b[2]>=near;if(ina)out.push(a);if(ina!==inb){const t=(near-a[2])/(b[2]-a[2]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
function h3Software(context,meshes,c,w,h){
 // A depth buffer is essential here too: painter ordering can reveal rooms through walls.
 const rw=Math.min(w,640),rh=Math.round(h*rw/w),f=rh/2/Math.tan(c.fov/2),depth=new Float32Array(rw*rh),data=new Uint8ClampedArray(rw*rh*4);depth.fill(Infinity);
 for(let k=0;k<data.length;k+=4){data[k]=188;data[k+1]=198;data[k+2]=189;data[k+3]=255;}
 for(const m of meshes)for(const tri of m.triangles){const v=tri.v.map(p=>{const d=p.map((x,i)=>x-c.pos[i]);return[h3Dot(d,c.right),h3Dot(d,c.up),h3Dot(d,c.f)];});if(v.every(p=>p[2]<c.near))continue;const poly=h3Clip(v,c.near);if(poly.length<3)continue;const points=poly.map(p=>[rw/2+p[0]/p[2]*f,rh/2-p[1]/p[2]*f,1/p[2]]);
 for(let t=1;t<points.length-1;t++){const [a,b,e]=[points[0],points[t],points[t+1]],area=(b[0]-a[0])*(e[1]-a[1])-(b[1]-a[1])*(e[0]-a[0]);if(Math.abs(area)<.001)continue;
 const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],e[0]))),x1=Math.min(rw-1,Math.ceil(Math.max(a[0],b[0],e[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],e[1]))),y1=Math.min(rh-1,Math.ceil(Math.max(a[1],b[1],e[1])));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x+.5,py=y+.5,wa=((b[0]-px)*(e[1]-py)-(b[1]-py)*(e[0]-px))/area,wb=((e[0]-px)*(a[1]-py)-(e[1]-py)*(a[0]-px))/area,wc=1-wa-wb;if(wa<0||wb<0||wc<0)continue;const z=1/(wa*a[2]+wb*b[2]+wc*e[2]),index=y*rw+x;if(z>=depth[index])continue;depth[index]=z;const fog=clamp((z-450)/2600,0,.34);for(let k=0;k<3;k++)data[index*4+k]=Math.round((tri.color[k]*(1-fog)+[.65,.69,.66][k]*fog)*255);}
 }}
 if(!context.createImageData)return;const image=context.createImageData(rw,rh);image.data.set(data);
 // Native test canvas can use the same code without a browser DOM.
 if(rw===w&&rh===h){context.putImageData(image,0,0);return;}
 if(typeof OffscreenCanvas!=='undefined'){const out=new OffscreenCanvas(rw,rh);out.getContext('2d').putImageData(image,0,0);context.drawImage(out,0,0,w,h);}else if(document.createElement){const out=document.createElement('canvas');out.width=rw;out.height=rh;out.getContext('2d').putImageData(image,0,0);context.drawImage(out,0,0,w,h);}else context.putImageData(image,0,0);
 return{depth,width:rw,height:rh};
}
function home3DInit(){if(!home3d){home3d={model:null,staticMesh:null,revision:-1};if(document.createElement&&canvas.parentElement){const surface=document.createElement('canvas');surface.id='home3d';surface.setAttribute('aria-label','貓咪視角的立體家屋，可拖曳轉頭');canvas.parentElement.insertBefore(surface,canvas);home3d.surface=surface;try{home3d.engine=h3MakeGL(surface);surface.addEventListener('webglcontextlost',e=>{e.preventDefault();home3d.engine=null;});surface.addEventListener('webglcontextrestored',()=>{try{home3d.engine=h3MakeGL(surface);home3d.model=null;home3d.staticBuffer=null;home3d.staticChunks=null;home3d.catBuffers=null;home3d.toyBuffers=null;home3d.doorsKey=null;home3d.doorBuffer=null;}catch{home3d.engine=null;}});}catch(e){console.warn('3D renderer fallback',e.message);}if(!home3d.engine){surface.remove();home3d.surface=null;}
 canvas.addEventListener('pointerdown',homeLookDown);canvas.addEventListener('pointermove',homeLookMove);for(const name of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,homeLookUp);

 }}if(home3d.surface)home3d.surface.hidden=false;home3DResize();}
function home3DHide(){if(home3d?.surface)home3d.surface.hidden=true;}
function home3DResize(){if(canvas.parentElement?.getBoundingClientRect&&mode==='home'){const bounds=canvas.parentElement.getBoundingClientRect();if(bounds.width>0&&bounds.height>0){canvas.height=Math.round(960*bounds.height/bounds.width);ctx.imageSmoothingEnabled=false;}}if(home3d?.surface){const r=canvas.parentElement.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,1.25);const scale=Math.min(ratio,Math.sqrt(800000/(r.width*r.height)));const w=Math.max(320,Math.round(r.width*scale)),h=Math.max(240,Math.round(r.height*scale));if(home3d.surface.width!==w)home3d.surface.width=w;if(home3d.surface.height!==h)home3d.surface.height=h;}}
function home3DMovement(sx,sy){const y=home.yaw??-2.05;return{dx:-sy*Math.cos(y)-sx*Math.sin(y),dy:-sy*Math.sin(y)+sx*Math.cos(y)};}
function homeLookDown(e){if(mode!=='home'||home.paused||home.lookDrag)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);home.lookDrag={id:e.pointerId,x:e.clientX,y:e.clientY};home.lookTarget={yaw:home.yaw,pitch:home.pitch};}
function homeLookMove(e){const d=home?.lookDrag;if(!d||d.id!==e.pointerId||mode!=='home'||home.paused)return;home.lookTarget.yaw+=(e.clientX-d.x)*.0048;home.lookTarget.pitch=clamp(home.lookTarget.pitch-(e.clientY-d.y)*.0042,-1.12,1.4);d.x=e.clientX;d.y=e.clientY;}
function homeLookUp(e){if(home?.lookDrag?.id===e.pointerId)home.lookDrag=null;}
function home3DLookUpdate(dt){if(home.paused){home.lookDrag=null;home.lookTarget=null;return;}const turn=Number(keys.has('KeyR'))-Number(keys.has('KeyQ'));if(turn){if(!home.lookTarget)home.lookTarget={yaw:home.yaw,pitch:home.pitch};home.lookTarget.yaw+=turn*1.65*dt;}if(home.lookTarget){const a=1-Math.exp(-30*dt);home.yaw+=(home.lookTarget.yaw-home.yaw)*a;home.pitch+=(home.lookTarget.pitch-home.pitch)*a;}}

function h3VisibleRooms(){const start=homeRoom(home.cats[home.active])?.id,visible=new Set(start?[start]:[]);let changed=true;while(changed){changed=false;for(const d of home.doors){if(!d.open)continue;const cx=d.x+d.w/2,cy=d.y+d.d/2,a=homeRoom({x:cx-(d.axis==='y'?30:0),y:cy-(d.axis==='x'?30:0)})?.id,b=homeRoom({x:cx+(d.axis==='y'?30:0),y:cy+(d.axis==='x'?30:0)})?.id;if(a&&b&&(visible.has(a)||visible.has(b))){if(!visible.has(a)||!visible.has(b))changed=true;visible.add(a);visible.add(b);}}}return visible;}
function h3Partition(m){const groups=HOME_LAYOUT.rooms.map(r=>({room:r.id,mesh:h3Mesh(),r}));for(let k=0;k<m.positions.length;k+=9){const xs=[m.positions[k],m.positions[k+3],m.positions[k+6]],ys=[m.positions[k+1],m.positions[k+4],m.positions[k+7]],minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);for(const {mesh,r}of groups){if(maxX<r.x-18||minX>r.x+r.w+18||maxY<r.y-18||minY>r.y+r.d+18)continue;for(let n=k;n<k+9;n++){mesh.positions.push(m.positions[n]);mesh.colors.push(m.colors[n]);}const vi=k/3;for(let n=vi*4;n<(vi+3)*4;n++)mesh.surfaces.push(m.surfaces[n]);for(let n=vi;n<vi+3;n++)mesh.joints.push(m.joints[n]);}}return groups.map(({room,mesh})=>({room,mesh}));}
function h3CatPose(c){const dt=home.paused?0:(home.renderDelta||1/60),desired=c.heading??home.yaw??0;if(!Number.isFinite(c.renderHeading))c.renderHeading=desired;const delta=Math.atan2(Math.sin(desired-c.renderHeading),Math.cos(desired-c.renderHeading));c.renderHeading+=delta*(1-Math.exp(-16*dt));c.gait=(c.gait||0)+((c.moving?1:0)-(c.gait||0))*(1-Math.exp(-12*dt));return{pose:[c.x,c.y,c.z,c.renderHeading],moving:c.gait,isCat:true};}
function h3CachedGPU(camera){const e=home3d.engine;
 if(!home3d.catBuffers){home3d.catBuffers=[0,1].map(i=>{const m=h3Mesh();h3Cat(m,{x:0,y:0,z:0,heading:0,ground:true,moving:false,status:'',model:true},i);return h3Upload(e,m);});home3d.toyBuffers=home.toys.map(t=>{const m=h3Mesh();m.material=2;h3Ellipsoid(m,0,0,9,8,8,8,t.color,0,(x,y,z)=>Math.abs(z)<1.8?'#f3eadb':t.color);return h3Upload(e,m);});}
 const doorsKey=home.doors.map(d=>Number(d.open)).join('');if(home3d.doorsKey!==doorsKey){if(home3d.doorBuffer)for(const k of['positions','colors','surfaces','joints'])e.gl.deleteBuffer(home3d.doorBuffer[k]);const m=h3Mesh();m.material=1;for(const d of home.doors){h3Box(m,d.x,d.y,0,d.open?(d.axis==='y'?111:10):d.w,d.open?(d.axis==='y'?10:111):d.d,336,'#b7ad92');if(!d.open){if(d.axis==='y')h3Box(m,d.x-7,d.y+79,145,d.w+14,24,5,'#6b7774');else h3Box(m,d.x+79,d.y-7,145,24,d.d+14,5,'#6b7774');}}home3d.doorBuffer=h3Upload(e,m);home3d.doorsKey=doorsKey;}
 const visible=h3VisibleRooms(),list=[...(home3d.staticChunks?home3d.staticChunks.filter(b=>visible.has(b.room)):[home3d.staticBuffer]),home3d.doorBuffer];home.toys.forEach((t,i)=>{if(visible.has(homeRoom(t)?.id))list.push({...home3d.toyBuffers[i],pose:[t.x,t.y,0,0]});});home.cats.forEach((c,i)=>{if((i===home.active||visible.has(homeRoom(c)?.id))&&(i!==home.active||home.view==='follow'))list.push({...home3d.catBuffers[i],...h3CatPose(c)});});h3GLDraw(e,camera,list,home3d.surface.width,home3d.surface.height);
}
function home3DDraw(){if(!home3d)home3DInit();if(home3d.model!==home){home3d.model=home;home3d.staticMesh=h3BuildStatic();if(home3d.engine){if(home3d.staticBuffer)for(const k of['positions','colors','surfaces','joints'])home3d.engine.gl.deleteBuffer(home3d.staticBuffer[k]);if(home3d.staticChunks)for(const chunk of home3d.staticChunks)for(const key of['positions','colors','surfaces','joints'])home3d.engine.gl.deleteBuffer(chunk[key]);home3d.staticChunks=h3Partition(home3d.staticMesh).map(({room,mesh})=>({...h3Upload(home3d.engine,mesh),room}));}}
 const camera=h3Camera(home.renderDelta||1/60);ctx.clearRect(0,0,canvas.width,canvas.height);
 if(home3d.engine){h3CachedGPU(camera);}else h3Software(ctx,[home3d.staticMesh,h3BuildDynamic()],camera,canvas.width,canvas.height);
 homeDrawMap();const c=home.cats[home.active],room=homeRoom(c);ctx.save();const uiScale=window.innerWidth<600?1.65:1;ctx.scale(uiScale,uiScale);rect(16,16,260,61,'#173028db');label((room?.name||'家裡')+' · '+(home.view==='follow'?'近距離跟隨':'貓咪視角'),29,39,'#f0ecd7',17,'left');label('腳下高度 '+Math.round(c.z*H3_SCALE_CM)+' cm',29,62,'#cddac2',14,'left');ctx.restore();ctx.save();if(home.view!=='follow'){ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(canvas.width/2-5,canvas.height/2);ctx.lineTo(canvas.width/2+5,canvas.height/2);ctx.moveTo(canvas.width/2,canvas.height/2-5);ctx.lineTo(canvas.width/2,canvas.height/2+5);ctx.stroke();}ctx.restore();
}
