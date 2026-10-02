"use client";

import { ViewTransition, type ReactNode } from "react";

/** Il nome dell'azienda condivide la transizione tra card e pagina. */
export function CompanyName({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ViewTransition name={`company-${id}`}>
      <span className={className}>{children}</span>
    </ViewTransition>
  );
}
