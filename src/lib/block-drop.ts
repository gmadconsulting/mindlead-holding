/**
 * Ponte tra la scena 3D di "Our companies" (ApproachStage) e il foglio scuro di "Platform" (PlatformStage):
 * un piano di un edificio si stacca, cade rotolando e diventa il fondo nero della sezione dopo.
 */
export type BlockSource = {
  /** Rettangolo a schermo (coordinate viewport) del piano che cadrà, o null se la scena non è pronta. */
  blockRect(): { x: number; y: number; w: number; h: number } | null;
  /** Colori CSS attuali delle tre facce visibili del piano: sopra, fronte, lato destro. */
  blockColors(): [string, string, string];
  /** Nasconde il piano nella scena mentre al suo posto cade il rettangolo; false lo rimette. */
  releaseBlock(on: boolean): void;
};

export const blockDrop: { source: BlockSource | null } = { source: null };
