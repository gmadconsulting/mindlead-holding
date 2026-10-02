"use client";

import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { intelligence } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { gsap, registerGsap } from "@/lib/gsap";
import { AiOrb, ORB } from "@/components/home/AiOrb";
import { smallViewportHeight } from "@/lib/viewport";

/**
 * Tempi in svh di scroll. LEAD: la sezione sale sopra gli ultimi 100svh di "Platform" (margine negativo), invisibile:
 * lì la sfera nasce dalla fusione degli strati. Quando arriva in cima la sostituisce nello stesso punto, senza stacco.
 * STAGE: il racconto. La somma deve coincidere con h-[660svh].
 */
const LEAD = 100;
const STAGE = 560;

/** Campo attorno alla sfera: lato in multipli del diametro, raggi in % del lato (sorgenti, aziende, azioni). */
const FIELD = 2.6;
const R_ORB = 50 / FIELD + 0.6;
const R_SRC = 33;
const R_CO = 46;
const R_ACT = 37;
const SRC_ANGLES = [-90, -18, 54, 126, 198];
const CO_ANGLES = [-45, 45, 135, 225];
const ACT_ANGLES = [-32, 72, 196];

const pad = (n: number) => String(n).padStart(2, "0");
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
};
const at = (r: number, deg: number) => {
  const p = polar(r, deg);
  return { left: `${50 + p.x}%`, top: `${50 + p.y}%` };
};

/**
 * "Intelligence": l'AI come secondo cervello dell'azienda. La sfera nata dalla fusione degli strati di Platform
 * prima si presenta (missione), poi in tre passi si collega ai dati, lavora accanto alle persone e impara
 * da tutte le aziende del gruppo. In chiusura il perché: solo un gruppo organizzato così può costruirla.
 */
