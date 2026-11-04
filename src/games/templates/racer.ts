import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Racer",
  subtitle: "Tap left/right side or use arrow keys to switch lanes. Dodge traffic!",
  playerEmoji: "🏎️",
  enemyEmojis: ["🚗", "🚙", "🚕", "🚌"],
  coinEmoji: "💜",
  roadColor: "#1A1530",
  lanes: 3,
  speed: 320,
};

const js = String.raw`
var PE=str('playerEmoji','🏎️'),EE=arr('enemyEmojis',['🚗']),CE=str('coinEmoji','💜'),RC=str('roadColor','#1A1530');
var LANES=Math.max(2,Math.min(5,Math.round(num('lanes',3)))),SP0=num('speed',320)*DIFF;
var lane=1,px=0,cars=[],coins=[],sp=0,spawnT=0,stripe=0,rw=0,rx=0;
function onResize(){rw=Math.min(W*0.92,LANES*110);rx=(W-rw)/2;}
function laneX(l){return rx+rw/LANES*(l+0.5);}
function startGame(){lane=Math.floor(LANES/2);px=laneX(lane);cars=[];coins=[];sp=SP0;spawnT=0.5;loop(step);}
function move(d){if(!running)return;lane=Math.max(0,Math.min(LANES-1,lane+d));}
onPress(function(x){move(x<W/2?-1:1);});
window.addEventListener('keydown',function(e){if(!running)return;if(e.code==='ArrowLeft'||e.code==='KeyA'){e.preventDefault();move(-1);}else if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();move(1);}});
function step(dt){sp+=dt*10*DIFF;stripe=(stripe+sp*dt)%80;
  px+=(laneX(lane)-px)*Math.min(1,dt*14);
  spawnT-=dt;
  if(spawnT<=0){var l=Math.floor(Math.random()*LANES);cars.push({l:l,y:-60,e:pick(EE),v:rnd(0.35,0.6),passed:false});
    if(Math.random()<0.5){var cl=(l+1+Math.floor(Math.random()*(LANES-1)))%LANES;coins.push({l:cl,y:-60});}
    spawnT=rnd(0.45,1.0)*(320/sp)+0.2;}
  var py=H-110,dead=false;
  for(var i=cars.length-1;i>=0;i--){var c=cars[i];c.y+=sp*c.v*dt*1.6;
    if(!c.passed&&c.y>py+50){c.passed=true;addScore(1);}
    if(c.y>H+80){cars.splice(i,1);continue;}
    if(Math.abs(laneX(c.l)-px)<rw/LANES*0.55&&Math.abs(c.y-py)<56)dead=true;}
  for(var j=coins.length-1;j>=0;j--){var k=coins[j];k.y+=sp*dt;if(k.y>H+40){coins.splice(j,1);continue;}
    if(Math.abs(laneX(k.l)-px)<rw/LANES*0.5&&Math.abs(k.y-py)<44){coins.splice(j,1);addScore(3);}}
  draw();if(dead)endGame();}
function draw(){clear();
  ctx.fillStyle=PRIMARY;ctx.globalAlpha=0.18;ctx.fillRect(0,0,rx,H);ctx.fillRect(rx+rw,0,W-rx-rw,H);ctx.globalAlpha=1;
  ctx.fillStyle=RC;ctx.fillRect(rx,0,rw,H);
  ctx.fillStyle=PRIMARY;ctx.fillRect(rx-4,0,4,H);ctx.fillRect(rx+rw,0,4,H);
  ctx.fillStyle=FG;ctx.globalAlpha=0.5;
  for(var l=1;l<LANES;l++){var x=rx+rw/LANES*l;for(var y=-80+stripe;y<H;y+=80)ctx.fillRect(x-2,y,4,40);}
  ctx.globalAlpha=1;
  for(var j=0;j<coins.length;j++)emoji(CE,laneX(coins[j].l),coins[j].y,30);
  var sz=Math.min(64,rw/LANES*0.8);
  for(var i=0;i<cars.length;i++){var c=cars[i];ctx.save();ctx.translate(laneX(c.l),c.y);ctx.rotate(-Math.PI/2);emoji(c.e,0,0,sz);ctx.restore();}
  ctx.save();ctx.translate(px,H-110);ctx.rotate(Math.PI/2);emoji(PE,0,0,sz);ctx.restore();
}
function drawIdle(){lane=Math.floor(LANES/2);px=laneX(lane);cars=[];coins=[];draw();}
`;

export const racerTemplate: GameTemplate = {
  id: "racer",
  name: "Lane Racer",
  description: "Switch lanes to dodge traffic at ever-increasing speed.",
  icon: "🏎️",
  category: "arcade",
  keywords: ["race", "racer", "racing", "car", "cars", "drive", "driving", "road", "traffic", "lane", "lanes", "highway", "speed", "kart", "moto", "motorcycle", "bike", "truck", "dodge"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
