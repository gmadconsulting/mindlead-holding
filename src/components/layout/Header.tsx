"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { companies, nav } from "@/content/it";
import { duration, ease } from "@/lib/motion";
import { Logo } from "./Logo";

function lockScroll(locked: boolean) {
  document.body.style.overflow = locked ? "hidden" : "";
  window.dispatchEvent(new CustomEvent("mindlead:lock-scroll", { detail: locked }));
}

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 80 && !open);
      setSolid(y > 8);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>("a, button");
    focusable?.[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => lockScroll(false), []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] transition-transform duration-500 ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      } ${solid && !open ? "bg-bg/80 backdrop-blur-[12px]" : ""}`}
      style={{ viewTransitionName: "site-header", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className={`relative z-50 mx-auto flex h-[var(--header-h)] max-w-[1280px] items-center justify-between px-6 md:px-10 ${open ? "bg-bg" : ""}`}>
        <Link href="/" aria-label="Mindlead Holding, home">
          <Logo />
        </Link>
        <button
          ref={buttonRef}
          type="button"
          className="flex items-center gap-3 font-mono text-[13px]"
          aria-expanded={open}
          aria-controls="menu-pannello"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
          <span className="relative block h-2.5 w-5" aria-hidden>
            <span
              className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                open ? "top-1 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${
                open ? "top-1 -rotate-45" : "top-2"
              }`}
            />
          </span>
        </button>
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
          <motion.div
            id="menu-pannello"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-[80] flex bg-bg"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.out }}
          >
            <div className="mx-auto flex w-full max-w-[1280px] flex-col justify-between px-6 py-8 md:px-10 lg:flex-row lg:items-end lg:py-16">
              <nav className="mt-16 lg:mt-0" aria-label="Pages">
                <ul>
                  {nav.map((item, index) => (
                    <li key={item.href} className="overflow-hidden">
                      <motion.div
                        initial={reduce ? false : { y: "110%" }}
                        animate={{ y: "0%" }}
                        transition={{
                          duration: reduce ? 0 : duration.slow,
                          delay: reduce ? 0 : 0.05 + index * 0.06,
                          ease: ease.out,
                        }}
                      >
                        <Link
                          href={item.href}
                          className="display block py-1 text-[clamp(40px,6vw,72px)]"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-12 lg:mt-0 lg:pb-3">
                <p className="mb-4 font-mono text-[12px] text-muted">Companies</p>
                <ul className="space-y-2">
                  {companies.map((company) => (
                    <li key={company.id}>
                      <Link
                        href={company.href}
                        className="link-draw font-mono text-[13px] text-muted"
                        onClick={() => setOpen(false)}
                      >
                        {company.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
            document.body,
          )
        : null}
    </header>
  );
}
