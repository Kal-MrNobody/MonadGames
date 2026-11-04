import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Invaders",
  subtitle: "Drag (or use arrow keys) to move. Your ship fires automatically. Don't let invaders through!",
  playerEmoji: "🚀",
  enemyEmojis: ["👾", "🛸", "👽"],
  bulletColor: "#20E3B2",
  lives: 3,
  enemySpeed: 90,
  fireRate: 6,
};

const js = String.raw`
var PE=str('playerEmoji','🚀'),EE=arr('enemyEmojis',['👾']),BC=str('bulletColor',ACCENT),LIVES=Math.max(1,num('lives',3)),ES=num('enemySpeed',90)*DIFF,FR=Math.max(1,num('fireRate',6));
var px=0,tx=0,py=0,bullets=[],enemies=[],parts=[],lives=0,fireT=0,spawnT=0,t=0,keys={},stars=[];
for(var i=0;i<80;i++)stars.push({x:Math.random(),y:Math.random(),s:Math.random()*2+0.5});
function onResize(){py=H-70;}
function startGame(){px=tx=W/2;bullets=[];enemies=[];parts=[];lives=LIVES;fireT=0;spawnT=1;t=0;loop(step);}
window.addEventListener('pointerdown',function(e){if(running&&!inOverlay(e))tx=e.clientX;});
window.addEventListener('pointermove',function(e){if(running&&(e.buttons||e.pointerType==='mouse'))tx=e.clientX;});
window.addEventListener('keydown',function(e){keys[e.code]=true;if(running&&e.code.indexOf('Arrow')===0)e.preventDefault();});
window.addEventListener('keyup',function(e){keys[e.code]=false;});
function boom(x,y,c){for(var i=0;i<12;i++)parts.push({x:x,y:y,vx:rnd(-180,180),vy:rnd(-180,180),t:0,c:c});}
function step(dt){t+=dt;
  if(keys.ArrowLeft||keys.KeyA)tx=px-500*dt*3;if(keys.ArrowRight||keys.KeyD)tx=px+500*dt*3;
  tx=Math.max(24,Math.min(W-24,tx));px+=(tx-px)*Math.min(1,dt*12);
  fireT-=dt;if(fireT<=0){fireT=1/FR;bullets.push({x:px,y:py-26});}
  spawnT-=dt;if(spawnT<=0){var n=1+Math.floor(t/20);for(var k=0;k<n;k++)enemies.push({x:rnd(30,W-30),y:-30-k*50,e:pick(EE),v:ES*rnd(0.8,1.3)*(1+t/60),w:rnd(0,6.28),hp:Math.random()<0.15?3:1});spawnT=rnd(0.7,1.4)/Math.sqrt(DIFF);}
  for(var i=bullets.length-1;i>=0;i--){bullets[i].y-=700*dt;if(bullets[i].y<-20)bullets.splice(i,1);}
  var dead=false;
  for(var j=enemies.length-1;j>=0;j--){var en=enemies[j];en.y+=en.v*dt;en.w+=dt*2;en.x+=Math.sin(en.w)*40*dt;
    for(var b=bullets.length-1;b>=0;b--){var bl=bullets[b];if(Math.abs(bl.x-en.x)<22&&Math.abs(bl.y-en.y)<22){bullets.splice(b,1);en.hp--;if(en.hp<=0){boom(en.x,en.y,ACCENT);enemies.splice(j,1);addScore(en.e===EE[0]?1:2);}break;}}
    if(!enemies[j]||enemies[j]!==en)continue;
    if(Math.abs(en.x-px)<30&&Math.abs(en.y-py)<30){boom(px,py,'#ff4d6d');dead=true;}
    if(en.y>H+30){enemies.splice(j,1);lives--;boom(en.x,H-10,'#ff4d6d');if(lives<=0)dead=true;}}
  for(var p=parts.length-1;p>=0;p--){var q=parts[p];q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.t>0.6)parts.splice(p,1);}
  draw();if(dead)endGame();}
function draw(){clear();ctx.fillStyle=FG;
  for(var i=0;i<stars.length;i++){var s=stars[i];var y=(s.y*H+t*s.s*40)%H;ctx.globalAlpha=0.3+s.s/5;ctx.fillRect(s.x*W,y,s.s,s.s);}
  ctx.globalAlpha=1;ctx.fillStyle=BC;
  for(var b=0;b<bullets.length;b++)rrect(bullets[b].x-2.5,bullets[b].y-8,5,16,3);
  for(var j=0;j<enemies.length;j++){var en=enemies[j];emoji(en.e,en.x,en.y,en.hp>1?50:38);}
  for(var p=0;p<parts.length;p++){var q=parts[p];ctx.globalAlpha=1-q.t/0.6;ctx.fillStyle=q.c;ctx.fillRect(q.x,q.y,4,4);}
  ctx.globalAlpha=1;ctx.save();ctx.translate(px,py);ctx.rotate(-Math.PI/4);emoji(PE,0,0,44);ctx.restore();
  ctx.font='18px serif';ctx.textAlign='left';ctx.textBaseline='bottom';var hs='';for(var l=0;l<lives;l++)hs+='❤️';ctx.fillText(hs,12,H-10);}
function drawIdle(){px=W/2;lives=LIVES;bullets=[];enemies=[];parts=[];draw();}
`;

export const shooterTemplate: GameTemplate = {
  id: "shooter",
  name: "Space Shooter",
  description: "Blast waves of invaders before they break through.",
  icon: "🚀",
  category: "arcade",
  keywords: ["shoot", "shooter", "shooting", "space", "alien", "aliens", "invader", "invaders", "galaxy", "laser", "spaceship", "ship", "blast", "gun", "zombie", "zombies", "asteroid", "asteroids", "war", "battle", "defend", "bullet"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
