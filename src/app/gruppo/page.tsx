import type { Metadata } from "next";
import Image from "next/image";
import { about, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: seo.gruppo.title,
  description: seo.gruppo.description,
};

export default function GruppoPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Group" title={about.title}>
        {about.opening.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </PageIntro>

      <div className="relative mx-auto mt-8 h-[48svh] min-h-72 max-w-[1440px] overflow-hidden">
        <Image
          src="/images/structure.jpg"
          alt="Concrete and glass facade, in the fog"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      </div>

      <section className="section">
        <Container>
          <Eyebrow index="02" label="Our story" />
          <div className="grid gap-12 lg:grid-cols-3">
            {about.steps.map((step, index) => (
              <article key={step.title}>
                <p className="font-mono text-[12px] text-muted">0{index + 1}</p>
                <h2 className="display mt-4 text-[clamp(28px,3vw,40px)]">{step.title}</h2>
                <p className="mt-4 text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-bg-sunken">
        <Container>
          <Eyebrow index="03" label="Mission, vision, values" />
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-mono text-[12px] text-muted">Mission</h2>
              <p className="display mt-4 text-[clamp(28px,3vw,40px)]">{about.mission}</p>
              <h2 className="mt-12 font-mono text-[12px] text-muted">Vision</h2>
              <p className="mt-4 text-muted">{about.vision}</p>
            </div>
            <ul className="space-y-8">
              {about.values.map((value) => (
                <li key={value.title}>
                  <h3 className="text-[20px]">{value.title}</h3>
                  <p className="mt-2 text-muted">{value.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <Eyebrow index="04" label="Leadership" />
          <article className="max-w-2xl border-t border-line pt-8">
            <h2 className="display text-[clamp(32px,4vw,48px)]">{about.leader.name}</h2>
            <p className="mt-2 font-mono text-[13px] text-muted">{about.leader.role}</p>
            <p className="mt-6 text-muted">{about.leader.bio}</p>
          </article>
        </Container>
      </section>

      <section className="section pt-0">
        <Container>
          <Eyebrow index="05" label="Where we are" />
          <p className="display text-[clamp(40px,6vw,80px)]">Milan · Dubai</p>
        </Container>
      </section>
    </PageTransition>
  );
}
