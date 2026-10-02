"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { MaskReveal } from "@/components/motion/MaskReveal";

export function PageIntro({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title: readonly string[];
  children?: ReactNode;
}) {
  return (
    <section className="pt-32 pb-8 md:pt-40">
      <Container>
        <Eyebrow index={index} label={label} />
        <MaskReveal
          as="h1"
          lines={title}
          delay={0.12}
          className="display max-w-4xl text-[clamp(44px,6vw,84px)]"
        />
        {children ? <div className="mt-8 max-w-2xl space-y-4 text-muted">{children}</div> : null}
      </Container>
    </section>
  );
}
