import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc7dc);
scene.fog = new THREE.Fog(0x9fc7dc, 35, 125);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, .1, 250);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f7ff,0x586b73,2));
const sun = new THREE.DirectionalLight(0xffffff,2.3); sun.position.set(-25,45,20); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);

const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const snow=mat(0xe7f1f4), ice=mat(0x9dc7d5), dark=mat(0x26343b), wood=mat(0x78624e), green=mat(0x47634e);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),snow); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const grid=new THREE.GridHelper(180,45,0xb4cbd4,0xd2e0e5); grid.position.y=.015; scene.add(grid);

function box(x,y,z,sx,sy,sz,material){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function tree(x,z){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2,7),wood);trunk.position.set(x,1,z);scene.add(trunk);for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.25-i*.18,2.2,7),green);c.position.set(x,2.1+i*.8,z);c.castShadow=true;scene.add(c)}}
function house(x,z){box(x,1.4,z,7,2.8,6,wood);const roof=new THREE.Mesh(new THREE.ConeGeometry(5.2,2.8,4),dark);roof.rotation.y=Math.PI/4;roof.position.set(x,4,z);roof.castShadow=true;scene.add(roof);box(x,1,z-3.06,1.2,2,.12,dark)}
for(let i=0;i<22;i++){let a=i*2.399,r=18+(i%5)*5;tree(Math.cos(a)*r,Math.sin(a)*r)}
house(-12,-15);house(16,-22);house(23,12);house(-25,17);
for(let i=0;i<14;i++){let x=(Math.random()-.5)*85,z=(Math.random()-.5)*85;if(Math.abs(x)>8||Math.abs(z)>8)box(x,.35,z,1.2,.7,1.2,ice)}

const player=new THREE.Group(); scene.add(player);
const bodyMat=mat(0xd64b26), pantsMat=mat(0x263b52), skinMat=mat(0xd5a27e);
const torso=new THREE.Mesh(new THREE.BoxGeometry(.85,1.15,.45),bodyMat);torso.position.y=1.45;torso.castShadow=true;player.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),skinMat);head.position.y=2.25;head.castShadow=true;player.add(head);
const legs=[];
for(const x of [-.23,.23]){const l=new THREE.Mesh(new THREE.BoxGeometry(.28,.85,.32),pantsMat);l.position.set(x,.48,0);player.add(l);legs.push(l)}
const gunMat=mat(0xc99c36,.45);const gun=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.85),gunMat);gun.position.set(.48,1.55,-.38);player.add(gun);
player.position.set(0,0,5);

const enemies=[];
function spawnEnemy(x,z){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.75,1.2,.5),mat(0x9b342e));b.position.y=1.35;g.add(b);const h=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),skinMat);h.position.y=2.12;g.add(h);g.position.set(x,0,z);g.userData.hp=2;scene.add(g);enemies.push(g)}
for(let i=0;i<7;i++)spawnEnemy((Math.random()-.5)*48,(Math.random()-.5)*48-12);

