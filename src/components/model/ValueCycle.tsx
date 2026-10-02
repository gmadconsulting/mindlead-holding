"use client";

import { useEffect, useRef } from "react";
import { model } from "@/content/it";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";

function draw(path: SVGPathElement, steps: HTMLElement[], progress: number) {
  const length = path.getTotalLength() || 1;
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length * (1 - progress)}`;
  const index = Math.min(steps.length - 1, Math.floor(Math.min(progress, 0.999) * steps.length));
  steps.forEach((step, stepIndex) => {
    const on = stepIndex === index;
    step.classList.toggle("is-dim", !on);
    step.classList.toggle("is-active", on);
  });
}

/**
 * Quattro passaggi collegati da una linea che si disegna con lo scroll.
 * Desktop: sezione pinnata. Mobile: timeline verticale, senza pin.
 */
export function ValueCycle() {
  const rootRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<SVGPathElement>(null);
  const verticalRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    if (reduce) return;

    registerGsap();
    root.classList.add("is-animated");
    steps.forEach((step) => step.classList.add("is-dim"));

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const path = horizontalRef.current;
      if (!path) return;
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "+=160%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => draw(path, steps, self.progress),
      });
    });

    mm.add("(max-width: 1023px)", () => {
      const path = verticalRef.current;
      if (!path) return;
      ScrollTrigger.create({
        trigger: root,
        start: "top 75%",
        end: "bottom 60%",
        scrub: true,
        onUpdate: (self) => draw(path, steps, self.progress),
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative lg:flex lg:min-h-[100svh] lg:items-center">
      <div className="relative w-full">
        <svg
          className="pointer-events-none absolute bottom-0 left-[5px] top-2 w-px text-ink lg:hidden"
          viewBox="0 0 2 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M1 0 V100" fill="none" stroke="var(--line)" strokeWidth="2" />
          <path ref={verticalRef} d="M1 0 V100" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg
          className="pointer-events-none absolute left-0 right-0 top-[5px] hidden h-px w-full text-ink lg:block"
          viewBox="0 0 1000 2"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 1 H1000" fill="none" stroke="var(--line)" strokeWidth="2" />
          <path ref={horizontalRef} d="M0 1 H1000" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
          {model.cycle.map((step, index) => (
            <li key={step.title} data-step className="step relative pl-8 lg:pl-0 lg:pt-10">
              <span className="absolute top-1 left-0 size-3.5 rounded-full border border-current bg-bg lg:top-0" />
              <p className="step-title font-mono text-[12px]">0{index + 1}</p>
              <h3 className="step-title display mt-3 text-[clamp(26px,2.4vw,34px)]">{step.title}</h3>
              <p className="mt-3 text-[16px] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
