"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { companies, companiesIntro, nextCompany, type Company } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";

type NodeSpec = {
  id: string;
  name: string;
  short: string;
  line: string;
  href: string;
  angle: number;
  ring: 1 | 2;
  dashed?: boolean;
  status?: string;
};

const nodes: NodeSpec[] = [
  ...companies.map((company) => ({
    id: company.id,
    name: company.name,
    short: company.short,
    line: company.line,
    href: company.href,
    angle: company.angle,
    ring: company.ring,
    status: company.status,
  })),
  {
    id: nextCompany.id,
    name: nextCompany.name,
    short: nextCompany.short,
    line: nextCompany.line,
    href: nextCompany.href,
    angle: nextCompany.angle,
    ring: 2,
    dashed: true,
  },
];

function NodeLink({
  node,
  active,
  hovered,
  onHover,
}: {
  node: NodeSpec;
  active: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <Link
      href={node.href}
      data-node
      data-active={active ? "1" : "0"}
      data-hot={hovered ? "1" : "0"}
      className="orbit-node group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={
        {
          "--a": `${node.angle}deg`,
          "--spin": node.ring === 1 ? "var(--spin1)" : "var(--spin2)",
          "--r": node.ring === 1 ? "var(--r1)" : "var(--r2)",
        } as CSSProperties
      }
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
    >
      <span data-magnet className="relative flex flex-col items-center">
        <span className="relative grid size-7 place-items-center">
          <span
            className={`absolute size-7 rounded-full border border-ink/20 transition-opacity duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          />
          <span
            className={`size-2.5 rounded-full border transition-transform duration-300 group-hover:scale-125 group-focus-visible:scale-125 ${
              node.dashed ? "border-dashed bg-transparent" : "bg-bg"
            } ${active ? "scale-125 border-ink bg-ink" : "border-line-strong"}`}
          />
        </span>
        <span
          className={`mt-1 whitespace-nowrap font-mono text-[12px] transition-colors duration-300 ${
            active || hovered ? "text-ink" : "text-faint"
          }`}
        >
          {node.short}
        </span>
        <span
          aria-hidden={!hovered}
          className={`absolute top-full z-20 mt-3 w-52 rounded-[12px] border border-line bg-bg-elevated p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity duration-200 ${
            hovered ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <span className="block text-[15px] leading-snug">{node.name}</span>
          <span className="mt-1 block text-[13px] leading-snug text-muted">{node.line}</span>
          {node.status ? <span className="mt-2 block font-mono text-[11px] text-muted">{node.status}</span> : null}
        </span>
      </span>
    </Link>
  );
}

/**
 * Orbita del gruppo. Su desktop è pinnata: prima i nodi si avvicinano,
 * poi lo scroll mette a fuoco un'azienda alla volta.
 * Su mobile resta un'orbita piccola, con la lista sotto.
 */
export function Orbit({ pinned = true }: { pinned?: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const focused = companies[active] as Company;

  useEffect(() => {
    const stage = stageRef.current;
    const pin = pinRef.current;
    if (!stage || !pin) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const nodeEls = () => Array.from(stage.querySelectorAll<HTMLElement>("[data-node]"));
    const cachedNodes = nodeEls();
    const cachedLines = Array.from(stage.querySelectorAll<SVGLineElement>("line"));
    const ring1 = stage.querySelector<SVGCircleElement>("[data-ring='1']");
    const ring2 = stage.querySelector<SVGCircleElement>("[data-ring='2']");

    let raf = 0;
    let frame = 0;
    let running = true;
    const cursor = { x: 0, y: 0, tx: 0, ty: 0, on: false };

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      frame += 1;
      if (!cursor.on && frame % 2) return;
      const stageRect = stage.getBoundingClientRect();
      if (stageRect.width > 0) {
        const style = getComputedStyle(stage);
        const r1 = parseFloat(style.getPropertyValue("--r1"));
        const r2 = parseFloat(style.getPropertyValue("--r2"));
        if (ring1 && !Number.isNaN(r1)) ring1.setAttribute("r", String(r1));
        if (ring2 && !Number.isNaN(r2)) ring2.setAttribute("r", String(r2));

        cachedNodes.forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          const x = ((rect.left + rect.width / 2 - stageRect.left) / stageRect.width) * 100;
          const y = ((rect.top + rect.height / 2 - stageRect.top) / stageRect.height) * 100;
          const line = cachedLines[index];
          if (!line) return;
          line.setAttribute("x2", x.toFixed(2));
          line.setAttribute("y2", y.toFixed(2));
          const hot = node.dataset.hot === "1" || node.dataset.active === "1";
          line.setAttribute("stroke", hot ? "#0e0e0d" : "#e7e6e3");
        });
      }

      if (fine && cursorRef.current) {
        cursor.x += (cursor.tx - cursor.x) * 0.18;
        cursor.y += (cursor.ty - cursor.y) * 0.18;
        cursorRef.current.style.opacity = cursor.on ? "1" : "0";
        cursorRef.current.style.transform = `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%)`;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    });
    io.observe(stage);
    raf = requestAnimationFrame(loop);

    const onMove = (event: PointerEvent) => {
      const stageRect = stage.getBoundingClientRect();
      cursor.tx = event.clientX - stageRect.left;
      cursor.ty = event.clientY - stageRect.top;
      cursor.on = true;
      if (reduce) return;
      nodeEls().forEach((node) => {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const inner = node.querySelector<HTMLElement>("[data-magnet]");
        if (!inner) return;
        if (dist < 160) {
          const pull = (1 - dist / 160) * 12;
          inner.style.transform = `translate(${(dx / dist) * pull}px, ${(dy / dist) * pull}px)`;
        } else {
          inner.style.transform = "";
        }
      });
    };

    const onLeave = () => {
      cursor.on = false;
      nodeEls().forEach((node) => {
        const inner = node.querySelector<HTMLElement>("[data-magnet]");
        if (inner) inner.style.transform = "";
      });
    };

    if (fine) {
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
    }

    const triggers: ScrollTrigger[] = [];
    if (!reduce && desktop && pinned) {
      registerGsap();
      const assemble = gsap.fromTo(
        stage,
        { "--r1": "42%", "--r2": "58%" },
        {
          "--r1": "22%",
          "--r2": "36%",
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: pin,
            start: "top 92%",
            end: "top top",
            scrub: true,
          },
        },
      );
      if (assemble.scrollTrigger) triggers.push(assemble.scrollTrigger);

      const expand = gsap.fromTo(
        stage,
        { "--r1": "22%", "--r2": "36%" },
        {
          "--r1": "30%",
          "--r2": "44%",
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: "+=100%",
            scrub: true,
          },
        },
      );
      if (expand.scrollTrigger) triggers.push(expand.scrollTrigger);

      let last = 0;
      const focus = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=100%",
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const index = Math.min(companies.length - 1, Math.floor(self.progress * companies.length));
          if (index !== last) {
            last = index;
            setActive(index);
          }
        },
      });
      triggers.push(focus);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [pinned]);

  return (
    <section className="section bg-bg lg:py-0">
      <div ref={pinRef} className="lg:flex lg:min-h-[100svh] lg:items-center">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="hidden lg:col-span-4 lg:block">
              {pinned ? (
                <>
                  <Eyebrow index="03" label="Our companies" />
                  <p className="mt-8 font-mono text-[12px] text-muted">
                    0{active + 1} / 0{companies.length}
                    <span className="mx-2">—</span>
                    {focused.category}
                  </p>
                  <h2 className="display mt-3 text-[clamp(36px,4vw,56px)]">{focused.name}</h2>
                  <p className="mt-4 max-w-sm text-[17px] text-muted">{focused.line}</p>
                </>
              ) : (
                <>
                  <Eyebrow index="01" label="Structure" />
                  <p className="text-muted">{companiesIntro}</p>
                </>
              )}
            </div>

            <div className="lg:col-span-8">
              {pinned ? (
                <div className="mb-8 lg:hidden">
                  <Eyebrow index="03" label="Our companies" />
                </div>
              ) : null}
              <div
                ref={stageRef}
                data-zone
                className="orbit-stage relative mx-auto aspect-square w-full max-w-[640px]"
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                  <circle data-ring="1" cx="50" cy="50" r="22" fill="none" stroke="#e7e6e3" strokeWidth="0.2" />
                  <circle data-ring="2" cx="50" cy="50" r="36" fill="none" stroke="#e7e6e3" strokeWidth="0.2" />
                  {nodes.map((node) => (
                    <line key={node.id} x1="50" y1="50" x2="50" y2="50" stroke="#e7e6e3" strokeWidth="0.25" />
                  ))}
                </svg>

                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="core-pulse mx-auto size-16 rounded-full border border-line-strong" />
                  <p className="mt-3 font-mono text-[12px]">Mindlead Core</p>
                </div>

                {nodes.map((node) => (
                  <NodeLink
                    key={node.id}
                    node={node}
                    active={pinned && focused.id === node.id}
                    hovered={hovered === node.id}
                    onHover={setHovered}
                  />
                ))}

                <div
                  ref={cursorRef}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 z-20 size-8 rounded-full border border-ink/30 opacity-0 max-lg:hidden"
                />
              </div>
            </div>
          </div>

          <ul className={`mt-12 space-y-8 lg:hidden ${pinned ? "" : "hidden"}`}>
            {companies.map((company) => (
              <li key={company.id} className="border-t border-line pt-6">
                <Link href={company.href}>
                  <span className="font-mono text-[12px] text-muted">{company.category}</span>
                  <span className="display mt-2 block text-[32px]">{company.name}</span>
                  <span className="mt-2 block text-muted">{company.line}</span>
                </Link>
              </li>
            ))}
            <li className="border-t border-line pt-6">
              <Link href={nextCompany.href}>
                <span className="font-mono text-[12px] text-muted">Partnership</span>
                <span className="display mt-2 block text-[32px]">{nextCompany.name}</span>
                <span className="mt-2 block text-muted">{nextCompany.line}</span>
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </section>
  );
}
