// Message-passing protocol between the sandboxed game iframe and the host app.
// The game iframe (sandbox="allow-scripts", no same-origin) posts:
//   { source: "monadgames", type: "ready" }
//   { source: "monadgames", type: "score", score: number }      // live score update
//   { source: "monadgames", type: "gameover", score: number }   // final score -> may trigger onchain reward
export const BRIDGE_SOURCE = "monadgames";
export type BridgeMessage =
  | { source: typeof BRIDGE_SOURCE; type: "ready" }
  | { source: typeof BRIDGE_SOURCE; type: "score"; score: number }
  | { source: typeof BRIDGE_SOURCE; type: "gameover"; score: number };

// Snippet injected into every game <head>. Templates call MG.score(n) / MG.gameOver(n).
export function bridgeScript(config: Record<string, unknown>): string {
  return `<script>
window.GAME_CONFIG = ${JSON.stringify(config).replace(/</g, "\\u003c")};
window.MG = {
  ready: function(){ parent.postMessage({source:"${BRIDGE_SOURCE}",type:"ready"},"*"); },
  score: function(s){ parent.postMessage({source:"${BRIDGE_SOURCE}",type:"score",score:Number(s)||0},"*"); },
  gameOver: function(s){ parent.postMessage({source:"${BRIDGE_SOURCE}",type:"gameover",score:Number(s)||0},"*"); }
};
</script>`;
}

export function injectBridge(html: string, config: Record<string, unknown>): string {
  const snippet = bridgeScript(config);
  if (html.includes("<head>")) return html.replace("<head>", "<head>" + snippet);
  return snippet + html;
}
