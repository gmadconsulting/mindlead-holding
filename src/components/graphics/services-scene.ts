import * as THREE from "three";
import { blockMaterial } from "./block-material";
import { smallViewportHeight } from "@/lib/viewport";

/**
 * Scena 3D del capitolo "What we've learned". Gli stessi 56 moduli raccontano una storia sola:
 * 1 = Il sistema: una piattaforma a tre livelli (fondazione, servizi, applicazioni),
 *     collegata da connessioni verticali percorse da impulsi. Complessa ma ordinata.
 * 2 = Il vuoto: la fondazione resta, il resto si ricompone in un pezzo su misura che
 *     galleggia sopra l'incavo esatto da cui nasce, con le quote come in un disegno tecnico.
 * 3 = Il vuoto che si ripete: il pezzo diventa prodotto. Tre nastri, un portale: i prodotti
 *     entrano grezzi ed escono finiti, in serie, come in un'industria.
 * 3–4 = Il motore: la camera si allontana, la linea scivola sulla prima stazione di un anello
 *     e si trasforma in un mercato di aziende diverse che ascoltiamo (onde come un sonar);
 *     la scena passa dal buio al chiaro. Le altre stazioni raccontano il resto del metodo:
 *     lo stesso bisogno che torna in più aziende, l'azienda fondata a metà con un partner
 *     di settore, l'azienda che cresce con il supporto del gruppo.
 * 4–7 = L'anello ruota e porta davanti una stazione alla volta; a 7 il giro si chiude.
 * Lo stato (0–7) arriva dallo scroll; 0–1 è il montaggio iniziale.
 */

export type ServicesScene = {
  setState(s: number): void;
  setActive(on: boolean): void;
  /** La pallina dell'anello più vicina al fondo dello schermo, che cade come goccia (vedi engine-drop). */
  dropPoint(): { x: number; y: number } | null;
  releaseDot(on: boolean): void;
  /** Spazio libero tra titolo e tappe del motore, in px dall'alto della tela: usato solo su schermi stretti. */
  setBand(top: number, bottom: number): void;
  dispose(): void;
};

const FACE = 0x2a2a28;
const RAW = 0x111110;
const EDGE = 0xededeb;
/** Colori della versione chiara, dopo lo zoom indietro. */
const PAPER = 0xe9e8e4;
const BG = 0xfafaf9;
const INK = 0x0e0e0d;
const N = 56;

/** Anello del motore: raggio, scala delle stazioni, angolo della prima stazione. */
const RING_R = 5.5;
const MINI = 0.42;
/** Le miniature disegnate apposta sono più piccole della linea: le ingrandiamo un poco. */
const STATION_SCALE = [1, 1.4, 1.35, 1.35];
const PHI1 = Math.PI / 2 + 1;
const stationAngle = (k: number) => PHI1 + (k * Math.PI) / 2;

/** Altezza di un piano negli edifici del motore. */
const FLOOR = 0.36;

/** Stazione 1, il mercato: otto aziende diverse (larghezza, profondità, piani) attorno all'ascolto. */
const MARKET: [number, number, number][] = [
  [1.2, 1.2, 5],
  [1.6, 1.0, 8],
  [1.0, 1.0, 4],
  [1.4, 1.2, 7],
  [1.2, 1.6, 9],
  [1.0, 1.4, 6],
  [1.6, 1.2, 7],
  [1.2, 1.2, 9],
];
const MARKET_R = 3.3;
/** Raggio delle due onde d'ascolto che partono dal centro. */
const rippleRadius = (time: number, i: number) => 0.6 + ((time * 0.3 + i * 0.5) % 1) * 5;

/** Stazione 2: quattro aziende diverse (x, z, larghezza, profondità, piani) con lo stesso bisogno. */
const PATTERN: [number, number, number, number, number][] = [
  [-2.4, -0.5, 1.0, 1.2, 4],
  [-0.8, 0.5, 1.4, 1.0, 6],
  [0.8, -0.5, 1.0, 1.0, 3],
  [2.4, 0.5, 1.2, 1.4, 5],
];
/** Il piano che si ripete in ogni azienda della stazione 2. */
const NEED = 1;

/** Griglia della fondazione: 6 × 6 lastre. */
const PITCH = 1.05;
const cell = (c: number) => (c - 2.5) * PITCH;

/** Incavo su misura (celle i, j della fondazione) e altezza del pezzo su ogni cella. */
const HOLE: [number, number][] = [
  [1, 1],
  [2, 1],
  [1, 2],
  [2, 2],
  [3, 2],
  [2, 3],
  [3, 3],
  [4, 3],
  [4, 4],
];
const HEIGHTS = [2, 3, 3, 4, 4, 3, 4, 3, 3];
const isHole = (i: number, j: number) => HOLE.some(([a, b]) => a === i && b === j);