let running=false,health=100,ammo=30,kills=0,yaw=0,move={x:0,y:0},vy=0,onGround=true,reloading=false;
const $=id=>document.getElementById(id);
function say(t){$('message').textContent=t}
function applySkins(){const outfit=$('outfit').value;bodyMat.color.set({fire:0xd64b26,snow:0xe8edf0,forest:0x426d43,shadow:0x252a35}[outfit]);const w=$('weaponSkin').value;gunMat.color.set({gold:0xd9a52d,ice:0x76d7ee,red:0xb82b2b,black:0x20252a}[w])}
$('start').onclick=()=>{applySkins();$('menu').classList.add('hidden');$('controls').classList.remove('hidden');running=true;say('دشمنوں کو تلاش کریں اور فائر کریں');};
$('back').onclick=()=>{$('menu').classList.remove('hidden');$('controls').classList.add('hidden');running=false};
$('jump').addEventListener('pointerdown',()=>{if(onGround){vy=7;onGround=false}});
$('reload').onclick=()=>{if(!reloading&&ammo<30){reloading=true;say('ری لوڈ ہو رہا ہے…');setTimeout(()=>{ammo=30;reloading=false;$('ammo').textContent=ammo;say('گن تیار ہے')},1200)}};
function shoot(){if(!running)return;if(ammo<=0){say('گن خالی ہے — ری لوڈ کریں');return}ammo--;$('ammo').textContent=ammo;const origin=new THREE.Vector3();player.getWorldPosition(origin);origin.y=1.55;const dir=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));let target=null,best=100;for(const e of enemies){if(e.userData.hp<=0)continue;const v=e.position.clone().sub(player.position);const dist=v.length();v.y=0;v.normalize();const dot=v.dot(dir);if(dot>.94&&dist<best){best=dist;target=e}}if(target){target.userData.hp--;target.children.forEach(c=>c.material.color.set(0xff7777));if(target.userData.hp<=0){scene.remove(target);kills++;$('kills').textContent=kills;say('ایک دشمن ختم!')}else say('نشانہ لگا!')}else say('گولی چلی — نشانہ درست کریں')}
$('fire').addEventListener('pointerdown',shoot);
let stickActive=false,stickId=null,stickCenter={x:0,y:0};
const stick=$('stick'),nub=$('nub');
stick.addEventListener('pointerdown',e=>{stickActive=true;stickId=e.pointerId;stick.setPointerCapture(stickId);const r=stick.getBoundingClientRect();stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};updateStick(e)});
stick.addEventListener('pointermove',e=>{if(stickActive&&e.pointerId===stickId)updateStick(e)});
function updateStick(e){let dx=e.clientX-stickCenter.x,dy=e.clientY-stickCenter.y,l=Math.hypot(dx,dy),max=34;if(l>max){dx=dx/l*max;dy=dy/l*max}nub.style.transform=`translate(${dx}px,${dy}px)`;move.x=dx/max;move.y=dy/max}
function stopStick(){stickActive=false;move={x:0,y:0};nub.style.transform='translate(0,0)'}
stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);

const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&onGround){vy=7;onGround=false}if(e.key===' ')e.preventDefault();if(e.key.toLowerCase()==='r')$('reload').click()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let last=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;
 if(running){let mx=move.x+(keys.d?1:0)-(keys.a?1:0),mz=move.y+(keys.s?1:0)-(keys.w?1:0);const len=Math.hypot(mx,mz);if(len>1){mx/=len;mz/=len}const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));player.position.addScaledVector(forward,-mz*7*dt);player.position.addScaledVector(right,mx*7*dt);
 if(Math.abs(mx)+Math.abs(mz)>.05)player.rotation.y=yaw;
 vy-=18*dt;player.position.y+=vy*dt;if(player.position.y<=0){player.position.y=0;vy=0;onGround=true}
 // simple enemy approach and contact damage
 for(const e of enemies){if(e.userData.hp<=0)continue;const d=e.position.distanceTo(player.position);if(d>2.5&&d<35){const v=player.position.clone().sub(e.position).normalize();e.position.addScaledVector(v,1.1*dt);e.lookAt(player.position.x,0,player.position.z)}else if(d<=2.5){health=Math.max(0,health-8*dt);$('health').textContent=Math.floor(health);if(health===0){say('گیم ختم — مینو سے دوبارہ شروع کریں');running=false;$('menu').classList.remove('hidden')}}}
 }
 const target=new THREE.Vector3(player.position.x,player.position.y+2.5,player.position.z+6.5);const camPos=new THREE.Vector3(player.position.x+Math.sin(yaw)*6,player.position.y+4,player.position.z+Math.cos(yaw)*6);camera.position.lerp(camPos,.12);camera.lookAt(player.position.x,player.position.y+1.3,player.position.z);
 renderer.render(scene,camera)}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
$('loading').style.display='none';
