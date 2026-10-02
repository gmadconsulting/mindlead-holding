"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

/**
 * Ogni parola passa da spento a pieno man mano che si scorre.
 * Non è un timer: è legato alla posizione di scroll.
 */
export function ScrollHighlight({
  text,
  className = "",
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h2";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = el.querySelectorAll<HTMLElement>("[data-word]");
    if (reduce) {
      nodes.forEach((node) => {
        node.style.color = "var(--text)";
      });
      return;
    }

    registerGsap();
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.to(nodes, {
        color: "var(--text)",
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
        },
      });
    });
    mm.add("(max-width: 1023px)", () => {
      gsap.to(nodes, {
        color: "var(--text)",
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          end: "top 40%",
          scrub: true,
        },
      });
    });

    return () => mm.revert();
  }, [text]);

  return (
    <div ref={ref}>
      <Tag className={className}>
        {words.map((word, index) => (
          <span key={`${word}-${index}`} data-word style={{ color: "var(--text-faint)" }}>
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
    </div>
  );
}
