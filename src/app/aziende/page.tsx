import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { companies, companiesPage, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { CompanyName } from "@/components/motion/CompanyName";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { PageTransition } from "@/components/motion/PageTransition";

const Orbit = dynamic(() => import("@/components/home/Orbit").then((mod) => mod.Orbit));

export const metadata: Metadata = {
  title: seo.aziende.title,
  description: seo.aziende.description,
};

function Status({ status }: { status: "Available" | "In development" }) {
  const on = status === "Available";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[12px] text-muted">
      <span
        className="size-1.5 rounded-full border border-line-strong"
        style={on ? { background: "var(--available)", borderColor: "var(--available)" } : undefined}
      />
      {status}
    </span>
  );
}

export default function AziendePage() {
  const sheet = companiesPage;
  return (
    <PageTransition>
      <PageIntro index="01" label="Companies" title={sheet.title}>
        <p>{sheet.intro}</p>
      </PageIntro>

      <Orbit pinned={false} />

      <section className="section pt-0">
        <Container>
          <p className="max-w-3xl font-mono text-[13px] text-muted">{sheet.coreNote}</p>
        </Container>
      </section>

      <section className="section bg-bg-sunken">
        <Container>
          <Eyebrow index="02" label="Mindlead" />
          <p className="mb-16 font-mono text-[13px] text-muted">{sheet.mindleadLabel}</p>

          <article id="advisory" className="scroll-mt-28 border-t border-line py-12">
            <p className="font-mono text-[12px] text-muted">Mindlead</p>
            <h2 className="display mt-4 text-[clamp(36px,4vw,56px)]">
              <CompanyName id="advisory">Mindlead Advisory</CompanyName>
            </h2>
            <p className="mt-4 text-[18px]">{companies.find((item) => item.id === "advisory")?.line}</p>
            <p className="mt-4 max-w-2xl text-muted">{sheet.advisory.body}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[12px] text-muted">Who it's for</dt>
                <dd className="mt-2">{sheet.advisory.forWho}</dd>
              </div>
              <div>
                <dt className="font-mono text-[12px] text-muted">What we do</dt>
                <dd className="mt-2">{sheet.advisory.does}</dd>
              </div>
            </dl>
          </article>

          <article id="studio" className="scroll-mt-28 border-t border-line py-12">
            <p className="font-mono text-[12px] text-muted">Mindlead</p>
            <h2 className="display mt-4 text-[clamp(36px,4vw,56px)]">
              <CompanyName id="studio">Mindlead Studio</CompanyName>
            </h2>
            <p className="mt-4 text-[18px]">{companies.find((item) => item.id === "studio")?.line}</p>
            <p className="mt-4 max-w-2xl text-muted">{sheet.studio.body}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[12px] text-muted">Who it's for</dt>
                <dd className="mt-2">{sheet.studio.forWho}</dd>
              </div>
              <div>
                <dt className="font-mono text-[12px] text-muted">What we do</dt>
                <dd className="mt-2">{sheet.studio.does}</dd>
              </div>
            </dl>
          </article>

          <article id="suite" className="scroll-mt-28 border-t border-line py-12">
            <p className="font-mono text-[12px] text-muted">Mindlead Suite</p>
            <h2 className="display mt-4 text-[clamp(36px,4vw,56px)]">
              <CompanyName id="suite">Mindlead Suite</CompanyName>
            </h2>
            <p className="mt-4 text-[18px]">{companies.find((item) => item.id === "suite")?.line}</p>
            <p className="mt-4 max-w-2xl text-muted">{sheet.suite.body}</p>
            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-bg-elevated p-6">
                <Status status={sheet.suite.construction.status} />
                <h3 className="display mt-6 text-[32px]">{sheet.suite.construction.name}</h3>
                <p className="mt-2">{sheet.suite.construction.line}</p>
                <p className="mt-4 text-muted">{sheet.suite.construction.body}</p>
              </div>
              <div className="rounded-[12px] border border-line bg-bg-elevated p-6">
                <Status status={sheet.suite.next.status} />
                <h3 className="display mt-6 text-[32px]">{sheet.suite.next.name}</h3>
                <p className="mt-2">{sheet.suite.next.line}</p>
                <p className="mt-4 text-muted">{sheet.suite.next.body}</p>
              </div>
            </div>
          </article>
        </Container>
      </section>

      <section className="section">
        <Container>
          <Eyebrow index="03" label="Partner Ventures" />
          <p className="max-w-2xl text-muted">{sheet.ventureIntro}</p>
          <p className="mt-6 font-mono text-[13px] text-muted">{sheet.ventureLabel}</p>

          <article id="totalone" className="scroll-mt-28 mt-12 border-t border-line py-12">
            <p className="font-mono text-[12px] text-muted">Partner Venture</p>
            <h2 className="display mt-4 text-[clamp(36px,4vw,56px)]">
              <CompanyName id="totalone">Totalone</CompanyName>
            </h2>
            <p className="mt-3 text-[18px]">The management platform for the furniture industry.</p>
            <p className="mt-4 max-w-2xl text-muted">{sheet.totalone.body}</p>
          </article>

          <article id="relay" className="scroll-mt-28 border-t border-line py-12">
            <p className="font-mono text-[12px] text-muted">Partner Venture</p>
            <h2 className="display mt-4 text-[clamp(36px,4vw,56px)]">
              <CompanyName id="relay">RelateSales</CompanyName>
            </h2>
            <p className="mt-3 text-[18px]">The CRM designed for industrial companies.</p>
            <p className="mt-4 max-w-2xl text-muted">{sheet.relay.body}</p>
          </article>
        </Container>
      </section>
    </PageTransition>
  );
}
