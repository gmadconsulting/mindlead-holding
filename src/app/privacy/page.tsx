import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: "Privacy Policy — Mindlead Group",
  description: "This site does not use forms, analytics, or tracking cookies.",
};

export default function PrivacyPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Privacy" title={["Privacy Policy"]}>
        <p>
          This site does not collect data through forms, analytics, or tracking cookies. Contact links open
          in your email program.
        </p>
        <p>The full policy will be published with a dedicated tool before launch.</p>
      </PageIntro>
      <Container>
        <p className="pb-24" />
      </Container>
    </PageTransition>
  );
}
