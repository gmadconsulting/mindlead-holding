/**
 * Altezza di 100svh in px: lo schermo con le barre del browser aperte.
 * I palchi sono alti 100lvh (il fondo copre lo schermo anche a barre chiuse), ma testi e scene
 * si impaginano su questa altezza: con le barre aperte nulla finisce sotto la barra.
 */
export function smallViewportHeight(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h || window.innerHeight;
}
