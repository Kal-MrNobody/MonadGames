import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Tapper",
  subtitle: "Tap the targets before they vanish. Avoid the bombs! 30 seconds on the clock.",
  playerEmoji: "👆",
  targetEmojis: ["💜", "💎", "⚡", "🟣"],
  badEmojis: ["💣"],
  duration: 30,
  targetLifetime: 1.4,
  spawnInterval: 0.6,
};

const js = String.raw`
var TE=arr('targetEmojis',['💜','💎','⚡']),BE=arr('badEmojis',['💣']),DUR=num('duration',30),LIFE=num('targetLifetime',1.4)/DIFF,SPI=num('spawnInterval',0.6)/DIFF;
var targets=[],fx=[],timeLeft=0,spawnT=0;
function startGame(){targets=[];fx=[];timeLeft=DUR;spawnT=0;loop(step);}
function spawn(){var bad=BE.length&&Math.random()<0.18;var r=Math.max(28,Math.min(W,H)*0.07);targets.push({x:rnd(r+10,W-r-10),y:rnd(r+60,H-r-10),r:r,e:bad?pick(BE):pick(TE),bad:bad,t:0,life:LIFE*rnd(0.8,1.3)});}
onPress(function(x,y){
  for(var i=targets.length-1;i>=0;i--){var t=targets[i];var dx=x-t.x,dy=y-t.y;
    if(dx*dx+dy*dy<(t.r*1.25)*(t.r*1.25)){targets.splice(i,1);
      if(t.bad){fx.push({x:t.x,y:t.y,s:'-5',c:'#ff4d6d',t:0});addScore(-5);timeLeft-=3;}
      else{var pts=t.t<t.life*0.4?2:1;fx.push({x:t.x,y:t.y,s:'+'+pts,c:ACCENT,t:0});addScore(pts);}
      return;}}
});
function step(dt){
  timeLeft-=dt;spawnT-=dt;
  if(spawnT<=0){spawn();spawnT=SPI*rnd(0.6,1.2)*Math.max(0.5,timeLeft/DUR+0.3);}
  for(var i=targets.length-1;i>=0;i--){targets[i].t+=dt;if(targets[i].t>targets[i].life)targets.splice(i,1);}
  for(var j=fx.length-1;j>=0;j--){fx[j].t+=dt;if(fx[j].t>0.7)fx.splice(j,1);}
  draw();
  if(timeLeft<=0){timeLeft=0;draw();endGame("Time's up!");}
}
function draw(){
  clear();
  ctx.fillStyle=PRIMARY;ctx.globalAlpha=0.25;ctx.fillRect(0,H-8,W,8);ctx.globalAlpha=1;ctx.fillRect(0,H-8,W*Math.max(0,timeLeft)/DUR,8);
  ctx.fillStyle=FG;ctx.font='bold 20px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(Math.ceil(Math.max(0,timeLeft))+'s',W/2,24);
  for(var i=0;i<targets.length;i++){var t=targets[i];var k=t.t/t.life;var s=k<0.15?k/0.15:(k>0.85?(1-k)/0.15:1);
    ctx.globalAlpha=0.3;ctx.fillStyle=t.bad?'#ff4d6d':PRIMARY;ctx.beginPath();ctx.arc(t.x,t.y,t.r*1.1*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    emoji(t.e,t.x,t.y,t.r*1.4*s);}
  for(var j=0;j<fx.length;j++){var f=fx[j];ctx.globalAlpha=1-f.t/0.7;ctx.fillStyle=f.c;ctx.font='bold 26px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(f.s,f.x,f.y-f.t*60);}
  ctx.globalAlpha=1;
}
function drawIdle(){targets=[];fx=[];timeLeft=DUR;draw();}
`;

export const tapTemplate: GameTemplate = {
  id: "tap",
  name: "Tap Frenzy",
  description: "Tap targets as fast as you can before the clock runs out.",
  icon: "👆",
  category: "tap",
  keywords: ["tap", "click", "clicker", "whack", "mole", "target", "targets", "pop", "bubble", "bubbles", "reflex", "reaction", "aim", "smash", "hit", "speed", "timer", "clock"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
