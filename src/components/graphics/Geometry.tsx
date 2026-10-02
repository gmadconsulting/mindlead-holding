"use client";

/** Tre tavole isometriche. Lo scroll le monta, così il disegno spiega il concetto. */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

type Pt = [number, number];

function project(x: number, y: number, z: number, ox: number, oy: number, s: number): Pt {
  return [+(ox + (x - y) * s).toFixed(1), +(oy + ((x + y) * 0.5 - z) * s).toFixed(1)];
}

function edge(a: Pt, b: Pt) {
  return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
}

function Wire({
  x,
  y,
  z,
  w,
  d,
  h,
  ox,
  oy,
  s,
  opacity = 1,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  ox: number;
  oy: number;
  s: number;
  opacity?: number;
}) {
  const q = (px: number, py: number, pz: number) => project(px, py, pz, ox, oy, s);
  const a = q(x, y, z);
  const b = q(x + w, y, z);
  const c = q(x + w, y + d, z);
  const e = q(x, y + d, z);
  const f = q(x, y, z + h);
  const g = q(x + w, y, z + h);
  const i = q(x + w, y + d, z + h);
  const j = q(x, y + d, z + h);
  const dAttr = [
    edge(a, b),
    edge(b, c),
    edge(c, e),
    edge(e, a),
    edge(f, g),
    edge(g, i),
    edge(i, j),
    edge(j, f),
    edge(a, f),
    edge(b, g),
    edge(c, i),
    edge(e, j),
  ].join(" ");
  return <path d={dAttr} pathLength="1" opacity={opacity} />;
}

function Grid({
  x0,
  y0,
  cols,
  rows,
  step,
  ox,
  oy,
  s,
}: {
  x0: number;
  y0: number;
  cols: number;
  rows: number;
  step: number;
  ox: number;
  oy: number;
  s: number;
}) {
  const parts: string[] = [];
  const x1 = x0 + cols * step;
  const y1 = y0 + rows * step;
  for (let i = 0; i <= rows; i++) {
    const y = y0 + i * step;
    parts.push(edge(project(x0, y, 0, ox, oy, s), project(x1, y, 0, ox, oy, s)));
  }
  for (let i = 0; i <= cols; i++) {
    const x = x0 + i * step;
    parts.push(edge(project(x, y0, 0, ox, oy, s), project(x, y1, 0, ox, oy, s)));
  }
  return <path d={parts.join(" ")} pathLength="1" opacity="0.22" />;
}

function Ring({
  cx,
  cy,
  z,
  r,
  ox,
  oy,
  s,
  opacity = 0.45,
}: {
  cx: number;
  cy: number;
  z: number;
  r: number;
  ox: number;
  oy: number;
  s: number;
  opacity?: number;
}) {
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const [px, py] = project(cx + Math.cos(t) * r, cy + Math.sin(t) * r, z, ox, oy, s);
    pts.push(`${px} ${py}`);
  }
  return <path d={`M ${pts.join(" L ")}`} pathLength="1" opacity={opacity} />;
}

function Mark({ x, y, z, ox, oy, s }: { x: number; y: number; z: number; ox: number; oy: number; s: number }) {
  const [cx, cy] = project(x, y, z, ox, oy, s);
  return <circle data-fill cx={cx} cy={cy} r="3.2" />;
}

/** Cornici della tavola: restano nel disegno, non tagliano la pagina. */
function Plate({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 640 460" className="geo-draw geo-scroll h-auto w-full overflow-visible" fill="none" aria-hidden>
      <g data-part="frame" opacity="0.4">
        <path d="M28 44 V28 H44" pathLength="1" />
        <path d="M612 44 V28 H596" pathLength="1" />
        <path d="M28 416 V432 H44" pathLength="1" />
        <path d="M612 416 V432 H596" pathLength="1" />
      </g>
      {children}
    </svg>
  );
}

/** Piattaforma: prima la base, poi il nucleo, poi i sistemi intorno. */
function AdvisoryPlate() {
  const ox = 330;
  const oy = 196;
  const s = 1.55;
  const satellites = [0.55, 2.55, 4.35];
  return (
    <Plate>
      <g data-part="base">
        <Ring cx={80} cy={70} z={0} r={86} ox={ox} oy={oy} s={s} opacity={0.22} />
        <Ring cx={80} cy={70} z={0} r={52} ox={ox} oy={oy} s={s} opacity={0.4} />
        <Wire x={56} y={46} z={0} w={48} d={48} h={8} ox={ox} oy={oy} s={s} opacity={0.5} />
      </g>
      <g data-part="spine">
        <Wire x={71} y={61} z={8} w={18} d={18} h={96} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="head">
        <Ring cx={80} cy={70} z={112} r={30} ox={ox} oy={oy} s={s} opacity={0.65} />
        <Wire x={60} y={50} z={112} w={40} d={40} h={30} ox={ox} oy={oy} s={s} />
        <Mark x={80} y={70} z={142} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="orbit">
        <Ring cx={80} cy={70} z={112} r={68} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="nodes">
        {satellites.map((angle) => {
          const x = 80 + Math.cos(angle) * 56 - 8;
          const y = 70 + Math.sin(angle) * 56 - 8;
          return <Wire key={angle} x={x} y={y} z={112} w={16} d={16} h={14} ox={ox} oy={oy} s={s} />;
        })}
      </g>
    </Plate>
  );
}

