import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Slide",
  subtitle: "Tap tiles next to the empty space (or use arrow keys) to put them in order 1..N.",
  playerEmoji: "🧩",
  gridSize: 3,
  tileEmojis: [] as string[],
  shuffleMoves: 120,
};

const css = String.raw`
#wrap{position:fixed;inset:48px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:10px}
#info{font-weight:700;opacity:.85}
#board{position:relative;width:min(92vw,calc(100vh - 130px),480px);aspect-ratio:1;background:rgba(255,255,255,.06);border-radius:14px;border:2px solid var(--p)}
.tile{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--p);color:#fff;font-weight:800;cursor:pointer;transition:left .12s,top .12s;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}
.tile.ok{background:var(--a);color:#0E0B1A}
`;

const js = String.raw`
var N=Math.max(3,Math.min(5,Math.round(num('gridSize',3)))),TE=arr('tileEmojis',[]),SH=Math.max(20,num('shuffleMoves',120)*DIFF);
var board=document.getElementById('board'),info=document.getElementById('info');
var tiles=[],moves=0,t0=0,timer=null;
function solved(){for(var i=0;i<N*N-1;i++)if(tiles[i]!==i+1)return false;return true;}
function blank(){return tiles.indexOf(0);}
function nbrs(b){var r=Math.floor(b/N),c=b%N,o=[];if(r>0)o.push(b-N);if(r<N-1)o.push(b+N);if(c>0)o.push(b-1);if(c<N-1)o.push(b+1);return o;}
function render(){board.innerHTML='';var gap=6,sz=(board.clientWidth-gap*(N+1))/N;
  for(var i=0;i<tiles.length;i++){var v=tiles[i];if(!v)continue;var d=document.createElement('div');d.className='tile'+(v===i+1?' ok':'');
    d.style.width=d.style.height=sz+'px';d.style.left=(gap+(i%N)*(sz+gap))+'px';d.style.top=(gap+Math.floor(i/N)*(sz+gap))+'px';d.style.fontSize=(sz*0.42)+'px';
    d.textContent=TE.length>=N*N-1?TE[v-1]:String(v);(function(idx){d.addEventListener('click',function(){tap(idx);});})(i);board.appendChild(d);}}
function upd(){info.textContent='Moves '+moves+'  ·  '+Math.floor((Date.now()-t0)/1000)+'s';}
function startGame(){tiles=[];for(var i=1;i<N*N;i++)tiles.push(i);tiles.push(0);
  var prev=-1;for(var k=0;k<SH||solved();k++){var b=blank();var o=nbrs(b).filter(function(x){return x!==prev;});var m=pick(o);tiles[b]=tiles[m];tiles[m]=0;prev=b;}
  moves=0;t0=Date.now();render();upd();clearInterval(timer);timer=setInterval(function(){if(!running){clearInterval(timer);return;}upd();},500);}
function tap(i){if(!running)return;var b=blank();if(nbrs(b).indexOf(i)<0)return;tiles[b]=tiles[i];tiles[i]=0;moves++;render();upd();
  if(solved()){clearInterval(timer);var secs=(Date.now()-t0)/1000;setScore(Math.max(10,Math.round(N*N*120-moves*5-secs*2)));setTimeout(function(){endGame('Solved! 🎉');},300);}}
window.addEventListener('keydown',function(e){if(!running)return;var b=blank(),r=Math.floor(b/N),c=b%N,t=-1;
  if(e.code==='ArrowUp'&&r<N-1)t=b+N;else if(e.code==='ArrowDown'&&r>0)t=b-N;else if(e.code==='ArrowLeft'&&c<N-1)t=b+1;else if(e.code==='ArrowRight'&&c>0)t=b-1;
  if(t>=0){e.preventDefault();tap(t);}});
function onResize(){if(tiles.length)render();}
function drawIdle(){}
`;

export const puzzleTemplate: GameTemplate = {
  id: "puzzle",
  name: "Sliding Puzzle",
  description: "Classic sliding tile puzzle — solve it in as few moves as possible.",
  icon: "🧩",
  category: "puzzle",
  keywords: ["puzzle", "slide", "sliding", "tiles", "tile", "15", "fifteen", "8-puzzle", "logic", "brain", "solve", "order", "numbers", "jigsaw"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, css, body: '<div id="wrap"><div id="info"></div><div id="board"></div></div>', js }),
};
