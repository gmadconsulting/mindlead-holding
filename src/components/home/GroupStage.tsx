"use client";

import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { insights, manifesto, model } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { gsap, registerGsap } from "@/lib/gsap";
import type { ServicesScene } from "@/components/graphics/services-scene";
import { engineDrop } from "@/lib/engine-drop";

/** Altezza del palco in svh (deve coincidere con h-[700svh]): la timeline usa la stessa unità. */
const STAGE = 700;

/** Punto da cui nasce l'apertura, in frazioni del pannello. */
const ORIGIN = { x: 0.5, y: 0.56 };
/** Parte di crescita in cui la forma resta un cerchio perfetto. */
const CIRCLE_PART = 0.4;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Apertura geometrica: un cerchio che cresce, poi si allunga in un rettangolo
 * arrotondato fino a tutto schermo mentre gli angoli diventano dritti.
 * Restituisce il valore di clip-path per un pannello w × h; `grow` va da 0 a 1.
 */
function revealClip(grow: number, w: number, h: number) {
  if (grow <= 0.0001) return "inset(50% round 0px)";
  const circle = Math.min(w, h) * 0.42;
  let width: number;
  let height: number;
  let cx: number;
  let cy: number;
  let radius: number;
  if (grow < CIRCLE_PART) {
    width = height = circle * (grow / CIRCLE_PART);
    cx = ORIGIN.x * w;
    cy = ORIGIN.y * h;
    radius = width / 2;
  } else {
    const t = easeInOut((grow - CIRCLE_PART) / (1 - CIRCLE_PART));
    width = lerp(circle, w, t);
    height = lerp(circle, h, t);
    cx = lerp(ORIGIN.x * w, w / 2, t);
    cy = lerp(ORIGIN.y * h, h / 2, t);
    radius = lerp(circle / 2, 0, t);
  }
  const top = Math.max(0, cy - height / 2);
  const left = Math.max(0, cx - width / 2);
  const bottom = Math.max(0, h - (cy + height / 2));
  const right = Math.max(0, w - (cx + width / 2));
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`;
}

/**
 * Manifesto e capitolo "What we've learned" in un unico palco fermo a schermo.
 * La frase si accende e si ripiega, un cerchio scuro si apre fino a diventare il capitolo,
 * poi i tre punti si alternano a tutto schermo mentre la scena 3D cambia forma.
 * Infine la camera si allontana: la linea di produzione è una tappa del motore del gruppo,
 * il buio diventa chiaro e le quattro tappe del ciclo si accendono una alla volta.
 */
export function GroupStage() {
  const stageRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const text = textRef.current;
    const panel = panelRef.current;
    const sceneBox = sceneRef.current;
    if (!stage || !text || !panel || !sceneBox) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsap();
    gsap.registerPlugin(SplitText);

    let disposed = false;
    let scene: ServicesScene | null = null;
    let sceneState = 0;
    let observer: IntersectionObserver | null = null;

    import("@/components/graphics/services-scene").then(async ({ createServicesScene }) => {
      if (disposed) return;
      const created = await createServicesScene(sceneBox);
      if (disposed) {
        created.dispose();
        return;
      }
      scene = created;
      created.setState(sceneState);
      engineDrop.source = created;
      observer = new IntersectionObserver(([entry]) => created.setActive(entry.isIntersecting));
      observer.observe(stage);
    });

    const titles = Array.from(stage.querySelectorAll<HTMLElement>("[data-point-title], [data-engine-title]"));
    const split = SplitText.create([text, ...titles], {
      type: "lines,words",
      mask: "lines",
      linesClass: "gs-line",
      wordsClass: "gs-word",
      autoSplit: true,
      // Ricreata a ogni nuova divisione (resize, font caricati): le righe cambiano.
      onSplit: () => {
        const all = (root: ParentNode, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const points = all(stage, "[data-point]").map((el) => ({
          lines: all(el, ".gs-line"),
          meta: all(el, "[data-point-num], [data-point-body]"),
        }));
        const bars = all(stage, "[data-bar]");

        // Le posizioni sono in svh di scroll: 0 = palco che entra dal fondo, STAGE = fine.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        });

        // Manifesto: parole che si accendono, poi le righe si ripiegano verso l'alto.
        tl.fromTo(
          all(text, ".gs-word"),
          { color: "var(--text-faint)" },
          { color: "var(--text)", duration: 15, stagger: { amount: 70 } },
          10,
        );
        tl.to(all(stage, "[data-manifesto-eyebrow]"), { opacity: 0, y: -16, duration: 12, ease: "power2.in" }, 104);
        tl.to(all(text, ".gs-line"), { yPercent: -110, duration: 18, stagger: 5, ease: "power3.in" }, 108);

        // Apertura: cerchio, poi rettangolo arrotondato fino a tutto schermo; alla fine il ritaglio si toglie.
        const reveal = { grow: 0 };
        const drawReveal = () => {
          panel.style.clipPath =
            reveal.grow >= 0.999 ? "none" : revealClip(reveal.grow, panel.offsetWidth, panel.offsetHeight);
        };
        drawReveal();
        tl.to(reveal, { grow: 1, duration: 58, ease: "power1.inOut", onUpdate: drawReveal }, 108);

        // Scena 3D: montaggio, poi passaggi tra i tre stati.
        const sceneProxy = { v: 0 };
        const pushScene = () => {
          sceneState = sceneProxy.v;
          scene?.setState(sceneState);
        };
        tl.to(sceneProxy, { v: 1, duration: 60, onUpdate: pushScene }, 128);
        tl.to(sceneProxy, { v: 2, duration: 32, onUpdate: pushScene }, 216);
        tl.to(sceneProxy, { v: 3, duration: 32, onUpdate: pushScene }, 300);
        // Zoom indietro sul motore, poi una tappa alla volta.
        tl.to(sceneProxy, { v: 4, duration: 60, onUpdate: pushScene }, 395);
        tl.to(sceneProxy, { v: 5, duration: 30, onUpdate: pushScene }, 520);
        tl.to(sceneProxy, { v: 6, duration: 30, onUpdate: pushScene }, 580);
        tl.to(sceneProxy, { v: 7, duration: 30, onUpdate: pushScene }, 640);

        tl.fromTo(all(stage, "[data-toprow]"), { opacity: 0 }, { opacity: 1, duration: 12 }, 150);
        tl.to(all(stage, "[data-toprow]"), { opacity: 0, duration: 10 }, 395);

        // Tre punti, ognuno con il suo momento a schermo intero.
        const enter = [140, 232, 316];
        const leave = [216, 300, 395];
        points.forEach((point, i) => {
          tl.fromTo(
            point.lines,
            { yPercent: 110 },
            { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" },
            enter[i],
          );
          tl.fromTo(
            point.meta,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 14, stagger: 4, ease: "power2.out" },
            enter[i] + 8,
          );
          if (leave[i] !== undefined) {
            tl.to(point.lines, { yPercent: -110, duration: 14, stagger: 3, ease: "power3.in" }, leave[i]);
            tl.to(point.meta, { opacity: 0, y: -16, duration: 10, ease: "power2.in" }, leave[i]);
          }
        });

        // Avanzamento: una barra per punto che si riempie mentre il punto è a schermo.
        const fill = [
          [165, 50],
          [250, 50],
          [335, 50],
        ];
        bars.forEach((bar, i) => {
          tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: fill[i][1] }, fill[i][0]);
        });

        // Il buio diventa chiaro mentre la camera si allontana.
        const css = getComputedStyle(document.documentElement);
        const color = (name: string) => css.getPropertyValue(name).trim();
        tl.fromTo(
          panel,
          { backgroundColor: getComputedStyle(panel).backgroundColor },
          { backgroundColor: color("--bg"), duration: 20, ease: "power1.inOut" },
          416,
        );

        // Motore: titolo, tappe, e la tappa attiva che si accende insieme alla sua stazione.
        tl.fromTo(all(stage, "[data-engine-eyebrow]"), { opacity: 0 }, { opacity: 1, duration: 10 }, 440);
        tl.fromTo(
          all(stage, "[data-engine-title] .gs-line"),
          { yPercent: 110 },
          { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" },
          444,
        );
        tl.fromTo(
          all(stage, "[data-step]"),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 12, stagger: 4, ease: "power2.out" },
          452,
        );
        const faint = color("--text-faint");
        const ink = color("--text");
        const stepTitles = all(stage, "[data-step-title], [data-step-num]");
        const bodies = all(stage, "[data-step-body]");
        const activate = [466, 535, 595, 655];
        activate.forEach((at, i) => {
          const row = stepTitles.slice(i * 2, i * 2 + 2);
          tl.fromTo(row, { color: faint }, { color: ink, duration: 8 }, at);
          tl.fromTo(bodies[i], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 10, ease: "power2.out" }, at + 2);
          const next = activate[i + 1];
          if (next !== undefined) {
            tl.to(row, { color: faint, duration: 8 }, next);
            tl.to(bodies[i], { opacity: 0, y: -8, duration: 6, ease: "power2.in" }, next - 4);
          }
        });
        tl.fromTo(all(stage, "[data-engine-loop]"), { opacity: 0 }, { opacity: 1, duration: 12 }, 672);

        tl.set({}, {}, STAGE);
        return tl;
      },
    });

    return () => {
      disposed = true;
      split.revert();
      observer?.disconnect();
      if (engineDrop.source === scene) engineDrop.source = null;
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={stageRef} className="relative h-[700svh] motion-reduce:h-auto">
      <div className="sticky top-0 h-svh overflow-hidden bg-bg motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible">
        <Container className="relative z-10 pt-[12svh] motion-reduce:py-24">
          <div data-manifesto-eyebrow>
            <Eyebrow index="01" label="The group" />
          </div>
          <p
            ref={textRef}
            className="display max-w-4xl text-[clamp(32px,4.6vw,64px)] text-faint motion-reduce:text-[var(--text)]"
          >
            {manifesto}
          </p>
        </Container>

        <div
          ref={panelRef}
          className="absolute inset-0 z-20 bg-ink-bg text-ink-text [clip-path:inset(50%)] motion-reduce:relative motion-reduce:[clip-path:none]"
        >
          <div ref={sceneRef} aria-hidden className="absolute inset-0 motion-reduce:hidden" />
          <Container className="relative flex h-full flex-col pt-[calc(var(--header-h)+4svh)] pb-[9svh] motion-reduce:py-24">
            <div data-toprow className="flex items-center justify-between font-mono text-[13px] text-ink-text/60">
              <p>02 — What we&apos;ve learned</p>
              <div className="flex gap-2" aria-hidden>
                {insights.map((item) => (
                  <span key={item.title} className="relative block h-px w-10 bg-ink-text/20">
                    <span data-bar className="absolute inset-0 origin-left scale-x-0 bg-ink-text motion-reduce:scale-x-100" />
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-auto grid motion-reduce:mt-16 motion-reduce:gap-20">
              {insights.map((item, index) => (
                <article key={item.title} data-point className="max-w-xl [grid-area:1/1] motion-reduce:[grid-area:auto]">
                  <p data-point-num className="font-mono text-[13px] text-ink-text/50">
                    0{index + 1} / 0{insights.length}
                  </p>
                  <h2 data-point-title className="display mt-5 text-[clamp(44px,6.2vw,104px)] leading-[0.95]">
                    {item.title}
                  </h2>
                  <p data-point-body className="mt-6 max-w-md text-[18px] text-ink-text/60">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </Container>

          <div className="pointer-events-none absolute inset-0 text-[var(--text)] motion-reduce:relative motion-reduce:inset-auto motion-reduce:bg-bg">
            <Container className="flex h-full flex-col pt-[calc(var(--header-h)+4svh)] pb-[9svh] motion-reduce:py-24">
              <p data-engine-eyebrow className="font-mono text-[13px] text-muted">
                03 — Our model
              </p>
              <h2 data-engine-title className="display mt-6 max-w-xl text-[clamp(36px,4.6vw,72px)] leading-[0.98]">
                {model.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <div className="mt-auto max-w-md motion-reduce:mt-12">
                <ol className="space-y-3">
                  {model.cycle.map((step, index) => (
                    <li key={step.title} data-step className="flex gap-4 text-[clamp(18px,1.6vw,22px)] leading-snug">
                      <span data-step-num className="pt-1 font-mono text-[13px] text-faint motion-reduce:text-[var(--text)]">
                        0{index + 1}
                      </span>
                      <span data-step-title className="text-faint motion-reduce:text-[var(--text)]">
                        {step.title}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-8 grid motion-reduce:gap-4">
                  {model.cycle.map((step) => (
                    <p
                      key={step.title}
                      data-step-body
                      className="text-[17px] text-muted [grid-area:1/1] motion-reduce:[grid-area:auto]"
                    >
                      {step.body}
                    </p>
                  ))}
                </div>
                <p data-engine-loop className="mt-8 font-mono text-[13px]">
                  {model.loop}
                </p>
              </div>
            </Container>
          </div>
        </div>
      </div>
    </section>
  );
}
