import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Dash",
  subtitle: "Tap, click or press Space to jump. Double jump allowed!",
  playerEmoji: "🏃",
  obstacleEmojis: ["🌵", "🪨", "🔥"],
  coinEmoji: "🪙",
  groundColor: "#836EF9",
  speed: 340,
  gravity: 2600,
  jumpStrength: 900,
};

const js = String.raw`
var PE=str('playerEmoji','🏃'),OE=arr('obstacleEmojis',['🌵']),CE=str('coinEmoji','🪙'),GC=str('groundColor',PRIMARY);
var SP0=num('speed',340)*DIFF,G=num('gravity',2600),J=num('jumpStrength',900);
var P,obs=[],coins=[],gy=0,sp=0,dist=0,nextObs=0,jumps=0,bg=[];
function onResize(){gy=H*0.78;}
for(var i=0;i<14;i++)bg.push({x:Math.random(),h:Math.random()*0.25+0.08,w:Math.random()*0.08+0.04});
function startGame(){P={x:Math.max(60,W*0.18),y:gy,v:0};obs=[];coins=[];sp=SP0;dist=0;nextObs=0.8;jumps=0;loop(step);}
function jump(){if(!running)return;if(jumps<2){P.v=-J*(jumps===0?1:0.85);jumps++;}}
onPress(function(){jump();});
window.addEventListener('keydown',function(e){if(running&&(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')){e.preventDefault();if(!e.repeat)jump();}});
function step(dt){
  sp+=dt*8*DIFF;dist+=sp*dt;
  P.v+=G*dt;P.y+=P.v*dt;if(P.y>=gy){P.y=gy;P.v=0;jumps=0;}
  nextObs-=dt;
  if(nextObs<=0){var big=Math.random()<0.3;obs.push({x:W+40,s:big?56:42,e:pick(OE)});nextObs=rnd(0.75,1.6)*(340/sp)*1.2+0.35;
    if(Math.random()<0.6)coins.push({x:W+40+rnd(120,220),y:gy-rnd(90,190)});}
  var dead=false;
  for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=sp*dt;if(o.x<-60){obs.splice(i,1);continue;}
    if(Math.abs(o.x-P.x)<o.s*0.42+12&&P.y>gy-o.s*0.75)dead=true;}
  for(var j=coins.length-1;j>=0;j--){var c=coins[j];c.x-=sp*dt;if(c.x<-40){coins.splice(j,1);continue;}
    if(Math.abs(c.x-P.x)<30&&Math.abs(c.y-(P.y-22))<34){coins.splice(j,1);addScore(5);}}
  var d=Math.floor(dist/100);if(d>0){dist-=d*100;addScore(d);}
  draw();if(dead)endGame();
}
var scroll=0;
function draw(){clear();scroll+=running?sp*0.016:0;
  ctx.fillStyle=PRIMARY;ctx.globalAlpha=0.15;
  for(var i=0;i<bg.length;i++){var b=bg[i];var x=((b.x*W*1.5-scroll*0.3)%(W*1.5)+W*1.5)%(W*1.5)-W*0.25;ctx.fillRect(x,gy-b.h*H,b.w*W,b.h*H);}
  ctx.globalAlpha=1;ctx.fillStyle=GC;ctx.fillRect(0,gy+18,W,H-gy);
  ctx.fillStyle=ACCENT;for(var k=0;k<W/40+2;k++){var lx=((k*40-scroll)%(W+80)+W+80)%(W+80)-40;ctx.fillRect(lx,gy+26,18,3);}
  for(var j=0;j<coins.length;j++)emoji(CE,coins[j].x,coins[j].y,28);
  for(var m=0;m<obs.length;m++){var o=obs[m];emoji(o.e,o.x,gy+18-o.s/2,o.s);}
  if(P){ctx.save();ctx.translate(P.x,P.y);ctx.scale(-1,1);emoji(PE,0,0,44);ctx.restore();}
}
function drawIdle(){P={x:Math.max(60,W*0.18),y:gy,v:0};obs=[];coins=[];draw();}
`;

export const runnerTemplate: GameTemplate = {
  id: "runner",
  name: "Endless Runner",
  description: "Jump over obstacles and grab coins in an endless dash.",
  icon: "🏃",
  category: "runner",
  keywords: ["run", "runner", "running", "jump", "jumping", "dino", "dinosaur", "endless", "obstacle", "obstacles", "parkour", "platform", "platformer", "dash", "ninja", "cat", "dog", "hop", "surfer"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
