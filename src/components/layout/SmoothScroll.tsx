"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Smooth scroll con Lenis, agganciato al ticker di GSAP.
 * Con prefers-reduced-motion non parte: resta lo scroll nativo.
 *
 * ScrollTrigger va rinfrescato quando cambiano le misure (font, immagini, toolbar
 * mobile): altrimenti le timeline scrub restano sullo stato sbagliato e i testi
 * sembrano spariti o mai partiti.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    registerGsap();

    // Al refresh del browser non ripartire a metà di una sezione pin/scrub.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Su mobile la barra URL che si apre/chiude non deve rifare refresh continui:
    // spezzano le timeline e lasciano elementi a opacity/yPercent intermedi.
    ScrollTrigger.config({ ignoreMobileResize: true });

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

    const refresh = () => ScrollTrigger.refresh();

    // Due frame: i componenti home montano i trigger nello stesso tick di Lenis.
    let boot = 0;
    boot = window.requestAnimationFrame(() => {
      boot = window.requestAnimationFrame(refresh);
    });

    void document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refresh, 150);
    };
    window.addEventListener("resize", onResize);

    const onLock = (event: Event) => {
      const locked = (event as CustomEvent<boolean>).detail;
      if (locked) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("mindlead:lock-scroll", onLock);

    return () => {
      window.cancelAnimationFrame(boot);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", onResize);
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