/** Piattaforma: livello servizi 4 × 4 e livello applicazioni 2 × 2. */
const MID = { pitch: 1.15, y: 1.95 };
const TOP = { offset: 0.8, y: 3.75 };

/** Linea di produzione. */
const BELT_GAP = 1.7;
const GATE_Z = 2.75;
const LINE_LENGTH = 9;

type Pose = { p: THREE.Vector3; s: THREE.Vector3; lit: number };
type Slot = { k: number; i: number; j: number; l: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const smooth = (a: number, b: number, v: number) => {
  const t = range(v, a, b);
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hoverAt = (time: number) => 2.5 + Math.sin(time * 1.1) * 0.16;

// Ruoli dei moduli: le lastre fuori dall'incavo restano fondazione, poi diventano nastri.
const baseIds: number[] = [];
for (let k = 0; k < 36; k++) if (!isHole(k % 6, Math.floor(k / 6))) baseIds.push(k);

// Il pezzo su misura: la lastra dell'incavo sale per prima, i moduli dei livelli alti la seguono.
const piece: Slot[] = [];
{
  let spare = 36;
  HOLE.forEach(([i, j], c) => {
    for (let l = 0; l < HEIGHTS[c]; l++) piece.push({ k: l === 0 ? j * 6 + i : spare++, i, j, l });
  });
}

const makePoses = (n = N): Pose[] =>
  Array.from({ length: n }, () => ({ p: new THREE.Vector3(), s: new THREE.Vector3(), lit: 1 }));

/** 01 Ascolto: un punto al centro, le aziende attorno si accendono quando l'onda le raggiunge. */
function market(time: number, out: Pose[]) {
  out[0].p.set(0, 0, 0);
  out[0].s.set(0.7, 0.45, 0.7);
  out[0].lit = 1.5;
  let k = 1;
  MARKET.forEach(([w, d, floors], b) => {
    const a = (b / MARKET.length) * Math.PI * 2 + 0.3;
    const hit = Math.max(
      ...[0, 1].map((i) => clamp01(1 - Math.abs(rippleRadius(time, i) - MARKET_R) / 0.9)),
    );
    for (let f = 0; f < floors; f++) {
      out[k].p.set(Math.cos(a) * MARKET_R, f * FLOOR, Math.sin(a) * MARKET_R);
      out[k].s.set(w, FLOOR - 0.04, d);
      out[k].lit = 0.8 + 0.7 * hit;
      k++;
    }
  });
}

/** 02 Schemi: aziende diverse, lo stesso piano evidenziato in ognuna. */
function patterns(out: Pose[]) {
  let k = 0;
  PATTERN.forEach(([x, z, w, d, floors]) => {
    for (let f = 0; f < floors; f++) {
      out[k].p.set(x, f * FLOOR, z);
      out[k].s.set(w, FLOOR - 0.04, d);
      out[k].lit = f === NEED ? 1.9 : 0.55;
      k++;
    }
  });
}

/** 03 Costruzione: sulla fondazione del gruppo, metà tecnologia (chiara) e metà partner (scura), un tetto solo. */
function build(out: Pose[]) {
  let k = 0;
  for (let n = 0; n < 9; n++) {
    out[k].p.set(((n % 3) - 1) * 1.05, 0, (Math.floor(n / 3) - 1) * 1.05);
    out[k].s.set(1, 0.25, 1);
    out[k].lit = 0.5;
    k++;
  }
  // Metà affiancate lungo z: quando la stazione è davanti, z corre quasi orizzontale sullo schermo.
  [0.52, -0.52].forEach((z, side) => {
    for (let f = 0; f < 4; f++) {
      out[k].p.set(0, 0.25 + f * FLOOR, z);
      out[k].s.set(2, FLOOR - 0.04, 0.98);
      out[k].lit = side ? 1.9 : 0.9;
      k++;
    }
  });
  out[k].p.set(0, 0.25 + 4 * FLOOR, 0);
  out[k].s.set(2.2, 0.22, 2.2);
  out[k].lit = 1;
}

/** Supporti del gruppo attorno all'azienda che cresce: tecnologia, amministrazione, strategia. */
const SUPPORTS = [0, 1, 2].map((i) => {
  const a = (i / 3) * Math.PI * 2 + 0.5;
  return [Math.cos(a) * 2.4, Math.sin(a) * 2.4] as const;
});

/** 04 Crescita: una torre che sale piano dopo piano, poi ricomincia. */
function grow(time: number, out: Pose[]) {
  out[0].p.set(0, 0, 0);
  out[0].s.set(2.6, 0.2, 2.6);
  out[0].lit = 0.6;
  const phase = (time * 0.12) % 1;
  const reset = 1 - smooth(0.93, 1, phase);
  // I primi due piani restano sempre: l'azienda esiste, poi cresce e il ciclo riparte.
  for (let f = 0; f < 8; f++) {
    const appear = f < 2 ? 1 : smooth((f - 2) * 0.12, (f - 2) * 0.12 + 0.1, phase) * reset;
    out[1 + f].p.set(0, 0.2 + f * FLOOR, 0);
    out[1 + f].s.set(appear > 0.001 ? 1.3 : 0, (FLOOR - 0.04) * appear, appear > 0.001 ? 1.3 : 0);
    out[1 + f].lit = 1.9;
  }
  SUPPORTS.forEach(([x, z], i) => {
    out[9 + i].p.set(x, 0, z);
    out[9 + i].s.set(0.7, 0.5, 0.7);
    out[9 + i].lit = 0.8;
  });
}

function platform(time: number, out: Pose[]) {
  for (let k = 0; k < 36; k++) {
    out[k].p.set(cell(k % 6), 0, cell(Math.floor(k / 6)));
    out[k].s.set(1, 0.3, 1);
    out[k].lit = 0.7;
  }
  for (let m = 0; m < 16; m++) {
    const i = m % 4;
    const j = Math.floor(m / 4);
    // I servizi respirano piano: il sistema lavora anche quando la pagina è ferma.
    const h = 0.42 + Math.sin(time * 1.3 + i * 0.9 + j * 0.6) * 0.18;
    out[36 + m].p.set((i - 1.5) * MID.pitch, MID.y, (j - 1.5) * MID.pitch);
    out[36 + m].s.set(0.85, h, 0.85);
    out[36 + m].lit = 0.9;
  }
  for (let t = 0; t < 4; t++) {
    const i = t % 2;
    const j = Math.floor(t / 2);
    out[52 + t].p.set((i * 2 - 1) * TOP.offset, TOP.y, (j * 2 - 1) * TOP.offset);
    out[52 + t].s.set(1.25, 0.7, 1.25);
    out[52 + t].lit = 1;
  }
}

function bespoke(time: number, out: Pose[]) {
  const hover = hoverAt(time);
  baseIds.forEach((k) => {
    out[k].p.set(cell(k % 6), 0, cell(Math.floor(k / 6)));
    out[k].s.set(1, 0.3, 1);
    // La fondazione si spegne e diventa disegno: il protagonista è il pezzo.
    out[k].lit = 0.15;
  });
  piece.forEach(({ k, i, j, l }) => {
    out[k].p.set(cell(i), hover + l * 0.52, cell(j));
    out[k].s.set(1, 0.5, 1);
    out[k].lit = 1;
  });
}

const GATE: [number, number, number, number, number, number][] = [
  [0, 0, -GATE_Z, 0.5, 1.1, 0.5],
  [0, 1.15, -GATE_Z, 0.5, 1.1, 0.5],
  [0, 0, GATE_Z, 0.5, 1.1, 0.5],
  [0, 1.15, GATE_Z, 0.5, 1.1, 0.5],
  [0, 2.3, 0, 0.6, 0.35, GATE_Z * 2 + 0.5],
];

function industry(time: number, out: Pose[]) {
  baseIds.forEach((k, n) => {
    const belt = Math.floor(n / 9);
    out[k].p.set((n % 9) - 4, 0, (belt - 1) * BELT_GAP);
    out[k].s.set(0.94, 0.16, 1.1);
    out[k].lit = 0.45;
  });
  piece.slice(0, GATE.length).forEach(({ k }, g) => {
    const [x, y, z, sx, sy, sz] = GATE[g];
    out[k].p.set(x, y, z);
    out[k].s.set(sx, sy, sz);
    out[k].lit = 1;
  });
  // Ogni prodotto è una base e un modulo sopra; 4 prodotti per nastro, sfasati tra nastri.
  piece.slice(GATE.length).forEach(({ k }, n) => {
    const unit = Math.floor(n / 2);
    const belt = unit % 3;
    const slot = Math.floor(unit / 3);
    const phase = (time * 0.05 + slot / 4 + belt * 0.083) % 1;
    const x = (phase - 0.5) * LINE_LENGTH;
    const z = (belt - 1) * BELT_GAP;
    const ramp = smooth(0, 0.07, phase) * (1 - smooth(0.93, 1, phase));
    // Prima del portale il prodotto è grezzo (solo spigoli), dopo è finito.
    const lit = 0.12 + 1.38 * smooth(-0.1, 0.3, x);
    if (n % 2 === 0) {
      out[k].p.set(x, 0.16, z);
      out[k].s.set(0.72 * ramp, 0.42 * ramp, 0.72 * ramp);
    } else {
      out[k].p.set(x, 0.16 + 0.42 * ramp, z);
      out[k].s.set(0.4 * ramp, 0.22 * ramp, 0.4 * ramp);
    }
    out[k].lit = lit;
  });
}

const layouts = [platform, bespoke, industry];

function rectLine(w: number, d: number, material: THREE.LineBasicMaterial) {
  const pts = [
    new THREE.Vector3(-w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, -d / 2),
  ];
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
}

function segments(flat: number[], material: THREE.LineBasicMaterial) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
  return new THREE.LineSegments(geo, material);
}

/** Contorno dell'incavo: i lati delle celle che non confinano con un'altra cella dell'incavo. */
function holeOutline() {
  const flat: number[] = [];
  const corners = new Map<string, [number, number]>();
  const h = PITCH / 2;
  const add = (x0: number, z0: number, x1: number, z1: number) => {
    flat.push(x0, 0, z0, x1, 0, z1);
    corners.set(`${x0},${z0}`, [x0, z0]);
    corners.set(`${x1},${z1}`, [x1, z1]);
  };
  HOLE.forEach(([i, j]) => {
    const x = cell(i);
    const z = cell(j);
    if (!isHole(i, j - 1)) add(x - h, z - h, x + h, z - h);
    if (!isHole(i, j + 1)) add(x - h, z + h, x + h, z + h);
    if (!isHole(i - 1, j)) add(x - h, z - h, x - h, z + h);
    if (!isHole(i + 1, j)) add(x + h, z - h, x + h, z + h);
  });
  return { flat, corners: [...corners.values()] };
}

/** Quote del pezzo, come in un disegno tecnico: linea, richiami e tacche oblique. */
function dimensions() {
  const h = PITCH / 2;
  const x0 = cell(1) - h;
  const x1 = cell(4) + h;
  const z0 = cell(1) - h;
  const z1 = cell(4) + h;
  const off = 0.6;
  const tick = 0.14;
  const flat: number[] = [];
  const line = (ax: number, az: number, bx: number, bz: number) => flat.push(ax, 0, az, bx, 0, bz);
  // Larghezza, davanti al pezzo.
  const zf = z1 + off;
  line(x0, zf, x1, zf);
  line(x0, z1 + 0.12, x0, zf + 0.15);
  line(x1, z1 + 0.12, x1, zf + 0.15);
  line(x0 - tick, zf + tick, x0 + tick, zf - tick);
  line(x1 - tick, zf + tick, x1 + tick, zf - tick);
  // Profondità, a destra del pezzo.
  const xr = x1 + off;
  line(xr, z0, xr, z1);
  line(x1 + 0.12, z0, xr + 0.15, z0);
  line(x1 + 0.12, z1, xr + 0.15, z1);
  line(xr - tick, z0 + tick, xr + tick, z0 - tick);
  line(xr - tick, z1 + tick, xr + tick, z1 - tick);
  return flat;
}

export async function createServicesScene(container: HTMLElement): Promise<ServicesScene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const lookAt = new THREE.Vector3(0, 1.9, 0);

  const world = new THREE.Group();
  scene.add(world);
  // I tre stati vivono qui: nello zoom indietro il gruppo si rimpicciolisce e diventa la prima stazione.
  const lineGroup = new THREE.Group();
  world.add(lineGroup);

  // Pavimento a punti: dà profondità senza disegnare una superficie.
  const dots: number[] = [];
  for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) dots.push(x * 0.8, -0.01, z * 0.8);
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
  const dotMat = new THREE.PointsMaterial({ color: EDGE, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0 });
  world.add(new THREE.Points(dotGeo, dotMat));

  // Tutti i moduli in un'unica InstancedMesh; aLit separa grezzo, sfondo e protagonista.
  const blockGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const lit = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
  blockGeo.setAttribute("aLit", lit);
  const blockMat = blockMaterial({ face: FACE, raw: RAW, edge: EDGE, boost: 2.6 });
  const blocks = new THREE.InstancedMesh(blockGeo, blockMat, N);
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // I moduli partono a scala zero: il calcolo dei limiti per il culling li nasconderebbe.
  blocks.frustumCulled = false;
  lineGroup.add(blocks);

  const lineMat = (o: number) => new THREE.LineBasicMaterial({ color: EDGE, transparent: true, opacity: o });

  // Advisory: piani di livello e connessioni verticali tra fondazione, servizi e applicazioni.
  const platformLines = new THREE.Group();
  const frameMat = lineMat(0);
  const midFrame = rectLine(5.4, 5.4, frameMat);
  midFrame.position.y = MID.y - 0.02;
  const topFrame = rectLine(3.6, 3.6, frameMat);
  topFrame.position.y = TOP.y - 0.02;
  const linkMat = lineMat(0);
  const links: number[] = [];
  // Connessioni percorse dagli impulsi: x, z e quota d'arrivo.
  const routes: [number, number, number][] = [];
  for (let m = 0; m < 16; m++) {
    const x = ((m % 4) - 1.5) * MID.pitch;
    const z = (Math.floor(m / 4) - 1.5) * MID.pitch;
    links.push(x, 0.3, z, x, MID.y, z);
    if (m % 5 === 0) routes.push([x, z, MID.y]);
  }
  for (let t = 0; t < 4; t++) {
    const x = ((t % 2) * 2 - 1) * TOP.offset;
    const z = (Math.floor(t / 2) * 2 - 1) * TOP.offset;
    links.push(x, 0.3, z, x, TOP.y, z);
    routes.push([x, z, TOP.y]);
  }
  platformLines.add(midFrame, topFrame, segments(links, linkMat));
  lineGroup.add(platformLines);

  // Studio: contorno dell'incavo, lo stesso contorno sotto il pezzo, guide verticali e quote.
  const outline = holeOutline();
  const cavityMat = lineMat(0);
  const cavity = new THREE.Group();
  cavity.add(segments(outline.flat, cavityMat), segments(dimensions(), cavityMat));
  cavity.position.y = 0.31;
  const pieceMat = lineMat(0);
  const pieceLines = segments(outline.flat, pieceMat);
  const guideMat = lineMat(0);
  const guides = segments(
    outline.corners.flatMap(([x, z]) => [x, 0, z, x, 1, z]),
    guideMat,
  );
  guides.position.y = 0.31;
  lineGroup.add(cavity, pieceLines, guides);

  // Suite: la lama di controllo del portale che scorre su e giù sui nastri.
  const laserMat = lineMat(0);
  const laser = segments([0, 0, -GATE_Z, 0, 0, GATE_Z], laserMat);
  lineGroup.add(laser);

  // Impulsi che salgono lungo le connessioni della piattaforma.
  const PULSES = 8;
  const pulseMat = new THREE.MeshBasicMaterial({ color: EDGE, transparent: true, opacity: 0 });
  const pulseGeo = new THREE.SphereGeometry(0.07, 12, 10);
  const pulses = Array.from({ length: PULSES }, () => {
    const m = new THREE.Mesh(pulseGeo, pulseMat.clone());
    lineGroup.add(m);
    return m;
  });

  // 01 Ascolto: due onde che partono dal centro del mercato.
  const rippleMat = lineMat(0);
  const ripples = [0, 1].map(() => {
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 97 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a), 0.03, Math.sin(a));
        }),
      ),
      rippleMat.clone(),
    );
    lineGroup.add(ring);
    return ring;
  });

  // Motore: le altre tre stazioni in miniatura, l'anello e l'arco che avanza a ogni tappa.
  const engine = new THREE.Group();
  world.add(engine);
  const stations = [0, 1, 2, 3].map(
    (k) => new THREE.Vector3(Math.cos(stationAngle(k)) * RING_R, 0, Math.sin(stationAngle(k)) * RING_R),
  );
  const miniPatterns = makePoses(18);
  const miniBuild = makePoses(18);
  const miniGrow = makePoses(12);
  patterns(miniPatterns);
  build(miniBuild);
  // Stazione dell'anello per ogni miniatura: la prima è la linea trasformata.
  const miniLists = [
    { station: 1, list: miniPatterns },
    { station: 2, list: miniBuild },
    { station: 3, list: miniGrow },
  ];
  const ENGINE_N = miniLists.reduce((sum, { list }) => sum + list.length, 0);
  const toStation = (k: number, x: number, y: number, z: number) =>
    new THREE.Vector3(x, y, z).multiplyScalar(MINI * STATION_SCALE[k]).add(stations[k]);

  // 02: la linea che attraversa lo stesso piano in tutte le aziende.
  const needMat = lineMat(0);
  const needY = NEED * FLOOR + (FLOOR - 0.04) / 2;
  const needPts = [
    toStation(1, PATTERN[0][0] - 1, needY, PATTERN[0][1]),
    ...PATTERN.map(([x, z]) => toStation(1, x, needY, z)),
    toStation(1, PATTERN[3][0] + 1, needY, PATTERN[3][1]),
  ];
  engine.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(needPts), needMat));

  // 04: i supporti collegati alla base della torre.
  const supportMat = lineMat(0);
  engine.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(
        SUPPORTS.flatMap(([x, z]) => [toStation(3, x, 0.25, z), toStation(3, 0, 0.1, 0)]),
      ),
      supportMat,
    ),
  );
  const engineGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const engineLit = new THREE.InstancedBufferAttribute(new Float32Array(ENGINE_N), 1);
  engineGeo.setAttribute("aLit", engineLit);
  const engineBlocks = new THREE.InstancedMesh(engineGeo, blockMat, ENGINE_N);
  engineBlocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  engineBlocks.frustumCulled = false;
  engine.add(engineBlocks);

  const ringPoints = (count: number) =>
    Array.from({ length: count + 1 }, (_, i) => {
      const a = PHI1 + (i / count) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * RING_R, 0.02, Math.sin(a) * RING_R);
    });
  const ringMat = lineMat(0);
  const arcMat = lineMat(0);
  const ARC_STEPS = 160;
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints(ARC_STEPS)), arcMat);
  engine.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints(160)), ringMat), arc);

  // Impulsi che girano sull'anello: ogni progetto alimenta il successivo.
  const ringPulses = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), pulseMat.clone());
    engine.add(m);
    return m;
  });
  // Impulso staccato dall'anello per diventare la goccia (-1 = nessuno).
  let released = -1;
  const projected = new THREE.Vector3();
  const screenOf = (m: THREE.Object3D) => {
    m.getWorldPosition(projected).project(camera);
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + ((projected.x + 1) / 2) * rect.width, y: rect.top + ((1 - projected.y) / 2) * rect.height };
  };
  const lowestPulse = () => {
    let best = 0;
    let bestY = -Infinity;
    ringPulses.forEach((m, j) => {
      const y = screenOf(m).y;
      if (y > bestY) {
        bestY = y;
        best = j;
      }
    });
    return best;
  };

  // Passaggio dal buio al chiaro: tutti i colori della scena seguono lo stesso valore.
  const colors = {
    face: new THREE.Color(FACE),
    paper: new THREE.Color(PAPER),
    raw: new THREE.Color(RAW),
    bg: new THREE.Color(BG),
    edge: new THREE.Color(EDGE),
    ink: new THREE.Color(INK),
  };
  const inkMats: { color: THREE.Color }[] = [
    dotMat,
    frameMat,
    linkMat,
    cavityMat,
    pieceMat,
    guideMat,
    laserMat,
    ringMat,
    arcMat,
    needMat,
    supportMat,
    ...ripples.map((m) => m.material as THREE.LineBasicMaterial),
    ...pulses.map((m) => m.material as THREE.MeshBasicMaterial),
    ...ringPulses.map((m) => m.material as THREE.MeshBasicMaterial),
  ];

  const poses = layouts.map(() => makePoses());
  // Ritardo di ogni modulo nei passaggi: un'onda da sinistra in basso a destra in alto.
  const delays = layouts.map((layout, st) => {
    layout(0, poses[st]);
    const keys = poses[st].map(({ p }) => p.x * 0.5 + p.y * 0.8 + p.z * 0.3);
    const min = Math.min(...keys);
    const max = Math.max(...keys);
    return keys.map((v) => ((v - min) / (max - min || 1)) * 0.3);
  });
  const marketPoses = makePoses();
  market(0, marketPoses);
  const marketDelays = marketPoses.map(({ p }) => clamp01((p.x + 4) / 8) * 0.3);

  let goal = 0;
  let state = 0;
  let active = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const tmpP = new THREE.Vector3();
  const tmpS = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  let viewW = 1;
  let viewH = 1;
  /** Altezza dell'inquadratura: lo schermo a barre aperte. La tela può essere più alta e prosegue sotto. */
  let frameH = 1;
  let narrow = false;
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    viewW = w;
    viewH = h;
    frameH = Math.min(h, smallViewportHeight());
    narrow = w < 1024;
    renderer.setSize(w, h, false);
    blockMat.uniforms.uLine.value = 1.2 * renderer.getPixelRatio();
    camera.aspect = w / frameH;
    // La scena sta a destra su desktop, in alto su schermi stretti: il testo ha il suo spazio.
    if (w >= 1024) camera.setViewOffset(w, frameH, -w * 0.2, 0, w, h);
    else camera.setViewOffset(w, frameH, 0, frameH * 0.2, w, h);
    camera.updateProjectionMatrix();
    baseDist = 26 * Math.max(1, 1.3 / camera.aspect);
  };
  let baseDist = 26;
  const ELEV = THREE.MathUtils.degToRad(26);
  /** Su schermi stretti, distanza dalla stazione in primo piano nel motore e inclinazione più bassa. */
  const NARROW_DIST = 32;
  const NARROW_ELEV = THREE.MathUtils.degToRad(15);
  /** Spazio tra titolo e tappe per cui è tarata NARROW_DIST (402×874): con meno spazio la camera si allontana. */
  const BAND_REF = 257;
  let band: { top: number; bottom: number } | null = null;
  const placeCamera = (zoom: number) => {
    // Nello zoom indietro la camera si allontana e guarda più in basso, verso il centro dell'anello.
    let dist = baseDist * (1 + 0.6 * zoom);
    let elev = ELEV;
    lookAt.y = 1.9 - 1.1 * zoom;
    lookAt.z = 0;
    if (narrow) {
      // Su schermi stretti l'anello intero sarebbe minuscolo: la camera va sulla stazione davanti,
      // che resta grande al centro dello spazio tra titolo e tappe; l'anello, più schiacciato, esce dai lati.
      const fit = band ? Math.min(1, Math.max(0.45, (band.bottom - band.top) / BAND_REF)) : 1;
      const offset = band ? frameH / 2 - (band.top + band.bottom) / 2 : frameH * 0.1;
      dist = baseDist + (NARROW_DIST / fit - baseDist) * zoom;
      elev = ELEV + (NARROW_ELEV - ELEV) * zoom;
      lookAt.z = RING_R * zoom;
      camera.setViewOffset(viewW, frameH, 0, frameH * 0.2 + (offset - frameH * 0.2) * zoom, viewW, viewH);
      camera.updateProjectionMatrix();
    }
    camera.position.set(0, lookAt.y + Math.sin(elev) * dist, lookAt.z + Math.cos(elev) * dist);
    camera.lookAt(lookAt);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const update = (time: number) => {
    const full = state;
    // I moduli della linea si fermano allo stato 3; oltre lavorano zoom, colori e anello.
    const s = Math.min(full, 3);
    const zoom = easeInOut(range(full, 3, 4));
    // Stessa finestra del fondo del pannello in GroupStage (416–436 svh): il grigio intermedio dura poco.
    const light = smooth(3.35, 3.7, full);
    const step = Math.min(3, Math.max(0, full - 4));
    const focus = (k: number) => 0.3 + 0.7 * clamp01(1 - Math.abs(step - k));
    const lineFocus = 1 + (focus(0) - 1) * zoom;
    // Mentre scivola sull'anello, la linea di produzione diventa il mercato da ascoltare.
    const toMarket = range(full, 3.35, 3.95);
    if (toMarket > 0) market(time, marketPoses);
    const from = s <= 1 ? 0 : Math.min(Math.floor(s) - 1, 1);
    const to = s <= 1 ? 0 : from + 1;
    const local = s <= 1 ? 0 : s - 1 - from;
    layouts[from](time, poses[from]);
    if (to !== from) layouts[to](time, poses[to]);

    for (let k = 0; k < N; k++) {
      const a = poses[from][k];
      let litValue = a.lit;
      if (s <= 1) {
        // Montaggio: fondazione, poi servizi, poi applicazioni; ogni modulo scende e si apre.
        const d = (k / N) * 0.45;
        const t = easeOut(range(s, d, d + 0.5));
        tmpP.copy(a.p);
        tmpP.y += (1 - t) * 3;
        tmpS.copy(a.s).multiplyScalar(t);
      } else {
        const b = poses[to][k];
        const d = delays[to][k];
        const t = easeInOut(range(local, d, d + 0.7));
        tmpP.lerpVectors(a.p, b.p, t);
        tmpS.lerpVectors(a.s, b.s, t);
        // Durante il passaggio i moduli si sollevano un poco: si vede che si spostano.
        tmpP.y += Math.sin(t * Math.PI) * 0.8;
        litValue = a.lit + (b.lit - a.lit) * t;
      }
      if (toMarket > 0) {
        const m = marketPoses[k];
        const t = easeInOut(range(toMarket, marketDelays[k], marketDelays[k] + 0.7));
        tmpP.lerp(m.p, t);
        tmpS.lerp(m.s, t);
        tmpP.y += Math.sin(t * Math.PI) * 0.8;
        litValue += (m.lit - litValue) * t;
      }
      matrix.makeScale(Math.max(tmpS.x, 1e-4), Math.max(tmpS.y, 1e-4), Math.max(tmpS.z, 1e-4));
      matrix.setPosition(tmpP);
      blocks.setMatrixAt(k, matrix);
      lit.setX(k, litValue * lineFocus);
    }
    blocks.instanceMatrix.needsUpdate = true;
    lit.needsUpdate = true;

    // Zoom indietro: la linea si rimpicciolisce e scivola al suo posto sull'anello.
    lineGroup.scale.setScalar(1 + (MINI - 1) * zoom);
    lineGroup.position.copy(stations[0]).multiplyScalar(zoom);

    // Onde d'ascolto sul mercato, solo a trasformazione avvenuta.
    const listen = range(full, 3.8, 4);
    ripples.forEach((ring, i) => {
      const r = rippleRadius(time, i);
      ring.scale.setScalar(r);
      ring.visible = listen > 0.001;
      (ring.material as THREE.LineBasicMaterial).opacity = 0.9 * listen * focus(0) * (1 - (r - 0.6) / 5);
    });

    engine.visible = zoom > 0.001;
    if (engine.visible) {
      grow(time, miniGrow);
      let n = 0;
      miniLists.forEach(({ station, list }, order) => {
        // Le stazioni salgono una dopo l'altra mentre la camera si allontana.
        const appear = easeOut(range(full, 3.3 + order * 0.15, 3.75 + order * 0.15));
        const f = focus(station);
        const scale = MINI * STATION_SCALE[station];
        list.forEach((pose) => {
          tmpP.copy(pose.p).multiplyScalar(scale).add(stations[station]);
          tmpP.y += (1 - appear) * 1.5;
          tmpS.copy(pose.s).multiplyScalar(scale * appear);
          matrix.makeScale(Math.max(tmpS.x, 1e-4), Math.max(tmpS.y, 1e-4), Math.max(tmpS.z, 1e-4));
          matrix.setPosition(tmpP);
          engineBlocks.setMatrixAt(n, matrix);
          engineLit.setX(n, pose.lit * f);
          n++;
        });
      });
      engineBlocks.instanceMatrix.needsUpdate = true;
      engineLit.needsUpdate = true;

      ringMat.opacity = 0.3 * zoom;
      needMat.opacity = zoom * focus(1);
      supportMat.opacity = 0.9 * zoom * focus(3);
      // L'arco segue le tappe e all'ultima chiude il giro.
      const frac = Math.min((full - 4) / 4, 0.75) + 0.25 * range(full, 6.5, 7);
      arc.geometry.setDrawRange(0, Math.max(0, Math.round(frac * ARC_STEPS) + 1));
      arcMat.opacity = 0.9 * zoom;
      ringPulses.forEach((m, j) => {
        const a = PHI1 + ((time * 0.06 + j / ringPulses.length) % 1) * Math.PI * 2;
        m.position.set(Math.cos(a) * RING_R, 0.1, Math.sin(a) * RING_R);
        (m.material as THREE.MeshBasicMaterial).opacity = j === released ? 0 : 0.85 * zoom;
      });
    }

    blockMat.uniforms.uFace.value.lerpColors(colors.face, colors.paper, light);
    blockMat.uniforms.uRaw.value.lerpColors(colors.raw, colors.bg, light);
    blockMat.uniforms.uEdge.value.lerpColors(colors.edge, colors.ink, light);
    blockMat.uniforms.uBoost.value = 2.6 - 3.5 * light;
    inkMats.forEach((m) => m.color.lerpColors(colors.edge, colors.ink, light));

    const wA = s <= 1 ? range(s, 0.55, 1) : 1 - range(s, 1, 1.45);
    const wB = range(s, 1.55, 2) * (1 - range(s, 2, 2.45));
    const wC = range(s, 2.55, 3);

    dotMat.opacity = 0.14 * range(s, 0, 0.4) * (1 - 0.6 * zoom);

    platformLines.visible = wA > 0.001;
    frameMat.opacity = 0.22 * wA;
    linkMat.opacity = 0.2 * wA;

    const hover = hoverAt(time);
    const showB = wB > 0.001;
    cavity.visible = pieceLines.visible = guides.visible = showB;
    cavityMat.opacity = 0.75 * wB;
    pieceMat.opacity = 0.6 * wB;
    guideMat.opacity = 0.22 * wB;
    pieceLines.position.y = hover;
    guides.scale.y = hover - 0.31;

    const wLaser = wC * (1 - range(full, 3.3, 3.5));
    laser.visible = wLaser > 0.001;
    laserMat.opacity = 0.85 * wLaser;
    laser.position.y = 0.2 + ((Math.sin(time * 2.2) + 1) / 2) * 0.55;

    pulses.forEach((m, j) => {
      const phase = (time * 0.4 + j / PULSES) % 1;
      const [x, z, top] = routes[j % routes.length];
      m.position.set(x, 0.3 + phase * (top - 0.3), z);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = wA * Math.sin(phase * Math.PI);
      m.visible = mat.opacity > 0.01;
    });

    // Rotazione lenta: la scena vive anche da ferma, e gira un poco a ogni stato.
    // Nel motore l'anello ruota per portare davanti la stazione della tappa attiva.
    const lineTurn = -0.55 + s * 0.32;
    const firstStation = PHI1 - Math.PI / 2;
    const turn =
      full <= 3
        ? lineTurn
        : full <= 4
          ? lineTurn + (firstStation - lineTurn) * zoom
          : firstStation + (full - 4) * (Math.PI / 2);
    world.rotation.y = turn + Math.sin(time * 0.25) * 0.06;

    placeCamera(zoom);
    renderer.render(scene, camera);
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!active) return;
    state += (goal - state) * 0.14;
    if (Math.abs(goal - state) < 0.0005) state = goal;
    update(clock.getElapsedTime());
  };
  raf = requestAnimationFrame(loop);

  return {
    setState(s: number) {
      goal = Math.min(7, Math.max(0, s));
    },
    setActive(on: boolean) {
      active = on;
    },
    dropPoint() {
      if (state < 6.9) return null;
      return screenOf(ringPulses[released >= 0 ? released : lowestPulse()]);
    },
    releaseDot(on: boolean) {
      if (on && released < 0) released = lowestPulse();
      if (!on) released = -1;
    },
    setBand(top: number, bottom: number) {
      band = { top, bottom };
    },
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => m.dispose());
      });
      blocks.dispose();
      engineBlocks.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
