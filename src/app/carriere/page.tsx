import type { Metadata } from "next";
import { careers, emails, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: seo.carriere.title,
  description: seo.carriere.description,
};

export default function CarrierePage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Careers" title={careers.title}>
        <p>{careers.body}</p>
      </PageIntro>
      <section className="section">
        <Container>
          <Eyebrow index="02" label={careers.whyTitle} />
          <p className="max-w-2xl text-[20px] leading-snug">{careers.why}</p>
          <p className="mt-10 text-muted">{careers.empty}</p>
          <div className="mt-8">
            <MagneticButton href={`mailto:${emails.careers}`}>{emails.careers}</MagneticButton>
          </div>
        </Container>
      </section>
    </PageTransition>
  );
}
