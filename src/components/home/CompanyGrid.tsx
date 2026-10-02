"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { companies, companiesIntro, companiesPage } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { CompanyName } from "@/components/motion/CompanyName";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { duration, ease } from "@/lib/motion";

function onCardMove(event: PointerEvent<HTMLElement>) {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  el.style.setProperty("--mx", `${x}px`);
  el.style.setProperty("--my", `${y}px`);
  const px = x / rect.width - 0.5;
  const py = y / rect.height - 0.5;
  el.style.setProperty("--ry", `${px * 3}deg`);
  el.style.setProperty("--rx", `${py * -3}deg`);
}

function onCardLeave(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
}

/** Anteprima schematica, non uno screenshot di prodotto. */
function SuitePreview() {
  return (
    <div aria-hidden className="mt-8 rounded-[10px] border border-line bg-bg p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="size-1.5 rounded-full" style={{ background: "var(--available)" }} />
        <span className="font-mono text-[11px] text-muted">Mindlead Construction</span>
        <span className="font-mono text-[11px] text-muted">Available</span>
      </div>
      <div className="grid grid-cols-[72px_1fr] gap-2">
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={`h-2 rounded-sm ${index === 0 ? "bg-ink/80" : "bg-line"}`} />
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="h-8 rounded-sm bg-bg-sunken" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="h-10 rounded-sm bg-line" />
            <div className="h-10 rounded-sm bg-line" />
            <div className="h-10 rounded-sm bg-bg-sunken" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyGrid() {
  const reduce = useReducedMotion();
  const zoneRef = useRef<HTMLDivElement>(null);
  const visual = ["suite", "advisory", "studio", "totalone", "relay"]
    .map((id) => companies.find((company) => company.id === id))
    .filter((company) => company !== undefined);

  return (
    <section className="relative z-0 bg-bg pt-16 pb-8 lg:pt-24 lg:pb-12">
      <div data-sheet className="origin-bottom bg-bg">
        <Container>
        <p className="max-w-2xl text-muted">{companiesIntro}</p>
        <div ref={zoneRef} data-zone className="relative mt-12 grid gap-4 lg:grid-cols-12">
          {visual.map((company, index) => {
            const large = company.id === "suite";
            const span = large ? "lg:col-span-7 lg:row-span-2" : company.ring === 1 ? "lg:col-span-5" : "lg:col-span-6";
            return (
              <motion.article
                key={company.id}
                className={`card-shine ${span}`}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{
                  duration: reduce ? 0 : duration.base,
                  delay: reduce ? 0 : index * 0.06,
                  ease: ease.out,
                }}
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
              >
                <Link href={company.href} className="flex h-full flex-col p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4 font-mono text-[12px] text-muted">
                    <span>{company.category}</span>
                    {company.id === "suite" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="size-1.5 rounded-full" style={{ background: "var(--available)" }} />
                        {companiesPage.suite.construction.status}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="display mt-8 text-[clamp(28px,3vw,44px)]">
                    <CompanyName id={company.id}>{company.name}</CompanyName>
                  </h3>
                  <p className="mt-3 max-w-sm text-[16px] text-muted">{company.line}</p>
                  {large ? <SuitePreview /> : null}
                  <span className="card-arrow mt-auto inline-block pt-8 font-mono text-[13px]">→</span>
                </Link>
              </motion.article>
            );
          })}
        </div>
        <div className="mt-10">
          <MagneticButton href="/aziende">See all companies</MagneticButton>
        </div>
        </Container>
      </div>
    </section>
  );
}