/** Il lavoro: le lastre si staccano dal piano, e sopra prende forma il software. */
function StudioPlate() {
  const ox = 312;
  const oy = 188;
  const s = 1.38;
  return (
    <Plate>
      <g data-part="ground">
        <Grid x0={4} y0={12} cols={7} rows={5} step={24} ox={ox} oy={oy} s={s} />
        <Wire x={8} y={16} z={0} w={164} d={108} h={7} ox={ox} oy={oy} s={s} opacity={0.38} />
      </g>
      <g data-part="layer-2">
        <Wire x={22} y={16} z={38} w={150} d={100} h={7} ox={ox} oy={oy} s={s} opacity={0.62} />
      </g>
      <g data-part="layer-3">
        <Wire x={36} y={16} z={76} w={136} d={92} h={7} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="block">
        <Wire x={78} y={38} z={83} w={56} d={40} h={50} ox={ox} oy={oy} s={s} />
        <Mark x={106} y={58} z={133} ox={ox} oy={oy} s={s} />
      </g>
    </Plate>
  );
}

/** I prodotti: una base sola, tre volumi che crescono. */
function ProductsPlate() {
  const ox = 300;
  const oy = 186;
  const s = 1.36;
  return (
    <Plate>
      <g data-part="ground">
        <Grid x0={0} y0={10} cols={8} rows={4} step={26} ox={ox} oy={oy} s={s} />
        <Wire x={4} y={16} z={0} w={204} d={92} h={8} ox={ox} oy={oy} s={s} opacity={0.42} />
      </g>
      <g data-part="tower-a">
        <Wire x={18} y={32} z={8} w={44} d={56} h={58} ox={ox} oy={oy} s={s} />
        <Mark x={40} y={60} z={66} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="tower-b">
        <Wire x={80} y={32} z={8} w={44} d={56} h={118} ox={ox} oy={oy} s={s} />
        <Mark x={102} y={60} z={126} ox={ox} oy={oy} s={s} />
      </g>
      <g data-part="tower-c">
        <Wire x={142} y={32} z={8} w={44} d={56} h={84} ox={ox} oy={oy} s={s} />
        <Mark x={164} y={60} z={92} ox={ox} oy={oy} s={s} />
      </g>
    </Plate>
  );
}

const plates = {
  advisory: AdvisoryPlate,
  studio: StudioPlate,
  products: ProductsPlate,
} as const;

type Kind = keyof typeof plates;
type Tl = gsap.core.Timeline;

function part(svg: SVGSVGElement, name: string) {
  return svg.querySelector<SVGGElement>(`[data-part="${name}"]`);
}

function strokes(el: Element | null) {
  if (!el) return [];
  return el.querySelectorAll<SVGGeometryElement>("path, line, rect");
}

function draw(tl: Tl, el: Element | null, at: number, dur: number) {
  const lines = strokes(el);
  if (!lines.length) return;
  tl.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease: "none" }, at);
}

function dots(tl: Tl, el: Element | null, at: number, dur: number) {
  const marks = el?.querySelectorAll("[data-fill]");
  if (!marks?.length) return;
  tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: Math.max(0.08, dur * 0.35), ease: "none" }, at + dur * 0.65);
}

/** Si stacca dal piano e va al suo posto. Il volume resta intero. */
function lift(tl: Tl, el: SVGGElement | null, from: number, at: number, dur: number) {
  if (!el) return;
  draw(tl, el, at, Math.min(0.14, dur * 0.45));
  tl.fromTo(el, { y: from }, { y: 0, duration: dur, ease: "none" }, at);
  dots(tl, el, at, dur);
}

function playAdvisory(tl: Tl, svg: SVGSVGElement) {
  draw(tl, part(svg, "frame"), 0, 0.12);
  draw(tl, part(svg, "base"), 0.04, 0.2);
  lift(tl, part(svg, "spine"), 64, 0.16, 0.28);
  lift(tl, part(svg, "head"), -36, 0.4, 0.22);
  const orbit = part(svg, "orbit");
  if (orbit) {
    const box = orbit.getBBox();
    const origin = `${box.x + box.width / 2} ${box.y + box.height / 2}`;
    draw(tl, orbit, 0.58, 0.2);
    tl.fromTo(orbit, { scale: 0.2, svgOrigin: origin }, { scale: 1, duration: 0.24, ease: "none" }, 0.58);
  }
  lift(tl, part(svg, "nodes"), 22, 0.78, 0.22);
}

function playStudio(tl: Tl, svg: SVGSVGElement) {
  draw(tl, part(svg, "frame"), 0, 0.1);
  draw(tl, part(svg, "ground"), 0.04, 0.2);
  lift(tl, part(svg, "layer-2"), 52, 0.22, 0.22);
  lift(tl, part(svg, "layer-3"), 104, 0.42, 0.22);
  lift(tl, part(svg, "block"), 128, 0.64, 0.3);
}

function playProducts(tl: Tl, svg: SVGSVGElement) {
  draw(tl, part(svg, "frame"), 0, 0.1);
  draw(tl, part(svg, "ground"), 0.04, 0.22);
  lift(tl, part(svg, "tower-a"), 40, 0.24, 0.22);
  lift(tl, part(svg, "tower-b"), 78, 0.42, 0.28);
  lift(tl, part(svg, "tower-c"), 52, 0.64, 0.24);
}

const scenes: Record<Kind, (tl: Tl, svg: SVGSVGElement) => void> = {
  advisory: playAdvisory,
  studio: playStudio,
  products: playProducts,
};

export function ConceptDiagram({
  kind,
  className = "",
}: {
  kind: Kind;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const svg = root?.querySelector("svg");
    if (!root || !svg) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: svg.closest("li") ?? svg,
          start: "top 78%",
          end: "bottom 55%",
          scrub: true,
        },
      });
      scenes[kind](tl, svg);
    }, root);

    return () => ctx.revert();
  }, [kind]);

  const PlateKind = plates[kind];
  return (
    <div ref={ref} className={className}>
      <PlateKind />
    </div>
  );
}
