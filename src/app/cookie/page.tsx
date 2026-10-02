import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: "Cookie Policy — Mindlead Group",
  description: "This site does not set measurement or profiling cookies.",
};

export default function CookiePage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Cookies" title={["Cookie Policy"]}>
        <p>Mindlead Holding does not set measurement or profiling cookies on this site.</p>
      </PageIntro>
      <Container>
        <p className="pb-24" />
      </Container>
    </PageTransition>
  );
}
