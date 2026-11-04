// Shared page shell for game templates. Produces a COMPLETE self-contained HTML document
// (inline CSS + vanilla JS). Game JS must not use backticks or "${" (it is embedded via String.raw).
// Shell provides: C (config merged with defaults), num/str/arr helpers, colors as CSS vars,
// HUD (#hudTitle, #hudScore), overlay (start / game over), setScore/addScore/endGame,
// optional full-screen canvas (cv, ctx, W, H), loop(fn), onPress(fn), emoji(), rnd(), pick().
// Each game defines: function startGame(){}, optional drawIdle(), onResize().

const BASE_CSS = String.raw`
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{width:100%;height:100%;overflow:hidden;background:var(--bg,#0E0B1A);color:var(--fg,#fff);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;overscroll-behavior:none}
#cv{position:fixed;inset:0;width:100%;height:100%;display:block}
#hud{position:fixed;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;pointer-events:none;z-index:5;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.6)}
#hudTitle{font-size:14px;opacity:.85;max-width:60%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#hudScore{font-size:24px;color:var(--a)}
#ov{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(5,3,15,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:20;text-align:center;padding:24px}
#ov.hide{display:none}
#ovEmoji{font-size:64px;line-height:1}
#ovTitle{font-size:30px;font-weight:800;color:var(--fg);max-width:420px}
#ovSub{font-size:16px;opacity:.85;max-width:340px;line-height:1.45;white-space:pre-line}
#ovBtn{font-size:20px;font-weight:700;padding:14px 36px;border:0;border-radius:999px;background:var(--p);color:#fff;cursor:pointer;box-shadow:0 0 28px var(--p);font-family:inherit}
#ovBtn:active{transform:scale(.96)}
`;

const BASE_JS = String.raw`
var C = Object.assign({}, DEFAULTS, window.GAME_CONFIG || {});
function num(k,d){var v=C[k];if(v===undefined||v===null||v==='')return d;v=Number(v);return isFinite(v)?v:d;}
function str(k,d){var v=C[k];return (typeof v==='string'&&v.trim())?v:d;}
function arr(k,d){var v=C[k];if(Array.isArray(v)&&v.length)return v.map(String);if(typeof v==='string'&&v.trim())return v.split(/[,\s]+/).filter(Boolean);return d;}
var PRIMARY=str('primaryColor','#836EF9'),BG=str('backgroundColor','#0E0B1A'),ACCENT=str('accentColor','#20E3B2'),FG=str('textColor','#FFFFFF');
var DIFF=Math.max(0.3,Math.min(3,num('difficulty',1)));
(function(){var rs=document.documentElement.style;rs.setProperty('--p',PRIMARY);rs.setProperty('--bg',BG);rs.setProperty('--a',ACCENT);rs.setProperty('--fg',FG);})();
document.title=str('title','Game');
var hud=document.createElement('div');hud.id='hud';hud.innerHTML='<span id="hudTitle"></span><span id="hudScore">0</span>';document.body.appendChild(hud);
var ov=document.createElement('div');ov.id='ov';ov.innerHTML='<div id="ovEmoji"></div><div id="ovTitle"></div><div id="ovSub"></div><button id="ovBtn" type="button"></button>';document.body.appendChild(ov);
document.getElementById('hudTitle').textContent=str('title','');
var score=0,best=0,running=false,gen=0;
try{best=Number(localStorage.getItem('mg_best_'+document.title))||0;}catch(e){}
function setScore(n){score=Math.max(0,Math.round(n));document.getElementById('hudScore').textContent=String(score);if(window.MG)MG.score(score);}
function addScore(n){setScore(score+(n===undefined?1:n));}
function showOverlay(em,title,sub,btn){document.getElementById('ovEmoji').textContent=em||'';document.getElementById('ovTitle').textContent=title||'';document.getElementById('ovSub').textContent=sub||'';document.getElementById('ovBtn').textContent=btn||'Play';ov.classList.remove('hide');}
function hideOverlay(){ov.classList.add('hide');}
function overlayOpen(){return !ov.classList.contains('hide');}
function endGame(label){if(!running)return;running=false;gen++;if(score>best){best=score;try{localStorage.setItem('mg_best_'+document.title,String(best));}catch(e){}}if(window.MG)MG.gameOver(score);setTimeout(function(){showOverlay(str('playerEmoji',''),label||'Game Over','Score: '+score+'   Best: '+best,'Play again');},350);}
function beginGame(){hideOverlay();setScore(0);running=true;gen++;startGame();}
document.getElementById('ovBtn').addEventListener('click',function(e){e.stopPropagation();beginGame();});
window.addEventListener('keydown',function(e){if(overlayOpen()&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();beginGame();}});
var cv=document.getElementById('cv'),ctx=cv?cv.getContext('2d'):null,W=window.innerWidth,H=window.innerHeight;
function resize(){W=window.innerWidth;H=window.innerHeight;if(cv){var d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.floor(W*d);cv.height=Math.floor(H*d);ctx.setTransform(d,0,0,d,0,0);}if(typeof onResize==='function')onResize();if(!running&&typeof drawIdle==='function')drawIdle();}
window.addEventListener('resize',resize);
function loop(fn){var my=gen,last=performance.now();function f(t){if(!running||my!==gen)return;var dt=Math.min(0.05,Math.max(0,(t-last)/1000));last=t;fn(dt);if(running&&my===gen)requestAnimationFrame(f);}requestAnimationFrame(f);}
function inOverlay(e){return e.target&&e.target.closest&&e.target.closest('#ov');}
function onPress(fn){window.addEventListener('pointerdown',function(e){if(inOverlay(e)||!running)return;fn(e.clientX,e.clientY,e);});}
function emoji(e,x,y,size){ctx.font=Math.round(size)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e,x,y);}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function clear(){if(!ctx)return;ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);}
function rrect(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);}else{ctx.rect(x,y,w,h);}ctx.fill();}
`;

const BOOT_JS = String.raw`
resize();
showOverlay(str('playerEmoji',''),str('title','Game'),str('subtitle',HELP),'Play');
if(window.MG)MG.ready();
`;

export interface PageOpts {
  defaults: Record<string, unknown>;
  help: string;
  canvas?: boolean;
  css?: string;
  body?: string;
  js: string;
}

const esc = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

export function buildPage(o: PageOpts): string {
  return (
    '<!DOCTYPE html>\n<html lang="en"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">' +
    "<title>Game</title><style>" + BASE_CSS + (o.css || "") + "</style></head><body>" +
    (o.canvas ? '<canvas id="cv"></canvas>' : "") + (o.body || "") +
    "<script>\nvar DEFAULTS=" + esc(o.defaults) + ";var HELP=" + esc(o.help) + ";\n" +
    BASE_JS + "\n" + o.js + "\n" + BOOT_JS + "</script></body></html>"
  );
}

export const BASE_DEFAULTS = {
  primaryColor: "#836EF9",
  backgroundColor: "#0E0B1A",
  accentColor: "#20E3B2",
  textColor: "#FFFFFF",
  difficulty: 1,
};
