"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { platform } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { gsap, registerGsap } from "@/lib/gsap";
import { blockDrop } from "@/lib/block-drop";
import { AiOrb } from "@/components/home/AiOrb";

/**
 * Tempi in svh di scroll. LEAD: la caduta del piano dalla sezione precedente, mentre questa sale dal fondo.
 * STAGE: il racconto vero e proprio. La somma deve coincidere con h-[870svh].
 * FUSE: da qui gli strati si fondono nella sfera AI, che "Intelligence" riprende nello stesso punto dello schermo
 * (quella sezione si sovrappone agli ultimi 100svh di questa: la fusione deve finire prima, il resto è fermo).
 */
const LEAD = 70;
const STAGE = 800;
const FUSE = 680;

/** Geometria della scena, in px prima del ridimensionamento: lato della base, quote degli strati, spessori. */
const W = 520;
const Z_METHOD = 130;
const Z_APPS = 260;
const T_CORE = 38;
const T_TILE = 14;
const TILT = 56;
const TURN = -36;

/** Spazio occupato dalla scena inclinata: serve a calcolare la scala che la fa stare nella colonna. */
const FIT_W = 800;
const FIT_H = 760;
/** Zoom della camera sul solo Core (passo 1): la larghezza della colonna deve contenerlo, arriva al bordo dello schermo. */
const ZOOM = 1.14;

/**
 * Blocco preso dalla scena precedente: proporzioni del piano dell'edificio (1,2 × 1,0 × 0,32) in px prima della scala,
 * inclinazione e giro che imitano la camera di quella scena (vista dall'alto a 24°, ruotata di 24°).
 */
const BLOCK = { w: 240, d: 200, t: 64, tilt: 66, turn: 24 };

const pad = (n: number) => String(n).padStart(2, "0");

/** Quadranti del livello applicazioni: lato 236, distanza 16 dal bordo e tra loro. */
const Q = [
  { x: 16, y: 16 },
  { x: 268, y: 16 },
  { x: 16, y: 268 },
  { x: 268, y: 268 },
];

/** Blocchi di ogni linea di business, relativi al quadrante: la forma racconta la scala. */
const TILES = [
  // Suite: prodotti standard, tutti uguali.
  [
    { x: 0, y: 0, w: 236, h: 72 },
    { x: 0, y: 82, w: 236, h: 72 },
    { x: 0, y: 164, w: 236, h: 72 },
  ],
  // Studio: software su misura per PMI, piccoli e ognuno diverso.
  [
    { x: 0, y: 0, w: 236, h: 100 },
    { x: 0, y: 110, w: 140, h: 126 },
    { x: 150, y: 110, w: 86, h: 126 },
  ],
  // Advisory: un'unica piattaforma enterprise, più spessa.
  [{ x: 0, y: 0, w: 236, h: 236, t: 34 }],
  // Partners: le venture, più lo spazio per la prossima.
  [
    { x: 0, y: 0, w: 113, h: 150 },
    { x: 123, y: 0, w: 113, h: 150 },
  ],
];

/** Lastra con spessore: faccia superiore più i due fianchi visibili con questa inclinazione. */
function Slab({
  t,
  face,
  front,
  side,
  top,
  edge,
  children,
}: {
  t: number;
  face: string;
  front: string;
  side: string;
  /** Segna la faccia superiore come evidenziabile: diventa scura quando il suo passo è attivo. */
  top?: boolean;
  /** Contenuto stampato sullo spessore frontale, sempre visibile anche quando sopra ci sono altri strati. */
  edge?: ReactNode;
  children?: ReactNode;
}) {
  const sideMark = top ? "" : undefined;
  return (
    <>
      <div data-pf-face data-pf-top={sideMark} className={`absolute inset-0 ${face}`}>
        {children}
      </div>
      <div
        data-pf-face
        data-pf-side={sideMark}
        className="absolute top-full left-0 w-full origin-top [backface-visibility:hidden]"
        style={{ height: t, background: front, transform: "rotateX(-90deg)" }}
      >
        {edge}
      </div>
      <div
        data-pf-face
        data-pf-side={sideMark}
        className="absolute top-0 right-full h-full origin-right [backface-visibility:hidden]"
        style={{ width: t, background: side, transform: "rotateY(-90deg)" }}
      />
    </>
  );
}

