"use client";

import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "@/lib/motion";

/** Etichetta mono sopra il titolo: compare prima delle righe in maschera. */
export function Eyebrow({
  index,
  label,
  className = "text-muted",
}: {
  index: string;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className={`mb-6 font-mono text-[13px] ${className}`}
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : duration.base, ease: ease.out }}
    >
      {index} — {label}
    </motion.p>
  );
}
