"use client";

import { useEffect, useRef } from "react";
import { registerGsap, ScrollTrigger } from "@/lib/gsap";
import type { CircuitScene } from "./circuit-scene";

/**
 * Contenitore della scena 3D dell'hero. three.js si carica solo nel browser,
 * dopo il primo render, così non pesa sull'apertura della pagina.
 */
export function CircuitField({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    registerGsap();
    const stage = root.closest<HTMLElement>("[data-hero-stage]") ?? root;
    let disposed = false;
    let scene: CircuitScene | null = null;
    let trigger: ScrollTrigger | null = null;
    let observer: IntersectionObserver | null = null;

    import("./circuit-scene").then(async ({ createCircuitScene }) => {
      if (disposed) return;
      const created = await createCircuitScene(root);
      if (disposed) {
        created.dispose();
        return;
      }
      scene = created;
      trigger = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => created.setProgress(self.progress),
      });
      created.setProgress(trigger.progress);
      observer = new IntersectionObserver(([entry]) => created.setActive(entry.isIntersecting));
      observer.observe(stage);
    });

    return () => {
      disposed = true;
      trigger?.kill();
      observer?.disconnect();
      scene?.dispose();
    };
  }, []);

  return <div ref={rootRef} className={`cb-scene pointer-events-none ${className}`} aria-hidden />;
}
