"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";

type Props = {
  href: string;
  children: string;
  onInk?: boolean;
};

/**
 * Pill con riempimento dal basso e freccia che esce e rientra.
 * Su puntatore fine si sposta di pochi pixel verso il cursore.
 */
export function MagneticButton({ href, children, onInk = false }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const external = href.startsWith("mailto:") || href.startsWith("http");

  const onMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const pull = 0.15;
    el.style.transform = `translate(${Math.max(-6, Math.min(6, x * pull))}px, ${Math.max(-4, Math.min(4, y * pull))}px)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  const className = `btn ${onInk ? "btn-on-ink" : ""}`;
  const inner = (
    <>
      <span className="fill" aria-hidden />
      <span>{children}</span>
      <span className="arrows" aria-hidden>
        <span>→</span>
        <span>→</span>
      </span>
    </>
  );

  if (external) {
    return (
      <a ref={ref} href={href} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
        {inner}
      </a>
    );
  }

  return (
    <Link ref={ref} href={href} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      {inner}
    </Link>
  );
}
