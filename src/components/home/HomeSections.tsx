"use client";

import { finalCta, sectors, whyGroup } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function WhyGroup() {
  return (
    <section
      data-cover
      className="section relative z-30 -mt-8 overflow-hidden rounded-t-[40px] bg-bg shadow-[0_-24px_50px_-28px_rgba(0,0,0,0.28)]"
    >
      <Container>
        <Eyebrow index="07" label="Why a group" />
        <div className="grid gap-px bg-line lg:grid-cols-3">
          {whyGroup.map((item, index) => (
            <article key={item.title} className="bg-bg py-8 lg:px-8 lg:py-2 lg:first:pl-0">
              <p className="font-mono text-[12px] text-muted">0{index + 1}</p>
              <h2 className="display mt-4 text-[clamp(28px,3vw,40px)]">{item.title}</h2>
              <p className="mt-4 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function Sectors() {
  return (
    <section className="section bg-bg-sunken">
      <Container>
        <Eyebrow index="08" label="Industries" />
        <ul className="flex flex-col">
          {sectors.map((sector) => (
            <li
              key={sector}
              className="border-t border-line py-6 font-mono text-[13px] tracking-wide last:border-b"
            >
              {sector}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section bg-bg">
      <Container>
        <h2 className="display max-w-3xl text-[clamp(36px,5vw,72px)]">{finalCta.title}</h2>
        <p className="mt-6 max-w-xl text-muted">{finalCta.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MagneticButton href="mailto:partnership@mindleadholding.com">{finalCta.primary}</MagneticButton>
          <MagneticButton href="/contatti">{finalCta.secondary}</MagneticButton>
        </div>
      </Container>
    </section>
  );
}
