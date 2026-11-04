import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monad Memory",
  subtitle: "Flip cards and match all the pairs before time runs out. Fewer misses = more points.",
  playerEmoji: "🧠",
  cardEmojis: ["💜", "💎", "🚀", "⚡", "🦄", "🔥", "🌙", "🪙"],
  cardBackEmoji: "🟪",
  pairs: 8,
  timeLimit: 90,
};

const css = String.raw`
#wrap{position:fixed;inset:48px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:10px}
#info{font-weight:700;opacity:.85}
#grid{display:grid;gap:8px;width:min(92vw,calc(100vh - 120px),520px)}
.card{aspect-ratio:1;border-radius:12px;background:var(--p);display:flex;align-items:center;justify-content:center;font-size:min(9vw,7vh,48px);cursor:pointer;transition:transform .25s,background .25s;box-shadow:0 2px 10px rgba(0,0,0,.4)}
.card.open{background:rgba(255,255,255,.12);transform:rotateY(180deg)}
.card.done{background:var(--a);opacity:.6;transform:rotateY(180deg)}
.card span{transform:rotateY(180deg)}
`;

const js = String.raw`
var CE=arr('cardEmojis',['💜','💎','🚀','⚡','🦄','🔥','🌙','🪙']),BACK=str('cardBackEmoji','🟪'),TL=Math.max(10,num('timeLimit',90)/DIFF);
var NP=Math.max(2,Math.min(CE.length,Math.round(num('pairs',8))));
var grid=document.getElementById('grid'),info=document.getElementById('info');
var cards=[],open=[],matched=0,misses=0,lock=false,timeLeft=0,timer=null;
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function render(){grid.innerHTML='';var colsN=Math.ceil(Math.sqrt(NP*2));grid.style.gridTemplateColumns='repeat('+colsN+',1fr)';
  cards.forEach(function(c,i){var d=document.createElement('div');d.className='card'+(c.done?' done':(c.open?' open':''));d.innerHTML='<span></span>';d.firstChild.textContent=(c.open||c.done)?c.e:BACK;
    d.addEventListener('click',function(){flip(i);});grid.appendChild(d);});}
function upd(){info.textContent='Time '+Math.ceil(timeLeft)+'s  ·  Pairs '+matched+'/'+NP+'  ·  Misses '+misses;}
function startGame(){var sel=shuffle(CE.slice()).slice(0,NP);cards=shuffle(sel.concat(sel)).map(function(e){return {e:e,open:false,done:false};});
  open=[];matched=0;misses=0;lock=false;timeLeft=TL;render();upd();clearInterval(timer);
  timer=setInterval(function(){if(!running){clearInterval(timer);return;}timeLeft-=0.1;if(timeLeft<=0){timeLeft=0;upd();clearInterval(timer);endGame("Time's up!");}else upd();},100);}
function flip(i){if(!running||lock)return;var c=cards[i];if(c.open||c.done)return;c.open=true;open.push(i);render();
  if(open.length===2){var a=cards[open[0]],b=cards[open[1]];
    if(a.e===b.e){a.done=b.done=true;a.open=b.open=false;open=[];matched++;addScore(100);render();upd();
      if(matched===NP){clearInterval(timer);addScore(Math.round(timeLeft)*5);setTimeout(function(){endGame('You win! 🎉');},400);}}
    else{misses++;lock=true;upd();setTimeout(function(){a.open=b.open=false;open=[];lock=false;addScore(-10);render();},700);}}}
function drawIdle(){}
`;

export const memoryTemplate: GameTemplate = {
  id: "memory",
  name: "Memory Match",
  description: "Flip cards and match pairs against the clock.",
  icon: "🧠",
  category: "puzzle",
  keywords: ["memory", "match", "matching", "pairs", "pair", "cards", "card", "flip", "concentration", "remember", "brain", "emoji", "tiles"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, css, body: '<div id="wrap"><div id="info"></div><div id="grid"></div></div>', js }),
};
