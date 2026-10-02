import type { Metadata } from "next";
import { contactPage, contacts, seo } from "@/content/it";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/layout/PageIntro";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: seo.contatti.title,
  description: seo.contatti.description,
};

export default function ContattiPage() {
  return (
    <PageTransition>
      <PageIntro index="01" label="Contact" title={contactPage.title}>
        <p>{contactPage.body}</p>
      </PageIntro>
      <section className="section pt-8">
        <Container>
          <ul>
            {contacts.map((item) => (
              <li key={item.email} className="grid gap-2 border-t border-line py-6 sm:grid-cols-2">
                <p>{item.label}</p>
                <a href={`mailto:${item.email}`} className="link-draw font-mono text-[14px] text-muted">
                  {item.email}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-xl text-muted">{contactPage.note}</p>
        </Container>
      </section>
    </PageTransition>
  );
}
