/**
 * Marchio Mindlead. Il PNG fa da maschera, con il colore ufficiale del logo (#505B6A).
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-[#505B6A] ${className}`}
      style={{
        maskImage: "url(/brand/mindlead-mark-128.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

/** Marchio più nome, per header e footer. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[13px] tracking-[0.18em] ${className}`}>
      <LogoMark className="size-[22px]" />
      MINDLEAD HOLDING
    </span>
  );
}
