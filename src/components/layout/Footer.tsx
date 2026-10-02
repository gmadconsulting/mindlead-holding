import Link from "next/link";
import { companies, footer, nav } from "@/content/it";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer
      className="relative z-30 border-t border-line"
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo />

          <p className="mt-4 max-w-xs text-[17px] text-muted">
            {footer.signature} — {footer.tagline}
          </p>
        </div>
        <div className="lg:col-span-4">
          <p className="font-mono text-[12px] text-muted">Companies</p>
          <ul className="mt-4 space-y-2">
            {companies.map((company) => (
              <li key={company.id}>
                <Link href={company.href} className="link-draw text-[15px]">
                  {company.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-3">
          <p className="font-mono text-[12px] text-muted">Group</p>
          <ul className="mt-4 space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-draw text-[15px]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 border-t border-line px-6 py-6 font-mono text-[12px] text-muted md:flex-row md:items-center md:justify-between md:px-10">
        <p>© 2026 Mindlead Holding</p>
        <p className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/privacy" className="link-draw">
            Privacy Policy
          </Link>
          <Link href="/cookie" className="link-draw">
            Cookie Policy
          </Link>
          <Link href="/note-legali" className="link-draw">
            Legal notice
          </Link>
        </p>
      </div>
    </footer>
  );
}
