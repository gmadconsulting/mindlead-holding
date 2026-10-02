import type { Metadata } from "next";
import { emails } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: "Legal notice — Mindlead Group",
  description: "Site owner and contact details for Mindlead Group.",
};

export default function NoteLegaliPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Legal" title={["Legal notice"]}>
        <p>
          Mindlead Group is the public name of Mindlead Holding. Contact: {emails.info}. Presence: Milan,
          Dubai.
        </p>
        <p>Full company details will be published after the holding company is incorporated.</p>
      </PageIntro>
      <Container>
        <p className="pb-24 font-mono text-[13px] text-muted">© 2026 Mindlead Holding</p>
      </Container>
    </PageTransition>
  );
}
