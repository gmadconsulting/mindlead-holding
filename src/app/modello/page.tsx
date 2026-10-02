import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { core, model, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { Eyebrow } from "@/components/motion/Eyebrow";
import { PageTransition } from "@/components/motion/PageTransition";
import { ScrollHighlight } from "@/components/motion/ScrollHighlight";

const ValueCycle = dynamic(() => import("@/components/model/ValueCycle").then((mod) => mod.ValueCycle));

export const metadata: Metadata = {
  title: seo.modello.title,
  description: seo.modello.description,
};

export default function ModelloPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Model" title={model.title}>
        <ScrollHighlight text={model.opening} />
      </PageIntro>

      <section className="section">
        <Container>
          <Eyebrow index="02" label="The value cycle" />
          <ValueCycle />
        </Container>
      </section>

      <section className="section bg-bg-sunken">
        <Container>
          <Eyebrow index="03" label="What the group provides" />
          <h2 className="display max-w-xl text-[clamp(32px,4vw,52px)]">{model.bringsTitle}</h2>
          <table className="mt-12 w-full text-left">
            <caption className="sr-only">{model.bringsTitle}</caption>
            <tbody>
              {model.brings.map((row) => (
                <tr key={row.area} className="border-t border-line">
                  <th className="w-[34%] py-6 pr-6 align-top font-mono text-[13px] font-normal text-muted">
                    {row.area}
                  </th>
                  <td className="py-6 align-top">{row.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </section>

      <section className="section">
        <Container>
          <Eyebrow index="04" label="The platform" />
          <h2 className="display max-w-3xl text-[clamp(32px,4vw,56px)]">{core.title.join(" ")}</h2>
          <p className="mt-6 max-w-2xl text-muted">{core.body}</p>
          <p className="mt-4 max-w-2xl text-muted">{core.note}</p>
        </Container>
      </section>

      <section className="section pt-0">
        <Container>
          <Eyebrow index="05" label="Artificial intelligence" />
          <p className="max-w-2xl text-[20px] leading-snug">{model.ai}</p>
        </Container>
      </section>
    </PageTransition>
  );
}
