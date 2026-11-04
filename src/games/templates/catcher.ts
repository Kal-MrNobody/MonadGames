import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "MON Catcher",
  subtitle: "Drag or use arrow keys to move the basket. Catch the goodies, dodge the bombs!",
  playerEmoji: "🧺",
  itemEmojis: ["💜", "💎", "🪙", "🍇"],
  badEmojis: ["💣"],
  lives: 3,
  fallSpeed: 200,
};

const js = String.raw`
var PE=str('playerEmoji','🧺'),IE=arr('itemEmojis',['💜']),BE=arr('badEmojis',['💣']),LIVES=Math.max(1,num('lives',3)),FS=num('fallSpeed',200)*DIFF;
var px=0,tx=0,py=0,items=[],fx=[],lives=0,spawnT=0,t=0,keys={};
function onResize(){py=H-60;}
function startGame(){px=tx=W/2;items=[];fx=[];lives=LIVES;spawnT=0.3;t=0;loop(step);}
window.addEventListener('pointerdown',function(e){if(running&&!inOverlay(e))tx=e.clientX;});
window.addEventListener('pointermove',function(e){if(running&&(e.buttons||e.pointerType==='mouse'))tx=e.clientX;});
window.addEventListener('keydown',function(e){keys[e.code]=true;if(running&&e.code.indexOf('Arrow')===0)e.preventDefault();});
window.addEventListener('keyup',function(e){keys[e.code]=false;});
function step(dt){t+=dt;
  if(keys.ArrowLeft||keys.KeyA)tx=px-1400*dt;if(keys.ArrowRight||keys.KeyD)tx=px+1400*dt;
  tx=Math.max(30,Math.min(W-30,tx));px+=(tx-px)*Math.min(1,dt*16);
  spawnT-=dt;if(spawnT<=0){var bad=BE.length&&Math.random()<Math.min(0.35,0.12+t/200);items.push({x:rnd(24,W-24),y:-30,e:bad?pick(BE):pick(IE),bad:bad,v:FS*rnd(0.8,1.25)*(1+t/45),r:rnd(-2,2),a:0});spawnT=rnd(0.4,0.9)/(1+t/60)/Math.sqrt(DIFF);}
  var dead=false;
  for(var i=items.length-1;i>=0;i--){var it=items[i];it.y+=it.v*dt;it.a+=it.r*dt;
    if(Math.abs(it.x-px)<38&&Math.abs(it.y-py)<28){items.splice(i,1);
      if(it.bad){lives--;fx.push({x:px,y:py-30,s:'💥',t:0});if(lives<=0)dead=true;}else{addScore(1);fx.push({x:px,y:py-30,s:'+1',t:0});}continue;}
    if(it.y>H+30){items.splice(i,1);if(!it.bad){lives--;fx.push({x:it.x,y:H-30,s:'❌',t:0});if(lives<=0)dead=true;}}}
  for(var j=fx.length-1;j>=0;j--){fx[j].t+=dt;if(fx[j].t>0.7)fx.splice(j,1);}
  draw();if(dead)endGame();}
function draw(){clear();
  var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,BG);g.addColorStop(1,PRIMARY);ctx.globalAlpha=0.35;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  for(var i=0;i<items.length;i++){var it=items[i];ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.a);emoji(it.e,0,0,36);ctx.restore();}
  emoji(PE,px,py,64);
  for(var j=0;j<fx.length;j++){var f=fx[j];ctx.globalAlpha=1-f.t/0.7;ctx.fillStyle=ACCENT;ctx.font='bold 24px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(f.s,f.x,f.y-f.t*50);}
  ctx.globalAlpha=1;ctx.font='18px serif';ctx.textAlign='left';ctx.textBaseline='bottom';var hs='';for(var l=0;l<lives;l++)hs+='❤️';ctx.fillText(hs,12,H-8);}
function drawIdle(){px=W/2;lives=LIVES;items=[];fx=[];draw();}
`;

export const catcherTemplate: GameTemplate = {
  id: "catcher",
  name: "Catcher",
  description: "Move your basket to catch falling goodies and avoid bombs.",
  icon: "🧺",
  category: "arcade",
  keywords: ["catch", "catcher", "catching", "basket", "falling", "fall", "drop", "rain", "collect", "fruit", "fruits", "candy", "coins", "gems", "treasure", "egg", "eggs", "pizza", "food", "money"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
