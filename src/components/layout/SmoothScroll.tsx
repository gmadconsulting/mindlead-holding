"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Smooth scroll con Lenis, agganciato al ticker di GSAP.
 * Con prefers-reduced-motion non parte: resta lo scroll nativo.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    registerGsap();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      lerp: 0.28,
      wheelMultiplier: 1.15,
      touchMultiplier: 1.1,
      smoothWheel: true,
      anchors: true,
      stopInertiaOnNavigate: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onLock = (event: Event) => {
      const locked = (event as CustomEvent<boolean>).detail;
      if (locked) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("mindlead:lock-scroll", onLock);

    return () => {
      window.removeEventListener("mindlead:lock-scroll", onLock);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    registerGsap();
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return children;
}
