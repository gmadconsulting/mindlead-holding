import type { Metadata } from "next";
import { emails, partnership, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: seo.partnership.title,
  description: seo.partnership.description,
};

export default function PartnershipPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Partnership" title={partnership.title}>
        <p>{partnership.body}</p>
      </PageIntro>

      <section className="section">
        <Container>
          <Eyebrow index="02" label="Who we look for" />
          <div className="grid gap-12 lg:grid-cols-3">
            {partnership.seek.map((item) => (
              <article key={item.title}>
                <h2 className="display text-[clamp(28px,3vw,36px)]">{item.title}</h2>
                <p className="mt-4 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-bg-sunken">
        <Container>
          <Eyebrow index="03" label="How it works" />
          <ol className="grid gap-10 lg:grid-cols-4">
            {partnership.steps.map((step, index) => (
              <li key={step}>
                <p className="font-mono text-[12px] text-muted">0{index + 1}</p>
                <p className="mt-4 text-[20px] leading-snug">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <MagneticButton href={`mailto:${emails.partnership}`}>{partnership.cta}</MagneticButton>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <Eyebrow index="04" label="Investors" />
          <h2 className="display text-[clamp(32px,4vw,48px)]">{partnership.investorsTitle}</h2>
          <p className="mt-6 max-w-2xl text-muted">{partnership.investors}</p>
          <div className="mt-8">
            <MagneticButton href={`mailto:${emails.investors}`}>{partnership.investorsCta}</MagneticButton>
          </div>
        </Container>
      </section>

      <section className="section pt-0">
        <Container>
          <Eyebrow index="05" label="Governance" />
          <h2 className="display max-w-3xl text-[clamp(32px,4vw,52px)]">{partnership.governanceTitle}</h2>
          <p className="mt-6 max-w-2xl text-muted">{partnership.governanceIntro}</p>
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            {partnership.governance.map((item) => (
              <article key={item.title}>
                <h3 className="text-[20px]">{item.title}</h3>
                <p className="mt-3 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </PageTransition>
  );
}
