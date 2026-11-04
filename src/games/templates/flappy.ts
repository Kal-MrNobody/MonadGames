import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Flappy Monad",
  subtitle: "Tap, click or press Space to fly through the gaps.",
  playerEmoji: "🐤",
  pipeColor: "#836EF9",
  gravity: 1500,
  flapStrength: 460,
  pipeSpeed: 190,
  pipeGap: 170,
};

const js = String.raw`
var G=num('gravity',1500),FL=num('flapStrength',460),SP=num('pipeSpeed',190)*DIFF,GAP=num('pipeGap',170)/Math.sqrt(DIFF),PE=str('playerEmoji','🐤'),PC=str('pipeColor',PRIMARY);
var P={x:0,y:0,v:0},pipes=[],stars=[];
for(var i=0;i<60;i++)stars.push({x:Math.random(),y:Math.random(),r:Math.random()*1.5+0.3});
function flap(){if(running)P.v=-FL;}
onPress(function(){flap();});
window.addEventListener('keydown',function(e){if(running&&(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')){e.preventDefault();flap();}});
function startGame(){P={x:W*0.28,y:H/2,v:-FL};pipes=[];loop(step);}
function step(dt){
  P.v+=G*dt;P.y+=P.v*dt;
  var spacing=Math.max(230,W*0.5);
  if(pipes.length===0||pipes[pipes.length-1].x<W+40-spacing){var g=Math.min(GAP,H*0.45);pipes.push({x:W+40,y:rnd(70+g/2,H-70-g/2),g:g,s:false});}
  var dead=false;
  for(var i=pipes.length-1;i>=0;i--){var p=pipes[i];p.x-=SP*dt;
    if(!p.s&&p.x+32<P.x){p.s=true;addScore(1);}
    if(Math.abs(p.x-P.x)<32+14&&Math.abs(P.y-p.y)>p.g/2-14)dead=true;
    if(p.x<-100)pipes.splice(i,1);}
  if(P.y>H-14||P.y<-60)dead=true;
  draw();
  if(dead)endGame();
}
function draw(){
  clear();ctx.fillStyle=FG;ctx.globalAlpha=0.5;
  for(var i=0;i<stars.length;i++){var s=stars[i];ctx.fillRect(s.x*W,s.y*H,s.r,s.r);}
  ctx.globalAlpha=1;ctx.fillStyle=PC;
  for(var j=0;j<pipes.length;j++){var p=pipes[j];rrect(p.x-32,-10,64,p.y-p.g/2+10,10);rrect(p.x-32,p.y+p.g/2,64,H-(p.y+p.g/2)+10,10);
    ctx.fillStyle=ACCENT;ctx.fillRect(p.x-36,p.y-p.g/2-14,72,14);ctx.fillRect(p.x-36,p.y+p.g/2,72,14);ctx.fillStyle=PC;}
  ctx.save();ctx.translate(P.x,P.y);ctx.rotate(Math.max(-0.5,Math.min(1.2,P.v/900)));emoji(PE,0,0,38);ctx.restore();
}
function drawIdle(){P={x:W*0.28,y:H/2,v:0};pipes=[];draw();}
`;

export const flappyTemplate: GameTemplate = {
  id: "flappy",
  name: "Flappy Flyer",
  description: "Tap to flap through an endless gauntlet of pipes.",
  icon: "🐤",
  category: "arcade",
  keywords: ["flappy", "bird", "fly", "flying", "flap", "wings", "pipe", "pipes", "jetpack", "helicopter", "float", "glide", "rocket", "balloon", "dragon"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
