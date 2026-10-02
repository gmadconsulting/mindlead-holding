/**
 * Ponte tra il motore del gruppo (GroupStage) e la goccia che apre "Our companies" (ApproachStage):
 * una delle palline che girano sull'anello si stacca e diventa la goccia.
 */
export type DropSource = {
  /** Posizione a schermo (coordinate viewport) della pallina che cadrà, o null se non visibile. */
  dropPoint(): { x: number; y: number } | null;
  /** Nasconde la pallina mentre al suo posto c'è la goccia; false la rimette sull'anello. */
  releaseDot(on: boolean): void;
};

export const engineDrop: { source: DropSource | null } = { source: null };
