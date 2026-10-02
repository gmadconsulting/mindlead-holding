"use client";

import { useEffect, useRef } from "react";
import { core } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Il foglio nero sale sopra le card.
 * Poi resta alto abbastanza da leggerlo, senza essere coperto subito.
 */
export function CoreSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    registerGsap();
    const previous = root.previousElementSibling as HTMLElement | null;
    const created: ScrollTrigger[] = [];

    const layers = root.querySelectorAll<HTMLElement>("[data-layer]");
    const layerTween = gsap.fromTo(
      layers,
      { y: 0 },
      {
        y: (index) => (layers.length - 1 - index) * -16,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 70%",
          end: "center center",
          scrub: true,
        },
      },
    );
    if (layerTween.scrollTrigger) created.push(layerTween.scrollTrigger);

    if (previous) {
      created.push(
        ScrollTrigger.create({
          trigger: previous,
          start: "bottom bottom",
          end: "+=52%",
          pin: previous,
          pinSpacing: false,
          anticipatePin: 1,
        }),
      );
    }

    return () => {
      layerTween.kill();
      created.forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative z-20 -mt-10 overflow-hidden rounded-t-[40px] bg-ink-bg text-ink-text shadow-[0_-24px_50px_-20px_rgba(0,0,0,0.45)]"
    >
      <div className="dot-grid-light pointer-events-none absolute inset-0" />
      <Container className="pt-32 pb-16 md:pt-44 md:pb-24">
        <div className="grid w-full items-center gap-20 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow index="05" label="Mindlead Core" className="text-ink-text/70" />
            <MaskReveal
              as="h2"
              lines={core.title}
              className="display text-[clamp(40px,5vw,72px)] text-ink-text"
            />
            <p className="mt-6 text-[17px] text-ink-text/75">{core.body}</p>
            <p className="mt-4 text-[17px] text-ink-text/75">{core.note}</p>
          </div>
          <div className="relative mx-auto w-full max-w-md" style={{ perspective: "1200px" }}>
            {core.layers.map((layer) => (
              <div key={layer.label} data-layer className="mb-5">
                <div
                  className="rounded-[12px] border border-ink-line bg-ink px-5 py-6"
                  style={{ transform: "rotateX(8deg)" }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-mono text-[12px] text-ink-text/60">{layer.note}</p>
                  </div>
                  <p className="mt-2 text-[20px]">{layer.label}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-ink-line px-3 py-1 font-mono text-[11px] text-ink-text/80"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
      <div aria-hidden className="h-[18svh]" />
    </section>
  );
}
