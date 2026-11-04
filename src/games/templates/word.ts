import type { GameTemplate } from "@/lib/types";
import { buildPage, BASE_DEFAULTS } from "./_shell";

const defaultConfig = {
  ...BASE_DEFAULTS,
  title: "Monadle",
  subtitle: "Guess the hidden word. Green = right spot, yellow = wrong spot. Solve words in a row to build your streak!",
  playerEmoji: "🔤",
  words: ["MONAD", "BLOCK", "CHAIN", "TOKEN", "STAKE", "NONCE", "VALID", "PROOF", "LAYER", "SPEED", "SHARD", "GHOST", "MINER", "BYTES", "SWAPS", "YIELD", "FLASH", "OCEAN", "PIXEL", "QUEST"],
  maxGuesses: 6,
  correctColor: "#20E3B2",
  presentColor: "#F5B700",
};

const css = String.raw`
#wrap{position:fixed;inset:44px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px 6px 10px}
#msg{height:22px;font-weight:700;color:var(--a)}
#board{display:grid;gap:6px;flex:1;align-content:center}
.row{display:grid;gap:6px}
.cell{width:min(13vw,7.5vh,58px);aspect-ratio:1;border:2px solid rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:min(7vw,4.2vh,30px);font-weight:800;text-transform:uppercase}
.cell.f{border-color:var(--p)}
#kb{display:flex;flex-direction:column;gap:6px;width:100%;max-width:520px}
.kr{display:flex;gap:4px;justify-content:center}
.k{flex:1;max-width:44px;height:min(52px,7vh);border:0;border-radius:6px;background:rgba(255,255,255,.14);color:var(--fg);font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.k.w{max-width:70px;flex:1.6;font-size:12px}
`;

const js = String.raw`
var WORDS=arr('words',['MONAD']).map(function(w){return w.toUpperCase().replace(/[^A-Z]/g,'');}).filter(function(w){return w.length>=3&&w.length<=8;});if(!WORDS.length)WORDS=['MONAD'];
var MAXG=Math.max(3,Math.round(num('maxGuesses',6)/Math.sqrt(DIFF))),CC=str('correctColor','#20E3B2'),PC=str('presentColor','#F5B700');
var boardEl=document.getElementById('board'),msg=document.getElementById('msg'),kb=document.getElementById('kb');
var target='',L=5,row=0,cur='',rows=[],keyEls={},keyState={},round=0,busy=false;
function buildKb(){kb.innerHTML='';keyEls={};['QWERTYUIOP','ASDFGHJKL','+ZXCVBNM-'].forEach(function(r){var d=document.createElement('div');d.className='kr';
  r.split('').forEach(function(ch){var b=document.createElement('button');b.type='button';b.className='k'+(ch==='+'||ch==='-'?' w':'');b.textContent=ch==='+'?'ENTER':(ch==='-'?'DEL':ch);
    b.addEventListener('click',function(){key(ch==='+'?'ENTER':(ch==='-'?'BACK':ch));});d.appendChild(b);if(ch!=='+'&&ch!=='-')keyEls[ch]=b;});kb.appendChild(d);});}
function newRound(){target=pick(WORDS);L=target.length;row=0;cur='';keyState={};busy=false;boardEl.innerHTML='';rows=[];
  for(var r=0;r<MAXG;r++){var rd=document.createElement('div');rd.className='row';rd.style.gridTemplateColumns='repeat('+L+',auto)';var cs=[];
    for(var c=0;c<L;c++){var ce=document.createElement('div');ce.className='cell';rd.appendChild(ce);cs.push(ce);}boardEl.appendChild(rd);rows.push(cs);}
  buildKb();msg.textContent='Round '+(round+1)+' · '+L+' letters';}
function startGame(){round=0;newRound();}
function paint(){var cs=rows[row];for(var i=0;i<L;i++){cs[i].textContent=cur[i]||'';cs[i].className='cell'+(cur[i]?' f':'');}}
function setKey(ch,s){var rank={absent:1,present:2,correct:3};if((rank[keyState[ch]]||0)>=rank[s])return;keyState[ch]=s;var b=keyEls[ch];if(b)b.style.background=s==='correct'?CC:(s==='present'?PC:'rgba(255,255,255,.04)');}
function submit(){if(cur.length<L){msg.textContent='Not enough letters';return;}
  var res=[],pool={},i;for(i=0;i<L;i++){if(cur[i]===target[i])res[i]='correct';else pool[target[i]]=(pool[target[i]]||0)+1;}
  for(i=0;i<L;i++){if(res[i])continue;if(pool[cur[i]]){res[i]='present';pool[cur[i]]--;}else res[i]='absent';}
  var cs=rows[row];for(i=0;i<L;i++){cs[i].style.background=res[i]==='correct'?CC:(res[i]==='present'?PC:'rgba(255,255,255,.08)');cs[i].style.borderColor='transparent';setKey(cur[i],res[i]);}
  if(cur===target){var pts=(MAXG-row)*100;addScore(pts);round++;msg.textContent='Nice! +'+pts;busy=true;setTimeout(function(){if(running)newRound();},1200);return;}
  row++;cur='';if(row>=MAXG){msg.textContent='The word was '+target;busy=true;setTimeout(function(){endGame('The word was '+target);},900);}}
function key(k){if(!running||busy)return;if(k==='ENTER')submit();else if(k==='BACK'){cur=cur.slice(0,-1);paint();}else if(/^[A-Z]$/.test(k)&&cur.length<L){cur+=k;paint();}}
window.addEventListener('keydown',function(e){if(!running||e.metaKey||e.ctrlKey)return;if(e.key==='Enter'){e.preventDefault();key('ENTER');}else if(e.key==='Backspace'){e.preventDefault();key('BACK');}else if(e.key&&e.key.length===1)key(e.key.toUpperCase());});
function drawIdle(){}
`;

export const wordTemplate: GameTemplate = {
  id: "word",
  name: "Word Guess",
  description: "Wordle-style word guessing with a themed word list.",
  icon: "🔤",
  category: "puzzle",
  keywords: ["word", "words", "wordle", "guess", "guessing", "letters", "letter", "vocabulary", "spell", "spelling", "dictionary", "hangman", "crossword", "trivia", "quiz"],
  defaultConfig,
  html: buildPage({ defaults: defaultConfig, help: defaultConfig.subtitle, css, body: '<div id="wrap"><div id="msg"></div><div id="board"></div><div id="kb"></div></div>', js }),
};
