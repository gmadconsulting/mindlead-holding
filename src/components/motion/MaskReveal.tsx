"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease } from "@/lib/motion";

/** Il titolo entra riga per riga, da sotto una maschera. */
export function MaskReveal({
  lines,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: {
  lines: readonly string[];
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <motion.span
          key={`${line}-${index}`}
          className="block overflow-hidden"
          initial={reduce ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -5% 0px" }}
          transition={{ delay: reduce ? 0 : delay + index * 0.08 }}
        >
          {/* L'osservatore è la riga, non il testo spostato: altrimenti non entra mai in vista. */}
          <motion.span
            className="block"
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%" },
            }}
            transition={{ duration: reduce ? 0 : duration.base, ease: ease.out }}
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  );
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: reduce ? 0 : duration.base, delay, ease: ease.out }}
    >
      {children}
    </motion.div>
  );
}
