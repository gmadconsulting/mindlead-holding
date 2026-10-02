"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { hero } from "@/content/it";
import { gsap, registerGsap } from "@/lib/gsap";
import { CircuitField } from "@/components/graphics/CircuitField";
import { MagneticButton } from "@/components/motion/MagneticButton";

/**
 * L'hero resta fissa per tutto il tratto della scena 3D.
 * Titolo e foto se ne vanno per primi, poi la scena porta alla pagina bianca.
 */
export function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = copyRef.current?.querySelectorAll("[data-line]");

    if (!reduce && lines?.length) {
      gsap.fromTo(
        lines,
        { yPercent: 105 },
        { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power4.out", delay: 0.1 },
      );
    }

    const stage = stageRef.current;
    const backdrop = backdropRef.current;
    const photo = photoRef.current;
    const copy = copyRef.current;
    if (reduce || !stage || !backdrop || !photo || !copy) return;

    registerGsap();
    const ctx = gsap.context(() => {
      // Il testo resta leggibile all'inizio, poi lascia spazio alla scena.
      // Su mobile il titolo copre quasi tutto lo schermo: deve sparire prima che la scena compaia.
      gsap.to(copy, {
        opacity: 0,
        y: -32,
        ease: "power1.in",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * (window.matchMedia("(min-width: 1024px)").matches ? 0.3 : 0.12)}`,
          scrub: true,
        },
      });
      // La foto si dissolve: la scheda trasparente resta su fondo chiaro.
      gsap.to(photo, {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.45}`,
          scrub: true,
        },
      });
      gsap.to(backdrop, {
        opacity: 0,
        ease: "power1.in",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.45}`,
          scrub: true,
        },
      });
    }, stage);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={stageRef} data-hero-stage className="relative h-[300svh] motion-reduce:h-[100svh]">
      {/* Palco alto 100lvh: il fondo copre lo schermo anche a barre del browser chiuse; il testo resta in 100svh. */}
      <div className="sticky top-0 h-lvh">
        <div className="relative h-full overflow-hidden bg-bg">
          <div ref={backdropRef} className="absolute inset-0">
            <div ref={photoRef} className="absolute inset-0 origin-center scale-[1.08]">
              <Image
                src="/images/hero.jpg"
                alt="Glass and steel structure, seen from below"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="hero-shade absolute inset-0" />
            <div className="dot-grid absolute inset-0" />
          </div>
          <CircuitField className="absolute inset-0 z-20" />

          <div
            ref={copyRef}
            className="relative z-30 mx-auto flex h-svh max-w-[1280px] flex-col px-6 pt-[calc(var(--header-h)+24px)] pb-[8svh] md:px-10 md:pb-[9svh]"
          >
            {/* Titolo grande, poi testo e azioni su una riga: nella parte bassa, non sul bordo.
                Su telefoni bassi lo spazio sopra si riduce: le azioni devono restare dentro lo schermo. */}
            <div className="my-auto pt-[clamp(0px,calc(100svh-640px),8svh)] md:pt-[8svh]">
              <h1 className="display text-[clamp(52px,9.4vw,148px)] leading-[0.92]">
                {hero.title.map((line) => (
                  <span key={line} className="block overflow-hidden pb-[0.06em]">
                    <span data-line className="block">
                      {line}
                    </span>
                  </span>
                ))}
              </h1>
              <div className="mt-8 grid gap-6 border-t border-line-strong/70 pt-6 md:mt-10 lg:grid-cols-12 lg:items-end">
                <p className="max-w-lg text-[16px] text-muted md:text-[17px] lg:col-span-6">{hero.body}</p>
                <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
                  <MagneticButton href="/aziende">{hero.primary}</MagneticButton>
                  <MagneticButton href="/partnership">{hero.secondary}</MagneticButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
