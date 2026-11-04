import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Snake",
  subtitle: "Arrow keys / WASD or swipe to steer. Eat to grow, don't bite yourself or the walls.",
  playerEmoji: "🐍",
  foodEmojis: ["💜", "🍇", "💎"],
  snakeColor: "#836EF9",
  speed: 8,
  cellSize: 24,
};

const js = String.raw`
var FE=arr('foodEmojis',['💜']),SC=str('snakeColor',PRIMARY),BASESP=num('speed',8)*DIFF,CS=Math.max(14,num('cellSize',24));
var cols=10,rows=10,ox=0,oy=0,snake=[],dir={x:1,y:0},ndir={x:1,y:0},food=null,acc=0,sp=8;
function onResize(){cols=Math.max(8,Math.floor(W/CS));rows=Math.max(8,Math.floor((H-50)/CS));ox=Math.floor((W-cols*CS)/2);oy=50+Math.floor((H-50-rows*CS)/2);}
function placeFood(){for(var n=0;n<500;n++){var f={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows),e:pick(FE)};var hit=false;for(var i=0;i<snake.length;i++)if(snake[i].x===f.x&&snake[i].y===f.y){hit=true;break;}if(!hit){food=f;return;}}}
function startGame(){var cx=Math.floor(cols/2),cy=Math.floor(rows/2);snake=[{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];dir={x:1,y:0};ndir={x:1,y:0};acc=0;sp=BASESP;placeFood();loop(step);}
function turn(x,y){if(x===-dir.x&&y===-dir.y)return;ndir={x:x,y:y};}
window.addEventListener('keydown',function(e){if(!running)return;var k=e.code;
  if(k==='ArrowUp'||k==='KeyW')turn(0,-1);else if(k==='ArrowDown'||k==='KeyS')turn(0,1);else if(k==='ArrowLeft'||k==='KeyA')turn(-1,0);else if(k==='ArrowRight'||k==='KeyD')turn(1,0);else return;e.preventDefault();});
var sx=0,sy=0;
window.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;});
window.addEventListener('pointerup',function(e){if(!running||inOverlay(e))return;var dx=e.clientX-sx,dy=e.clientY-sy;
  if(Math.abs(dx)<12&&Math.abs(dy)<12){var hx=ox+snake[0].x*CS,hy=oy+snake[0].y*CS;dx=e.clientX-hx;dy=e.clientY-hy;if(dir.x!==0){turn(0,dy<0?-1:1);}else{turn(dx<0?-1:1,0);}return;}
  if(Math.abs(dx)>Math.abs(dy))turn(dx<0?-1:1,0);else turn(0,dy<0?-1:1);});
function step(dt){acc+=dt;var dead=false;
  while(acc>1/sp){acc-=1/sp;dir=ndir;var h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(h.x<0||h.y<0||h.x>=cols||h.y>=rows){dead=true;break;}
    for(var i=0;i<snake.length-1;i++)if(snake[i].x===h.x&&snake[i].y===h.y){dead=true;break;}
    if(dead)break;snake.unshift(h);
    if(food&&h.x===food.x&&h.y===food.y){addScore(1);sp=Math.min(BASESP*2.2,sp+0.25);placeFood();}else snake.pop();}
  draw();if(dead)endGame();}
function draw(){clear();
  ctx.fillStyle=PRIMARY;ctx.globalAlpha=0.08;for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)if((x+y)%2===0)ctx.fillRect(ox+x*CS,oy+y*CS,CS,CS);ctx.globalAlpha=1;
  ctx.strokeStyle=PRIMARY;ctx.lineWidth=2;ctx.strokeRect(ox-1,oy-1,cols*CS+2,rows*CS+2);
  if(food)emoji(food.e,ox+food.x*CS+CS/2,oy+food.y*CS+CS/2+1,CS*0.85);
  for(var i=snake.length-1;i>=0;i--){var s=snake[i];ctx.fillStyle=i===0?ACCENT:SC;ctx.globalAlpha=i===0?1:Math.max(0.45,1-i/(snake.length+6));rrect(ox+s.x*CS+2,oy+s.y*CS+2,CS-4,CS-4,6);}
  ctx.globalAlpha=1;}
function drawIdle(){snake=[];food=null;draw();emoji(str('playerEmoji','🐍'),W/2,H/2,60);}
`;

export const snakeTemplate: GameTemplate = {
  id: "snake",
  name: "Snake",
  description: "Classic snake: eat, grow, and don't crash.",
  icon: "🐍",
  category: "arcade",
  keywords: ["snake", "worm", "eat", "grow", "tail", "serpent", "slither", "nokia", "classic", "caterpillar", "eel"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, canvas: true, js }),
};
