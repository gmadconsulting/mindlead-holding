import { Hero } from "@/components/home/Hero";
import { GroupStage } from "@/components/home/GroupStage";
import { ApproachStage } from "@/components/home/ApproachStage";
import { PlatformStage } from "@/components/home/PlatformStage";
import { AiStage } from "@/components/home/AiStage";
import { PageTransition } from "@/components/motion/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <div className="relative z-30 -mt-[90svh] bg-bg motion-reduce:mt-0">
        {/* Sfumatura che sale sul tuffo nel chip: il manifesto emerge dal bianco senza bordo netto. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-[15svh] bg-linear-to-b from-transparent to-bg motion-reduce:hidden"
        />
        <GroupStage />
        <ApproachStage />
        <PlatformStage />
        <AiStage />
      </div>
    </PageTransition>
  );
}
