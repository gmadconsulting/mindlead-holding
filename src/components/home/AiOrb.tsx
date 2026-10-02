import type { CSSProperties } from "react";

/** Diametro della sfera: uguale in "Platform" e in "Intelligence", che se la passano nello stesso punto dello schermo. */
export const ORB = "min(38vmin, 420px)";

/**
 * La "super AI" del gruppo: una sfera di vetro azzurrino, trasparente e luminosa, con un alone morbido
 * e due anelli inclinati che le girano attorno. Stesso tratto sottile del resto del sito, un solo colore in più.
 * Parti animabili da fuori: [data-orb-halo] (alone) e [data-orb-core] (sfera e anelli).
 */
export function AiOrb() {
  return (
    <div className="relative" style={{ width: ORB, height: ORB }}>
      <div
        data-orb-halo
        className="absolute -inset-[75%] rounded-full bg-[radial-gradient(closest-side,rgba(120,185,255,0.32),rgba(120,185,255,0.12)_50%,transparent)]"
      />
      <div data-orb-core className="absolute inset-0">
        {/* Anelli dietro la sfera: attraverso il vetro si intravedono anche davanti. */}
        <div className="absolute -inset-[24%] [perspective:1400px]">
          {[
            { tilt: "rotateX(74deg) rotateY(-12deg)", inset: "0%", t: "26s", rev: false },
            { tilt: "rotateX(66deg) rotateY(34deg)", inset: "9%", t: "34s", rev: true },
          ].map((ring) => (
            <div
              key={ring.tilt}
              className="absolute [transform-style:preserve-3d]"
              style={{ inset: ring.inset, transform: ring.tilt }}
            >
              <div
                className={`orb-spin absolute inset-0 rounded-full border border-ink/15 ${ring.rev ? "orb-spin-rev" : ""}`}
                style={{ "--orb-t": ring.t } as CSSProperties}
              >
                <span className="absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5aa9f0] shadow-[0_0_12px_3px_rgba(90,169,240,0.55)]" />
              </div>
            </div>
          ))}
        </div>

        {/* Sfera: vetro azzurro con riflessi che ruotano dentro, luce in alto a sinistra, bordo chiaro. */}
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_58%,rgba(222,238,255,0.55),rgba(165,208,250,0.5)_55%,rgba(110,168,235,0.62))] shadow-[0_0_90px_12px_rgba(120,185,255,0.3)] backdrop-blur-[3px]">
          <div
            className="orb-spin absolute -inset-1/4 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.8)_12%,transparent_28%,rgba(120,190,255,0.6)_46%,transparent_62%,rgba(255,255,255,0.55)_80%,transparent)] opacity-70 blur-2xl"
            style={{ "--orb-t": "18s" } as CSSProperties}
          />
          <div
            className="orb-spin orb-spin-rev absolute -inset-1/4 bg-[conic-gradient(from_120deg,transparent,rgba(90,160,240,0.45)_18%,transparent_36%,rgba(255,255,255,0.5)_60%,transparent_76%)] opacity-60 blur-xl"
            style={{ "--orb-t": "27s" } as CSSProperties}
          />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_33%_27%,rgba(255,255,255,0.95),rgba(255,255,255,0)_36%)]" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75),inset_-22px_-30px_70px_rgba(70,140,215,0.3),inset_14px_18px_40px_rgba(255,255,255,0.55)]" />
        </div>
      </div>
    </div>
  );
}