export function AiStage() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsap();
    gsap.registerPlugin(SplitText);

    const sticky = stage.querySelector<HTMLElement>("[data-ai-sticky]");
    if (!sticky) return;

    const titles = Array.from(stage.querySelectorAll<HTMLElement>("[data-ai-title], [data-ai-step-title], [data-ai-adv-title]"));
    const split = SplitText.create(titles, {
      type: "lines",
      mask: "lines",
      linesClass: "gs-line",
      autoSplit: true,
      // Ricreata a ogni nuova divisione (resize, font caricati): righe e misure cambiano.
      onSplit: () => {
        const all = (sel: string, root: ParentNode = stage) => Array.from(root.querySelectorAll<HTMLElement>(sel));
        const one = (sel: string) => stage.querySelector<HTMLElement>(sel);
        const azure = "#5aa9f0";
        const faint = "rgba(14,14,13,0.14)";
        const w = sticky.clientWidth;
        // Le pose si misurano sullo schermo a barre aperte: il palco è più alto solo per coprire il fondo.
        const h = smallViewportHeight();
        const desktop = w >= 1024;

        const root = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom bottom", scrub: true },
        });
        // Il palco compare solo quando è in cima: prima la sfera è quella di Platform, identica e nello stesso punto.
        root.set(sticky, { visibility: "visible" }, LEAD);
        const tl = gsap.timeline({ defaults: { ease: "none" } });

        const field = one("[data-ai-field]");
        const orb = one("[data-ai-orb]");
        const halo = all("[data-orb-halo]");

        // Missione: il titolo nasce sopra la sfera, che si gonfia appena.
        tl.fromTo(all("[data-ai-eyebrow]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 10 }, 6);
        tl.fromTo(all("[data-ai-title] .gs-line"), { yPercent: 110 }, { yPercent: 0, duration: 20, stagger: 6, ease: "power3.out" }, 8);
        tl.fromTo(all("[data-ai-mission]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 14, ease: "power2.out" }, 24);
        tl.fromTo(orb, { scale: 1 }, { scale: 1.12, duration: 50, ease: "power1.inOut" }, 10);
        tl.to(all("[data-ai-title] .gs-line"), { yPercent: -110, duration: 14, stagger: 3, ease: "power3.in" }, 74);
        tl.to(all("[data-ai-eyebrow], [data-ai-mission]"), { autoAlpha: 0, y: -14, duration: 12, ease: "power2.in" }, 74);

        // Passi: la sfera si sposta a destra (sopra su schermi stretti), il testo a sinistra come in Platform.
        // Su mobile la scala è limitata dalla larghezza: card e pillole più sporgenti restano dentro lo schermo.
        const reach = field
          ? Math.max(
              ...all("[data-ai-act], [data-ai-src], [data-ai-co]", field).map(
                (el) => Math.abs((el.parentElement?.offsetLeft ?? 0) - field.offsetWidth / 2) + el.offsetWidth / 2,
              ),
            )
          : 0;
        const stepPose = desktop
          ? { x: w * 0.2, y: h * 0.02, scale: 0.86 }
          : { x: 0, y: -h * 0.08, scale: Math.min(0.88, (w / 2 - 10) / (reach || 1)) };
        tl.fromTo(field, { x: 0, y: 0, scale: 1 }, { ...stepPose, duration: 34, ease: "power3.inOut" }, 86);
        tl.to(orb, { scale: 1, duration: 34, ease: "power3.inOut" }, 86);
        tl.fromTo(all("[data-ai-tag], [data-ai-pager]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 12, ease: "power2.out" }, 98);

        const enter = [104, 194, 284];
        const count = enter.length;
        const digits = one("[data-ai-digits]");
        enter.forEach((t, i) => {
          if (i > 0) tl.to(digits, { yPercent: -(100 / count) * i, duration: 12, ease: "power3.inOut" }, t - 6);
        });
        all("[data-ai-seg]").forEach((seg, i) => {
          tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: (enter[i + 1] ?? 364) - enter[i] }, enter[i]);
        });
        all("[data-ai-step]").forEach((step, i) => {
          const lines = all(".gs-line", step);
          const meta = all("[data-ai-step-meta]", step);
          tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" }, enter[i]);
          tl.fromTo(
            meta,
            { autoAlpha: 0, y: 18, filter: "blur(6px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 14, stagger: 4, ease: "power2.out" },
            enter[i] + 4,
          );
          const next = enter[i + 1] ?? 370;
          tl.to(lines, { yPercent: -110, duration: 12, stagger: 3, ease: "power3.in" }, next - 10);
          tl.to(meta, { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: 10, ease: "power2.in" }, next - 10);
        });

        // 1 Contesto: i dati dell'azienda si collegano alla sfera, le linee si accendono d'azzurro.
        const srcLines = all("[data-ai-src-line]");
        const srcs = all("[data-ai-src]");
        tl.fromTo(srcLines, { strokeDashoffset: 1, stroke: faint }, { strokeDashoffset: 0, duration: 16, stagger: 3 }, enter[0] + 2);
        tl.fromTo(srcs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 12, stagger: 3, ease: "back.out(2)" }, enter[0] + 8);
        tl.to(srcLines, { stroke: azure, duration: 6, stagger: 2 }, enter[0] + 30);
        tl.to(halo, { scale: 1.12, duration: 10, ease: "power2.out" }, enter[0] + 34);
        tl.to(halo, { scale: 1, duration: 14, ease: "power2.inOut" }, enter[0] + 46);

        // 2 Collaborazione: i dati restano sullo sfondo, la sfera propone azioni concrete, una dopo l'altra.
        const acts = all("[data-ai-act]");
        tl.to(srcs, { opacity: 0.35, duration: 10 }, enter[1]);
        tl.to(srcLines, { stroke: faint, duration: 10 }, enter[1]);
        tl.fromTo(acts, { autoAlpha: 0, y: 18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 14, stagger: 12, ease: "power3.out" }, enter[1] + 6);
        acts.forEach((_, i) => {
          tl.to(halo, { scale: 1.1, duration: 5, ease: "power2.out" }, enter[1] + 4 + i * 12);
          tl.to(halo, { scale: 1, duration: 8, ease: "power2.inOut" }, enter[1] + 9 + i * 12);
        });

        // 3 Apprendimento: attorno compaiono le aziende del gruppo; ognuna manda quello che impara alla sfera,
        // che lo restituisce a tutti: i dati di ogni azienda si riaccendono.
        const coLines = all("[data-ai-co-line]");
        const pulses = all("[data-ai-pulse]");
        tl.to(acts, { autoAlpha: 0, y: -12, duration: 10, ease: "power2.in" }, enter[2] - 6);
        tl.fromTo(all("[data-ai-ring]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 26, ease: "power2.inOut" }, enter[2]);
        tl.fromTo(coLines, { strokeDashoffset: 1, stroke: faint }, { strokeDashoffset: 0, duration: 14, stagger: 3 }, enter[2] + 8);
        tl.fromTo(all("[data-ai-co]"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 12, stagger: 4, ease: "back.out(2)" }, enter[2] + 10);
        pulses.forEach((pulse, i) => {
          const from = at(R_CO, CO_ANGLES[i]);
          const to = at(R_ORB, CO_ANGLES[i]);
          tl.fromTo(pulse, { ...from, autoAlpha: 0 }, { autoAlpha: 1, duration: 3 }, enter[2] + 30 + i * 4);
          tl.fromTo(pulse, from, { ...to, duration: 16, ease: "power2.in" }, enter[2] + 30 + i * 4);
          tl.to(pulse, { autoAlpha: 0, duration: 3 }, enter[2] + 44 + i * 4);
        });
        tl.to(coLines, { stroke: azure, duration: 6, stagger: 4 }, enter[2] + 30);
        tl.to(halo, { scale: 1.16, duration: 8, ease: "power2.out" }, enter[2] + 50);
        tl.to(halo, { scale: 1, duration: 16, ease: "power2.inOut" }, enter[2] + 60);
        tl.to(srcs, { opacity: 1, duration: 10, stagger: 2 }, enter[2] + 54);
        tl.to(srcLines, { stroke: azure, duration: 6, stagger: 2 }, enter[2] + 54);

        // Perché noi: il sistema intero si raccoglie in alto, sotto arriva la tesi del gruppo.
        tl.to(all("[data-ai-tag], [data-ai-pager]"), { autoAlpha: 0, y: -14, duration: 12, ease: "power2.in" }, 362);
        // Su mobile la tesi cambia altezza con lo schermo: il sistema si raccoglie nello spazio libero tra header e titolo.
        let endPose = { x: 0, y: -h * 0.15, scale: 0.6 };
        const advTitle = one("[data-ai-adv-title]");
        if (!desktop && field && advTitle) {
          const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
          const top = header + 4;
          const bottom = advTitle.getBoundingClientRect().top - sticky.getBoundingClientRect().top - 18;
          endPose = { x: 0, y: (top + bottom) / 2 - h / 2, scale: Math.min(0.5, (bottom - top) / field.offsetWidth) };
        }
        tl.to(field, { ...endPose, duration: 38, ease: "power3.inOut" }, 372);
        tl.fromTo(all("[data-ai-adv-title] .gs-line"), { yPercent: 110 }, { yPercent: 0, duration: 18, stagger: 5, ease: "power3.out" }, 398);
        tl.fromTo(all("[data-ai-adv-meta]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 14, stagger: 5, ease: "power2.out" }, 408);

        tl.set({}, {}, STAGE);
        root.add(tl, LEAD);
        return root;
      },
    });

    return () => {
      split.revert();
    };
  }, []);

  const { steps, advantage } = intelligence;

  return (
    <section
      ref={stageRef}
      className="relative -mt-[100lvh] h-[660svh] motion-reduce:mt-0 motion-reduce:h-auto motion-reduce:bg-bg"
    >
      {/* Palco alto 100lvh: copre lo schermo anche a barre del browser chiuse; sfera e testi restano in 100svh. */}
      <div
        data-ai-sticky
        className="invisible sticky top-0 h-lvh overflow-hidden bg-bg motion-reduce:visible motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-svh"
      >
        {/* Campo della sfera: centrato nel palco, come la sfera di Platform. Linee in % del lato. */}
        <div
          data-ai-field
          aria-hidden
          className="absolute top-[50svh] left-1/2 motion-reduce:hidden"
          style={{
            width: `calc(${ORB} * ${FIELD})`,
            height: `calc(${ORB} * ${FIELD})`,
            marginLeft: `calc(${ORB} * ${-FIELD / 2})`,
            marginTop: `calc(${ORB} * ${-FIELD / 2})`,
          }}
        >
          {/* Spessore in unità del viewBox (circa 1px): con non-scaling-stroke il tratteggio di pathLength non torna. */}
          <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full overflow-visible" fill="none" strokeWidth={0.12}>
            <circle
              data-ai-ring
              r={R_CO}
              pathLength={1}
              stroke="rgba(14,14,13,0.12)"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
            {SRC_ANGLES.map((deg) => {
              const a = polar(R_SRC, deg);
              const b = polar(R_ORB, deg);
              return (
                <line
                  key={deg}
                  data-ai-src-line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              );
            })}
            {CO_ANGLES.map((deg) => {
              const a = polar(R_CO, deg);
              const b = polar(R_ORB, deg);
              return (
                <line
                  key={deg}
                  data-ai-co-line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div data-ai-orb>
              <AiOrb />
            </div>
          </div>

          {/* Dati dell'azienda, letti attraverso Core. */}
          {intelligence.sources.map((source, i) => (
            <span key={source} className="absolute -translate-x-1/2 -translate-y-1/2" style={at(R_SRC, SRC_ANGLES[i])}>
              <span
                data-ai-src
                className="invisible flex items-center gap-1.5 rounded-full border border-line-strong bg-bg-elevated px-2.5 py-[5px] font-mono text-[10.5px] leading-none tracking-[0.08em] whitespace-nowrap uppercase opacity-0 lg:gap-2 lg:px-3.5 lg:py-2 lg:text-[12px] lg:leading-normal"
              >
                <span className="size-1.5 rounded-full bg-[#5aa9f0]" />
                {source}
              </span>
            </span>
          ))}

          {/* Aziende del gruppo, sull'anello esterno. */}
          {intelligence.companies.map((company, i) => (
            <span key={company} className="absolute -translate-x-1/2 -translate-y-1/2" style={at(R_CO, CO_ANGLES[i])}>
              <span
                data-ai-co
                className="invisible block rounded-full bg-ink-bg px-3 py-[5px] font-mono text-[10.5px] leading-none tracking-[0.08em] whitespace-nowrap text-ink-text uppercase opacity-0 lg:px-4 lg:py-2 lg:text-[12px] lg:leading-normal"
              >
                {company}
              </span>
            </span>
          ))}

          {/* Impulsi: quello che ogni azienda impara viaggia verso la sfera. */}
          {CO_ANGLES.map((deg) => (
            <span
              key={deg}
              data-ai-pulse
              className="invisible absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5aa9f0] opacity-0 shadow-[0_0_14px_4px_rgba(90,169,240,0.6)]"
              style={at(R_CO, deg)}
            />
          ))}

          {/* Azioni proposte dalla sfera nelle applicazioni di ogni giorno. */}
          {intelligence.actions.map((action, i) => (
            <span key={action.tag} className="absolute -translate-x-1/2 -translate-y-1/2" style={at(R_ACT, ACT_ANGLES[i])}>
              <span
                data-ai-act
                className="invisible block w-[160px] rounded-xl border border-line bg-bg-elevated/85 p-3 opacity-0 shadow-[0_18px_40px_-24px_rgba(40,90,150,0.45)] backdrop-blur-md lg:w-[250px] lg:p-4"
              >
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                  <span className="size-1.5 rounded-full bg-[#5aa9f0] shadow-[0_0_8px_2px_rgba(90,169,240,0.5)]" />
                  AI · {action.tag}
                </span>
                <span className="mt-2 block text-[13px] leading-snug text-text lg:text-[15px]">{action.text}</span>
              </span>
            </span>
          ))}
        </div>

        {/* Missione: sopra la sfera, al centro. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-svh flex-col items-center justify-center px-6 text-center motion-reduce:static motion-reduce:h-auto motion-reduce:pt-32">
          <p data-ai-eyebrow className="font-mono text-[13px] text-muted">
            06 — Intelligence
          </p>
          <h2 data-ai-title className="display mt-6 text-[clamp(44px,6.4vw,104px)] leading-[0.95]">
            {intelligence.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(8svh+100lvh-100svh)] z-30 px-6 motion-reduce:static motion-reduce:mt-10">
          <p data-ai-mission className="mx-auto max-w-xl text-center text-[17px] text-muted">
            {intelligence.mission}
          </p>
        </div>

        {/* Passi: in alto l'etichetta della sezione, in basso a sinistra contatore e testo, come in Platform. */}
        <Container className="flex h-svh flex-col pt-[calc(var(--header-h)+4svh)] pb-[7svh] motion-reduce:h-auto motion-reduce:py-24">
          <p data-ai-tag className="font-mono text-[13px] text-muted">
            06 — Intelligence
          </p>
          <div className="mt-auto max-w-md">
            <div data-ai-pager className="flex items-center gap-4 font-mono text-[13px]">
              <span className="relative block h-[1.3em] overflow-hidden leading-[1.3em]">
                <span data-ai-digits className="block">
                  {steps.map((step, i) => (
                    <span key={step.label} className="block">
                      {pad(i + 1)}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-faint">/ {pad(steps.length)}</span>
              <span className="flex w-full max-w-[200px] gap-1.5">
                {steps.map((step) => (
                  <span key={step.label} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                    <span data-ai-seg className="absolute inset-0 origin-left scale-x-0 bg-ink motion-reduce:scale-x-100" />
                  </span>
                ))}
              </span>
            </div>
            <div className="mt-8 grid motion-reduce:gap-12">
              {steps.map((step) => (
                <article key={step.title} data-ai-step className="[grid-area:1/1] motion-reduce:[grid-area:auto]">
                  <p data-ai-step-meta className="font-mono text-[12px] tracking-[0.08em] text-muted uppercase">
                    {step.label}
                  </p>
                  <h3 data-ai-step-title className="display mt-4 text-[clamp(26px,2.8vw,44px)] leading-none">
                    {step.title}
                  </h3>
                  <p data-ai-step-meta className="mt-4 text-[16px] text-muted">
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Container>

        {/* Perché noi: la tesi del gruppo sotto il sistema raccolto in alto. */}
        <div className="absolute inset-x-0 bottom-[calc(7svh+100lvh-100svh)] z-30 motion-reduce:static">
          {/* Su mobile più compatta: sopra deve restare spazio per il sistema raccolto. */}
          <Container className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-10">
            <div>
              <h2 data-ai-adv-title className="display text-[clamp(32px,4vw,64px)] leading-[0.98]">
                {advantage.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p data-ai-adv-meta className="mt-3 max-w-md text-[15px] text-muted lg:mt-5 lg:text-[16px]">
                {advantage.body}
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3 sm:gap-8">
              {advantage.points.map((point) => (
                <li key={point.label} data-ai-adv-meta className="border-t border-line-strong pt-3 lg:pt-4">
                  <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.08em] uppercase">
                    <span className="size-1.5 rounded-full bg-[#5aa9f0]" />
                    {point.label}
                  </p>
                  <p className="mt-2 text-[14px] leading-snug text-muted lg:mt-3 lg:text-[15px]">{point.text}</p>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </div>
    </section>
  );
}