/**
 * "Platform": come è costruita la tecnologia del gruppo, in una vista esplosa a strati.
 * Il foglio scuro si stringe in un quadrato visto dall'alto: è Mindlead Core. Poi si inclina e prende spessore,
 * e a ogni passo cade dall'alto un solo strato: il metodo, poi le applicazioni di ogni linea di business.
 * In chiusura una scansione attraversa il Core e raggiunge ogni applicazione: migliorare una volta, aggiornare tutti.
 */
export function PlatformStage() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsap();
    gsap.registerPlugin(SplitText);

    const sticky = stage.querySelector<HTMLElement>("[data-pf-sticky]");
    const fit = stage.querySelector<HTMLElement>("[data-pf-fit]");
    const cell = fit?.parentElement;
    if (!sticky || !fit || !cell) return;

    // Scala della scena: la colonna cambia con la finestra, la geometria interna resta in px fissi.
    let scale = 1;
    const applyFit = () => {
      const r = cell.getBoundingClientRect();
      scale = Math.min(r.width / (FIT_W * ZOOM), r.height / FIT_H);
      fit.style.setProperty("--pf-fit", String(scale));
    };

    // Led dei moduli: pulsano sempre, indipendenti dallo scroll.
    const leds = gsap.to(stage.querySelectorAll("[data-pf-led]"), {
      opacity: 0.25,
      duration: 0.9,
      ease: "sine.inOut",
      stagger: { each: 0.3, repeat: -1, yoyo: true },
    });

    // La scena 3D si anima anche a scroll fermo (tono dell'edificio, camera): finché il blocco
    // le è ancora attaccato va ridisegnato a ogni fotogramma, non solo quando si scorre.
    let follow: (() => void) | null = null;
    const tick = () => follow?.();
    gsap.ticker.add(tick);

    const titles = Array.from(stage.querySelectorAll<HTMLElement>("[data-pf-title], [data-pf-step-title]"));
    const split = SplitText.create(titles, {
      type: "lines",
      mask: "lines",
      linesClass: "gs-line",
      autoSplit: true,
      // Ricreata a ogni nuova divisione (resize, font caricati): righe e misure cambiano.
      onSplit: () => {
        const all = (sel: string, root: ParentNode = stage) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const one = (sel: string) => stage.querySelector<HTMLElement>(sel);
        const css = getComputedStyle(document.documentElement);
        const color = (name: string) => css.getPropertyValue(name).trim();

        applyFit();
        const root = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom bottom", scrub: true },
        });
        // Il racconto parte dopo la caduta: i suoi tempi restano quelli del palco, da 0 a STAGE.
        const tl = gsap.timeline({ defaults: { ease: "none" } });

        // Presa: l'ultimo piano dell'azienda acquisita (scena di ApproachStage) viene sollevato dov'è, come un blocco 3D,
        // portato al centro mentre ruota fino a mostrare la faccia superiore e si scurisce; poi la camera ci entra dentro:
        // la faccia si allarga fino a tutto schermo, gli angoli si arrotondano e tornano dritti. Diventa il foglio scuro.
        // La sezione intanto sale dal fondo: le posizioni si calcolano dal vivo a ogni aggiornamento.
        const ink = one("[data-pf-ink]");
        const block = one("[data-pf-block]");
        const tilt = one("[data-pf-block-tilt]");
        const turn = one("[data-pf-block-turn]");
        const slab = one("[data-pf-block-slab]");
        const faceTop = one("[data-pf-block-top]");
        const faceFront = one("[data-pf-block-front]");
        const faceSide = one("[data-pf-block-side]");
        if (block && tilt && turn && slab && faceTop && faceFront && faceSide) {
          const pick = { p: 0 };
          const carry = { p: 0 };
          const zoom = { p: 0 };
          // Partenza: i colori del piano nella scena in quel momento (l'edificio cambia tono nel tempo).
          const paper: [string, string, string] = ["#f4f3f0", "#e2e1dd", "#d3d2ce"];
          const inks = [color("--ink"), "#1b1b1a", "#121211"];
          const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
          const span = BLOCK.w * Math.cos((BLOCK.turn * Math.PI) / 180) + BLOCK.d * Math.sin((BLOCK.turn * Math.PI) / 180);

          const render = () => {
            blockDrop.source?.releaseBlock(pick.p > 0);
            if (pick.p === 0) {
              block.style.opacity = "0";
              return;
            }
            const vw = sticky.clientWidth;
            const vh = sticky.clientHeight;
            // Punto di presa, in coordinate dello schermo, misurato a ogni aggiornamento: la scena scorre via
            // verso l'alto e il blocco deve restarle attaccato finché non viene portato al centro.
            // La larghezza a schermo del blocco inclinato è circa BLOCK.w·cos(giro) + BLOCK.d·sin(giro).
            const r = blockDrop.source?.blockRect();
            const from = r ? { x: r.x + r.w / 2, y: r.y + r.h / 2, k: r.w / span } : { x: vw * 0.72, y: vh * 0.35, k: 0.4 };
            const p = pick.p;
            const c = carry.p;
            const z = zoom.p;
            const k1 = (vw * 0.3) / BLOCK.w;
            const k = lerp(from.k * (1 + 0.1 * p), k1, c);
            const w = z > 0 ? lerp(BLOCK.w * k1, vw + 4, z) : BLOCK.w * k;
            const h = z > 0 ? lerp(BLOCK.d * k1, vh + 4, z) : BLOCK.d * k;
            const thick = BLOCK.t * (z > 0 ? k1 : k);
            const cx = lerp(from.x, vw / 2, c);
            const cy = lerp(from.y - vh * 0.05 * p, vh / 2, c);
            const dark = Math.min(1, Math.max(0, (c - 0.15) / 0.7));
            const top = stage.getBoundingClientRect().top;

            block.style.opacity = "1";
            block.style.transform = `translate(${cx}px, ${cy - top}px)`;
            tilt.style.transform = `rotateX(${lerp(BLOCK.tilt, 0, c)}deg)`;
            turn.style.transform = `rotateZ(${lerp(BLOCK.turn, 0, c)}deg)`;
            slab.style.width = `${w}px`;
            slab.style.height = `${h}px`;
            slab.style.left = `${-w / 2}px`;
            slab.style.top = `${-h / 2}px`;
            faceFront.style.height = `${thick}px`;
            faceSide.style.width = `${thick}px`;
            const start = blockDrop.source?.blockColors() ?? paper;
            [faceTop, faceFront, faceSide].forEach(
              (face, i) => (face.style.backgroundColor = gsap.utils.interpolate(start[i], inks[i], dark)),
            );
            // Come l'apertura di "What we've learned": rettangolo, poi arrotondato, poi dritto a tutto schermo.
            faceTop.style.borderRadius = `${Math.sin(Math.PI * z) * Math.min(vw, vh) * 0.1}px`;
          };

          root.to(pick, { p: 1, duration: 8, ease: "power2.out", onUpdate: render }, 2);
          root.to(carry, { p: 1, duration: 46, ease: "power2.inOut", onUpdate: render }, 10);
          root.to(zoom, { p: 1, duration: 42, ease: "power3.in", onUpdate: render }, 56);
          // Il blocco, ormai nero a tutto schermo, si spegne solo quando il foglio sotto è del tutto opaco:
          // altrimenti per un istante si vedrebbe la pagina chiara attraverso il nero (frame grigio).
          // Fino ad allora resta agganciato allo schermo mentre la sezione finisce di salire.
          root.to({}, { duration: 2, onUpdate: render }, 98);
          root.set(block, { opacity: 0 }, 100);
          follow = () => {
            if (pick.p > 0 && carry.p < 1) render();
          };
        }
        // Il foglio vero compare sotto il blocco che copre lo schermo: la sezione è appena arrivata in cima.
        // Anche la scena resta nascosta fino ad allora: la lastra del Core, scura, si vedrebbe sul bianco.
        root.fromTo([ink, fit], { opacity: 0 }, { opacity: 1, duration: 2 }, 98);

        // Ingresso: il titolo nasce sul foglio scuro.
        tl.fromTo(all("[data-pf-eyebrow]"), { opacity: 0 }, { opacity: 1, duration: 10 }, 30);
        tl.fromTo(
          all("[data-pf-title] .gs-line"),
          { yPercent: 110 },
          { yPercent: 0, duration: 20, stagger: 5, ease: "power3.out" },
          34,
        );

        // Il foglio si stringe nel quadrato del Core, visto dall'alto: a scena piatta coincide con la colonna centrata.
        const s = sticky.getBoundingClientRect();
        const c = cell.getBoundingClientRect();
        const size = W * scale;
        const top = c.top - s.top + (c.height - size) / 2;
        const left = c.left - s.left + (c.width - size) / 2;
        tl.fromTo(
          ink,
          { clipPath: "inset(0px 0px 0px 0px)", visibility: "inherit" },
          {
            clipPath: `inset(${top}px ${s.width - left - size}px ${s.height - top - size}px ${left}px)`,
            duration: 40,
            ease: "power3.inOut",
          },
          108,
        );
        tl.set(ink, { visibility: "hidden" }, 150);
        tl.fromTo(one("[data-pf-title]"), { color: color("--ink-text") }, { color: color("--text"), duration: 30 }, 118);
        tl.fromTo(one("[data-pf-eyebrow]"), { color: color("--ink-text") }, { color: color("--text-muted"), duration: 30 }, 118);
        tl.fromTo(all("[data-pf-core-head]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 10 }, 146);

        // La scena si inclina: il quadrato diventa una lastra con spessore.
        tl.fromTo(one("[data-pf-world]"), { rotationX: 0 }, { rotationX: TILT, duration: 44, ease: "power2.inOut" }, 152);
        tl.fromTo(one("[data-pf-turn]"), { rotation: 0 }, { rotation: TURN, duration: 44, ease: "power2.inOut" }, 152);
        tl.fromTo(all("[data-pf-shadow]"), { opacity: 0 }, { opacity: 1, duration: 30 }, 166);
        const cam = one("[data-pf-cam]");
        tl.fromTo(cam, { scale: 1, y: 0 }, { scale: ZOOM, y: 20, duration: 44, ease: "power2.inOut" }, 152);

        // Paginazione: contatore che scorre, una barra per passo che si riempie con lo scroll.
        const enter = [168, 245, 315, 385, 455, 525, 595];
        const count = enter.length;
        tl.fromTo(one("[data-pf-pager]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 12, ease: "power2.out" }, enter[0] - 6);
        const digits = one("[data-pf-digits]");
        enter.forEach((at, i) => {
          if (i > 0) tl.to(digits, { yPercent: -(100 / count) * i, duration: 12, ease: "power3.inOut" }, at - 6);
        });
        all("[data-pf-seg]").forEach((seg, i) => {
          const until = enter[i + 1] ?? FUSE - 15;
          tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: until - enter[i] }, enter[i]);
        });

        // Testi dei passi: le righe salgono dalla maschera, i testi secondari vanno a fuoco ed escono sfocando.
        all("[data-pf-step]").forEach((step, i) => {
          const lines = all(".gs-line", step);
          const meta = all("[data-pf-step-meta]", step);
          tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" }, enter[i]);
          tl.fromTo(
            meta,
            { autoAlpha: 0, y: 18, filter: "blur(6px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 14, stagger: 4, ease: "power2.out" },
            enter[i] + 4,
          );
          const next = enter[i + 1];
          if (next !== undefined) {
            tl.to(lines, { yPercent: -110, duration: 12, stagger: 3, ease: "power3.in" }, next - 10);
            tl.to(meta, { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: 10, ease: "power2.in" }, next - 10);
          }
        });

        // 1 Core: i moduli condivisi si accendono sulla lastra, uno dopo l'altro.
        tl.fromTo(
          all("[data-pf-module]"),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 10, stagger: 5, ease: "power3.out" },
          enter[0] + 6,
        );

        // 2 Metodo: la cornice degli standard scende dall'alto e si ferma sopra il Core. La camera si allarga.
        const method = one("[data-pf-method]");
        tl.fromTo(method, { z: Z_METHOD + 320 }, { z: Z_METHOD, duration: 30, ease: "power3.out" }, enter[1]);
        tl.fromTo(all("[data-pf-face]", method ?? stage), { opacity: 0 }, { opacity: 1, duration: 14 }, enter[1]);
        tl.to(cam, { scale: 1, y: 70, duration: 30, ease: "power2.inOut" }, enter[1]);
        tl.to(all("[data-pf-core-head]"), { opacity: 0, duration: 10 }, enter[1]);

        // 3–6 Applicazioni: una linea di business per passo cade al suo posto e si collega al Core.
        // Quella del passo attivo diventa scura; al passo dopo torna chiara, tutto resta opaco e leggibile.
        const light = { backgroundColor: color("--bg-elevated"), color: color("--text"), borderColor: color("--line-strong") };
        const dark = { backgroundColor: color("--ink"), color: color("--ink-text"), borderColor: color("--ink") };
        const groups = all("[data-pf-group]");
        groups.forEach((group, k) => {
          const at = enter[k + 2];
          const tops = all("[data-pf-top]", group);
          const sides = all("[data-pf-side]", group);
          tl.fromTo(group, { z: 300 }, { z: 0, duration: 26, ease: "power3.out" }, at);
          tl.fromTo(all("[data-pf-face]", group), { opacity: 0 }, { opacity: 1, duration: 12 }, at);
          tl.fromTo(all("[data-pf-beam]", group), { scaleY: 0 }, { scaleY: 1, duration: 14, stagger: 3, ease: "power2.out" }, at + 18);
          tl.fromTo(tops, light, { ...dark, duration: 10, stagger: 2 }, at + 14);
          tl.fromTo(sides, { filter: "brightness(1)" }, { filter: "brightness(0.16)", duration: 10 }, at + 14);
          tl.to(tops, { ...light, duration: 10 }, enter[k + 3]);
          tl.to(sides, { filter: "brightness(1)", duration: 10 }, enter[k + 3]);
        });
        tl.to(cam, { y: 110, duration: 26, ease: "power2.inOut" }, enter[2]);

        // 7 Rilascio: una scansione attraversa il Core, sale lungo i collegamenti e accende ogni applicazione, una dopo l'altra.
        const result = enter[6];
        tl.fromTo(all("[data-pf-scan]"), { xPercent: -100, autoAlpha: 1 }, { xPercent: 300, duration: 22, ease: "power1.inOut" }, result + 2);
        const beams = all("[data-pf-beam]");
        tl.to(beams, { backgroundColor: color("--text"), duration: 4, stagger: 0.8 }, result + 14);
        tl.to(beams, { backgroundColor: color("--line-strong"), duration: 10, stagger: 0.8 }, result + 26);
        const tops = all("[data-pf-top]");
        tl.to(tops, { ...dark, duration: 4, stagger: 1 }, result + 18);
        tl.to(tops, { ...light, duration: 10, stagger: 1 }, result + 26);
        const sides = all("[data-pf-side]");
        tl.to(sides, { filter: "brightness(0.16)", duration: 4, stagger: 0.5 }, result + 18);
        tl.to(sides, { filter: "brightness(1)", duration: 10, stagger: 0.5 }, result + 26);
        tl.to(groups, { z: 18, duration: 6, stagger: 3, ease: "power2.out" }, result + 18);
        tl.to(groups, { z: 0, duration: 8, stagger: 3, ease: "power2.inOut" }, result + 24);

        // Fusione: i testi escono, gli strati si schiacciano sul Core e si tingono d'azzurro, la pila gira sempre
        // più veloce stringendosi al centro dello schermo e si scioglie nella sfera AI. Da FUSE + 80 tutto è fermo.
        tl.to(all("[data-pf-head], [data-pf-foot]"), { autoAlpha: 0, y: -24, duration: 16, ease: "power2.in" }, FUSE);
        tl.to(method, { z: 8, duration: 30, ease: "power3.inOut" }, FUSE + 4);
        tl.to(groups, { z: -(Z_APPS - T_TILE), duration: 30, stagger: 3, ease: "power3.inOut" }, FUSE + 6);
        tl.to(beams, { scaleY: 0, duration: 12, ease: "power2.in" }, FUSE + 4);
        const glass = { backgroundColor: "#e6f1ff", color: "#3d6d9e", borderColor: "#a9cdf2" };
        tl.to(tops, { ...glass, duration: 16, stagger: 0.6 }, FUSE + 12);
        tl.to(all("[data-pf-method] [data-pf-face]"), { backgroundColor: "#e6f1ff", duration: 16 }, FUSE + 12);
        tl.to(one("[data-pf-turn]"), { rotation: TURN - 300, duration: 62, ease: "power2.in" }, FUSE + 8);
        tl.to(one("[data-pf-world]"), { rotationX: 34, duration: 50, ease: "power2.inOut" }, FUSE + 8);
        // Il centro del diagramma va al centro dello schermo: lo spostamento è nello spazio della camera, prima della scala.
        const f = fit.getBoundingClientRect();
        const dx = (s.left + s.width / 2 - (f.left + f.width / 2)) / scale;
        const dy = (s.top + s.height / 2 - (f.top + f.height / 2)) / scale;
        tl.to(cam, { x: dx, y: dy, duration: 44, ease: "power2.inOut" }, FUSE + 6);
        tl.to(cam, { scale: 0.22, duration: 46, ease: "power2.inOut" }, FUSE + 14);
        // Sulla camera, non su fit: l'opacità di fit la anima già la timeline esterna, e due timeline sulla stessa
        // proprietà si riavvolgono nell'ordine sbagliato con un salto all'indietro (il diagramma ricompare nello zoom).
        tl.to(cam, { opacity: 0, duration: 18, ease: "power1.in" }, FUSE + 48);
        // La sfera sta davanti: la pila rimpicciolita finisce dentro il vetro, sfocata, e lì si scioglie.
        const orb = one("[data-pf-orb]");
        tl.fromTo(orb, { autoAlpha: 0 }, { autoAlpha: 1, duration: 16 }, FUSE + 30);
        tl.fromTo(all("[data-orb-core]", orb ?? stage), { scale: 0.35 }, { scale: 1, duration: 46, ease: "power2.inOut" }, FUSE + 30);
        tl.fromTo(all("[data-orb-halo]", orb ?? stage), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 40, ease: "power2.out" }, FUSE + 36);

        tl.set({}, {}, STAGE);
        root.add(tl, LEAD);
        return root;
      },
    });

    return () => {
      gsap.ticker.remove(tick);
      split.revert();
      leds.kill();
    };
  }, []);

  const steps = platform.steps;

  return (
    <section ref={stageRef} className="relative h-[870svh] bg-bg motion-reduce:h-auto">
      <div
        data-pf-sticky
        className="sticky top-0 h-svh overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-svh"
      >
        <div data-pf-ink aria-hidden className="absolute inset-0 bg-ink-bg motion-reduce:hidden" />

        <Container className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-y-4 pt-[calc(var(--header-h)+4svh)] pb-[7svh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-10 motion-reduce:py-24">
          <div data-pf-head className="lg:col-start-1 lg:row-start-1">
            <p data-pf-eyebrow className="font-mono text-[13px] text-ink-text motion-reduce:text-muted">
              05 — Platform
            </p>
            <h2
              data-pf-title
              className="display mt-6 max-w-xl text-[clamp(36px,4.6vw,72px)] leading-[0.98] text-ink-text motion-reduce:text-ink"
            >
              {platform.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          {/* Vista esplosa: su desktop la colonna invade il margine destro della pagina, la scena ha bisogno di spazio. */}
          <div
            aria-hidden
            className="relative flex min-h-0 items-center justify-center motion-reduce:min-h-[70svh] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mr-[min(0px,calc((1280px-100vw)/2))]"
          >
            <div
              data-pf-fit
              className="relative shrink-0 [transform:scale(var(--pf-fit,0.8))]"
              style={{ width: W, height: W }}
            >
              <div data-pf-cam className="absolute inset-0">
                <div className="absolute inset-0 [perspective:2600px]">
                  <div
                    data-pf-world
                    className="absolute inset-0 [transform-style:preserve-3d]"
                    style={{ transform: `rotateX(${TILT}deg)` }}
                  >
                    <div
                      data-pf-turn
                      className="absolute inset-0 [transform-style:preserve-3d]"
                      style={{ transform: `rotate(${TURN}deg)` }}
                    >
                      {/* Ombra a terra, sotto tutta la pila. */}
                      <div
                        data-pf-shadow
                        className="absolute -inset-[12%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.14),transparent)]"
                        style={{ transform: "translateZ(-90px)" }}
                      />

                      {/* Livello 0: Mindlead Core, stesso colore del foglio scuro che si stringe su di lui. */}
                      <div className="absolute inset-0 [transform-style:preserve-3d]">
                        <Slab
                          t={T_CORE}
                          face="overflow-hidden bg-ink-bg"
                          front="#1b1b1a"
                          side="#121211"
                          edge={
                            <span className="flex h-full items-center justify-between px-5 font-mono text-[11px] tracking-[0.18em] text-ink-text/60 uppercase">
                              <span>{platform.core.name}</span>
                              <span>Layer 0</span>
                            </span>
                          }
                        >
                          <div className="flex h-full flex-col justify-between p-12">
                            <div data-pf-core-head>
                              <p className="display text-[34px] leading-none text-ink-text">{platform.core.name}</p>
                              <p className="mt-3 font-mono text-[12px] text-ink-text/50">{platform.core.tag}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              {platform.core.modules.map((module) => (
                                <div
                                  key={module}
                                  data-pf-module
                                  className="flex items-center gap-2.5 border border-ink-line px-3.5 py-3 font-mono text-[12px] text-ink-text"
                                >
                                  <span data-pf-led className="size-1.5 rounded-full bg-ink-text" />
                                  {module}
                                </div>
                              ))}
                            </div>
                          </div>
                          <span
                            data-pf-scan
                            className="pointer-events-none invisible absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]"
                          />
                        </Slab>
                      </div>

                      {/* Livello 1: la cornice del metodo, attorno a tutto. */}
                      <div
                        data-pf-method
                        className="absolute inset-0 [transform-style:preserve-3d]"
                        style={{ transform: `translateZ(${Z_METHOD}px)` }}
                      >
                        {platform.method.items.map((item, i) => {
                          const frame = [
                            { left: 0, top: 0, width: W, height: 52 },
                            { left: W - 52, top: 52, width: 52, height: W - 104 },
                            { left: 0, top: W - 52, width: W, height: 52 },
                            { left: 0, top: 52, width: 52, height: W - 104 },
                          ][i];
                          const vertical = i % 2 === 1;
                          return (
                            <div key={item} className="absolute [transform-style:preserve-3d]" style={frame}>
                              <Slab t={8} face="border border-line-strong bg-bg-elevated" front="#e4e3df" side="#d8d7d3">
                                <span
                                  className={`absolute inset-0 flex items-center justify-center font-mono text-[12px] tracking-[0.14em] text-text uppercase ${
                                    vertical ? "[writing-mode:vertical-rl]" : ""
                                  } ${i === 3 ? "rotate-180" : ""}`}
                                >
                                  {item}
                                </span>
                              </Slab>
                            </div>
                          );
                        })}
                      </div>

                      {/* Livello 2: le applicazioni, un quadrante per linea di business. */}
                      <div
                        className="absolute inset-0 [transform-style:preserve-3d]"
                        style={{ transform: `translateZ(${Z_APPS}px)` }}
                      >
                        {platform.columns.map((column, k) => {
                          const q = Q[k];
                          return (
                            <div key={column.name} data-pf-group className="absolute inset-0 [transform-style:preserve-3d]">
                              {TILES[k].map((tile, i) => {
                                const t = "t" in tile ? tile.t : T_TILE;
                                const card = column.cards[i];
                                return (
                                  <div
                                    key={card.name}
                                    className="absolute [transform-style:preserve-3d]"
                                    style={{ left: q.x + tile.x, top: q.y + tile.y, width: tile.w, height: tile.h }}
                                  >
                                    <Slab
                                      t={t}
                                      top
                                      face={`flex flex-col justify-between border border-line-strong bg-bg-elevated p-3.5 text-text ${
                                        k === 2
                                          ? "bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:39px_39px] bg-center"
                                          : ""
                                      }`}
                                      front="#ebeae6"
                                      side="#dcdbd7"
                                    >
                                      <span className="font-mono text-[10px] tracking-[0.1em] uppercase opacity-55">
                                        {column.name} · {card.kind}
                                      </span>
                                      <span className="text-[16px] leading-tight">{card.name}</span>
                                    </Slab>
                                    {/* Collegamento verticale fino al Core. */}
                                    <span
                                      className="absolute top-1/2 left-1/2 w-[1.5px] origin-top"
                                      style={{ height: Z_APPS - t, transform: `translateZ(${-t}px) rotateX(-90deg)` }}
                                    >
                                      <span data-pf-face className="block h-full">
                                        <span data-pf-beam className="block h-full origin-top bg-line-strong" />
                                      </span>
                                    </span>
                                  </div>
                                );
                              })}
                              {k === 3 && (
                                <div
                                  data-pf-face
                                  className="absolute flex items-center justify-center border border-dashed border-line-strong font-mono text-[12px] text-muted"
                                  style={{ left: q.x, top: q.y + 160, width: 236, height: 76 }}
                                >
                                  + Next venture
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-pf-foot className="self-end lg:col-start-1 lg:row-start-2">
            <div data-pf-pager className="flex items-center gap-4 font-mono text-[13px]">
              <span className="relative block h-[1.3em] overflow-hidden leading-[1.3em]">
                <span data-pf-digits className="block">
                  {steps.map((step, i) => (
                    <span key={step.label} className="block">
                      {pad(i + 1)}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-faint">/ {pad(steps.length)}</span>
              <span className="flex w-full max-w-[240px] gap-1.5">
                {steps.map((step) => (
                  <span key={step.label} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                    <span data-pf-seg className="absolute inset-0 origin-left scale-x-0 bg-ink motion-reduce:scale-x-100" />
                  </span>
                ))}
              </span>
            </div>

            <div className="mt-8 grid motion-reduce:gap-12">
              {steps.map((step) => (
                <article key={step.title} data-pf-step className="[grid-area:1/1] motion-reduce:[grid-area:auto]">
                  <p data-pf-step-meta className="font-mono text-[12px] tracking-[0.08em] text-muted uppercase">
                    {step.label}
                  </p>
                  <h3 data-pf-step-title className="display mt-4 text-[clamp(26px,2.8vw,44px)] leading-none">
                    {step.title}
                  </h3>
                  <p data-pf-step-meta className="mt-4 max-w-md text-[16px] text-muted">
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Container>
        {/* La sfera AI in cui si fondono gli strati: al centro esatto del palco, come in "Intelligence". */}
        <div
          data-pf-orb
          aria-hidden
          className="pointer-events-none invisible absolute inset-0 z-40 flex items-center justify-center opacity-0 motion-reduce:hidden"
        >
          <AiOrb />
        </div>
      </div>
      {/* Fuori dal palco: nasce nella scena della sezione precedente, sopra il bordo, dove il palco taglierebbe.
          Faccia superiore più i due fianchi visibili con questo giro (fronte e destra), come nella scena. */}
      <span
        data-pf-block
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-40 block opacity-0 [perspective:1800px] motion-reduce:hidden"
      >
        <span data-pf-block-tilt className="absolute top-0 left-0 block [transform-style:preserve-3d]">
          <span data-pf-block-turn className="absolute top-0 left-0 block [transform-style:preserve-3d]">
            <span data-pf-block-slab className="absolute block [transform-style:preserve-3d]">
              <span data-pf-block-top className="absolute inset-0 block border border-ink" />
              <span
                data-pf-block-front
                className="absolute top-full left-0 block w-full origin-top border border-ink [backface-visibility:hidden]"
                style={{ transform: "rotateX(-90deg)" }}
              />
              <span
                data-pf-block-side
                className="absolute top-0 left-full block h-full origin-left border border-ink [backface-visibility:hidden]"
                style={{ transform: "rotateY(90deg)" }}
              />
            </span>
          </span>
        </span>
      </span>
    </section>
  );
}
