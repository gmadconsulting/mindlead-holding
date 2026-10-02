"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { SplitText } from "gsap/SplitText";
import { approach } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { gsap, registerGsap } from "@/lib/gsap";
import type { ApproachScene } from "@/components/graphics/approach-scene";
import { engineDrop } from "@/lib/engine-drop";

/** Altezza del palco in svh (deve coincidere con h-[520svh]): la timeline usa la stessa unità. */
const STAGE = 520;

/**
 * "Our companies": quale azienda del gruppo risponde a quale scala di cliente.
 * Quattro terrazze a quote crescenti; scorrendo la camera sale di livello in livello
 * e a sinistra si alternano azienda, scala e approccio.
 */
export function ApproachStage() {
  const stageRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const sceneBox = sceneRef.current;
    if (!stage || !sceneBox) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsap();
    gsap.registerPlugin(SplitText);

    let disposed = false;
    let scene: ApproachScene | null = null;
    let sceneState = 0;
    let observer: IntersectionObserver | null = null;

    import("@/components/graphics/approach-scene").then(async ({ createApproachScene }) => {
      if (disposed) return;
      const created = await createApproachScene(sceneBox);
      if (disposed) {
        created.dispose();
        return;
      }
      scene = created;
      created.setState(sceneState);
      observer = new IntersectionObserver(([entry]) => created.setActive(entry.isIntersecting));
      observer.observe(stage);
    });

    const titles = Array.from(stage.querySelectorAll<HTMLElement>("[data-approach-title], [data-level-title]"));
    const split = SplitText.create(titles, {
      type: "lines",
      mask: "lines",
      linesClass: "gs-line",
      autoSplit: true,
      // Ricreata a ogni nuova divisione (resize, font caricati): le righe cambiano.
      onSplit: () => {
        const all = (root: ParentNode, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const css = getComputedStyle(document.documentElement);
        const ink = css.getPropertyValue("--text").trim();
        const line = css.getPropertyValue("--line-strong").trim();
        const levels = all(stage, "[data-level]").map((el) => ({
          lines: all(el, ".gs-line"),
          meta: all(el, "[data-level-meta]"),
        }));
        const ticks = all(stage, "[data-level-tick]");

        // Le posizioni sono in svh di scroll: 0 = palco che entra dal fondo, STAGE = fine.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom bottom", scrub: true },
        });

        // La goccia: una delle palline che girano sull'anello del motore (GroupStage) si gonfia, si stacca
        // e cade dritta; all'impatto il tono di questa sezione si apre a onde e porta con sé la scena.
        // La pallina si muove: la posizione si legge dal vivo a ogni aggiornamento dello scroll.
        const sticky = stage.querySelector<HTMLElement>("[data-approach-sticky]");
        const drop = stage.querySelector<HTMLElement>("[data-drop]");
        const pool = stage.querySelector<HTMLElement>("[data-pool]");
        const rings = all(stage, "[data-ripple]");
        if (sticky && drop && pool) {
          const w = sticky.clientWidth;
          const h = sticky.clientHeight;
          // Quota d'impatto nel palco: a fine caduta il palco sta a 36svh dall'alto, la goccia tocca al 75%.
          const landY = h * 0.39;
          const swell = { p: 0 };
          const fall = { p: 0 };
          const hit = { p: 0 };
          let live = { x: w * 0.7, y: -h * 0.4 };
          // Punto di distacco: finché la goccia è sulla pallina la segue, poi cade dritta da lì.
          let detach: { x: number; y: number } | null = null;

          const render = () => {
            const rect = stage.getBoundingClientRect();
            const point = engineDrop.source?.dropPoint() ?? null;
            engineDrop.source?.releaseDot(swell.p > 0);
            if (point) live = { x: point.x - rect.left, y: point.y - rect.top };
            if (fall.p === 0) detach = null;
            else if (!detach) detach = live;
            const from = detach ?? live;
            const x = from.x;
            const y = from.y + (landY - from.y) * fall.p * fall.p;

            // Goccia: si gonfia sulla pallina, si allunga cadendo, si schiaccia e sparisce all'impatto.
            const squash = Math.min(1, hit.p / 0.08);
            const sx = hit.p > 0 ? 1 + 1.6 * squash : 0.6 + 0.4 * swell.p - 0.2 * fall.p;
            const sy = hit.p > 0 ? 1.3 - 1.05 * squash : 0.6 + 0.4 * swell.p + 0.3 * fall.p;
            drop.style.opacity = swell.p > 0 ? String(1 - squash) : "0";
            drop.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${sx}, ${sy})`;

            // Pozza e onde: si aprono dal punto d'impatto, nel palco.
            const reach = Math.hypot(Math.max(x, w - x), Math.max(landY, h - landY));
            const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
            pool.style.clipPath = `circle(${reach * easeOut(hit.p)}px at ${x}px ${landY}px)`;
            rings.forEach((ring, i) => {
              const q = Math.min(1, Math.max(0, (hit.p - i * 0.12) / (0.65 + i * 0.15)));
              ring.style.width = ring.style.height = `${reach * 2}px`;
              ring.style.opacity = q > 0 && q < 1 ? String(1 - q) : "0";
              ring.style.transform = `translate(${x}px, ${landY}px) translate(-50%, -50%) scale(${easeOut(q) * (0.75 + i * 0.25)})`;
            });
          };

          tl.to(swell, { p: 1, duration: 6, onUpdate: render }, 20);
          tl.to(fall, { p: 1, duration: 38, onUpdate: render }, 26);
          tl.to(hit, { p: 1, duration: 40, onUpdate: render }, 64);
        }

        tl.fromTo(all(stage, "[data-approach-eyebrow]"), { opacity: 0 }, { opacity: 1, duration: 10 }, 95);
        tl.fromTo(all(stage, "[data-level-ticks]"), { opacity: 0 }, { opacity: 1, duration: 10 }, 125);
        tl.fromTo(
          all(stage, "[data-approach-title] .gs-line"),
          { yPercent: 110 },
          { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" },
          99,
        );

        // Camera: vista d'insieme, poi una terrazza alla volta.
        const proxy = { v: 0 };
        const push = () => {
          sceneState = proxy.v;
          scene?.setState(sceneState);
        };
        tl.to(proxy, { v: 1, duration: 50, onUpdate: push }, 140);
        // Il velo serve solo con il testo dei livelli: nella vista d'insieme la scalinata resta piena.
        tl.fromTo(all(stage, "[data-approach-veil]"), { opacity: 0 }, { opacity: 1, duration: 30 }, 150);
        tl.to(proxy, { v: 2, duration: 40, onUpdate: push }, 240);
        tl.to(proxy, { v: 3, duration: 40, onUpdate: push }, 330);
        tl.to(proxy, { v: 4, duration: 40, onUpdate: push }, 420);
        // In uscita il tono torna al bianco della pagina: nessuno stacco con la sezione dopo.
        tl.fromTo(
          all(stage, "[data-pool]"),
          { "--pool": css.getPropertyValue("--bg-sunken").trim() },
          { "--pool": css.getPropertyValue("--bg").trim(), duration: 22 },
          STAGE - 22,
        );

        const enter = [170, 260, 350, 440];
        const leave = [238, 328, 418];
        levels.forEach((level, i) => {
          tl.fromTo(level.lines, { yPercent: 110 }, { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" }, enter[i]);
          // autoAlpha nasconde anche al puntatore: i link dei livelli non attivi non si cliccano.
          tl.fromTo(
            level.meta,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 14, stagger: 4, ease: "power2.out" },
            enter[i] + 6,
          );
          tl.fromTo(ticks[i], { backgroundColor: line, scaleX: 1 }, { backgroundColor: ink, scaleX: 2, duration: 8 }, enter[i]);
          if (leave[i] !== undefined) {
            tl.to(level.lines, { yPercent: -110, duration: 14, stagger: 3, ease: "power3.in" }, leave[i]);
            tl.to(level.meta, { autoAlpha: 0, y: -16, duration: 10, ease: "power2.in" }, leave[i]);
            tl.to(ticks[i], { backgroundColor: line, scaleX: 1, duration: 8 }, leave[i] + 6);
          }
        });

        tl.set({}, {}, STAGE);
        return tl;
      },
    });

    return () => {
      disposed = true;
      split.revert();
      observer?.disconnect();
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={stageRef} className="relative h-[520svh] bg-bg motion-reduce:h-auto">
      <div
        data-approach-sticky
        className="sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible"
      >
        {/* La pozza: il tono della sezione si apre dal punto in cui cade la goccia e porta con sé la scena. */}
        <div
          data-pool
          style={{ "--pool": "var(--bg-sunken)" } as CSSProperties}
          className="absolute inset-0 bg-(--pool) [clip-path:circle(0px_at_0px_0px)] motion-reduce:hidden"
        >
          <div ref={sceneRef} aria-hidden className="absolute inset-0" />
          {/* Velo a sinistra: le terrazze precedenti scendono sotto il testo e non devono disturbarne la lettura. */}
          <div
            data-approach-veil
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] opacity-0 bg-linear-to-r from-(--pool) from-30% via-(--pool)/80 to-transparent lg:block"
          />
        </div>
        {[0, 1].map((i) => (
          <span
            key={i}
            data-ripple
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-40 block rounded-full border border-ink/25 opacity-0 motion-reduce:hidden"
          />
        ))}
        <Container className="relative flex h-full flex-col pt-[calc(var(--header-h)+4svh)] pb-[9svh] motion-reduce:py-24">
          <p data-approach-eyebrow className="font-mono text-[13px] text-muted">
            04 — Our companies
          </p>
          <h2 data-approach-title className="display mt-6 max-w-xl text-[clamp(36px,4.6vw,72px)] leading-[0.98]">
            {approach.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <div className="mt-auto flex max-w-lg gap-6 motion-reduce:mt-16">
            {/* Indicatore dei livelli: dal basso verso l'alto, come le terrazze. */}
            <div data-level-ticks aria-hidden className="flex flex-col-reverse gap-2 pt-1.5 motion-reduce:hidden">
              {approach.levels.map((level) => (
                <span key={level.company} data-level-tick className="block h-px w-5 origin-left bg-line-strong" />
              ))}
            </div>
            <div className="grid flex-1 motion-reduce:gap-16">
              {approach.levels.map((level, index) => (
                <article key={level.company} data-level className="[grid-area:1/1] motion-reduce:[grid-area:auto]">
                  <p data-level-meta className="font-mono text-[13px] text-muted">
                    0{index + 1} / 0{approach.levels.length} — {level.scale}
                  </p>
                  <h3 data-level-title className="display mt-4 text-[clamp(30px,3.4vw,52px)] leading-none">
                    {level.title}
                  </h3>
                  <p data-level-meta className="mt-4 max-w-md text-[17px] text-muted">
                    {level.body}
                  </p>
                  <Link data-level-meta href={level.href} className="mt-5 inline-block font-mono text-[13px]">
                    {level.company} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </div>
      {/* Fuori dal palco: nasce sull'anello del motore, sopra il bordo della sezione, dove il palco taglierebbe. */}
      <span
        data-drop
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-40 block size-3.5 rounded-full bg-ink opacity-0 motion-reduce:hidden"
      />
    </section>
  );
}
