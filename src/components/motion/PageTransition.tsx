"use client";

import { ViewTransition, type ReactNode } from "react";

/** La pagina esce in dissolvenza, la nuova sale di 24px. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
