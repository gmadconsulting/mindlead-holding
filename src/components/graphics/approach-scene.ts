import * as THREE from "three";
import { blockMaterial } from "./block-material";
import { blockDrop, type BlockSource } from "@/lib/block-drop";
import { smallViewportHeight } from "@/lib/viewport";

/**
 * Scena 3D della sezione "Our companies": quattro terrazze a quote crescenti,
 * una per azienda, collegate da scale. La camera sale di livello in livello.
 * 1 = Suite: tante aziende uguali dello stesso settore, un solo prodotto che le aggiorna tutte.
 * 2 = Studio: una PMI, un pezzo su misura che scende e si incastra nel suo edificio.
 * 3 = Advisory: un grande gruppo, edifici collegati e i nostri sistemi in orbita.
 * 4 = Partners: un mercato con un lotto vuoto; gruppo e partner fondano lì la nuova azienda,
 *     e un'azienda vicina entra nel gruppo (acquisizione).
 * Lo stato (0–4) arriva dallo scroll; 0 è la vista d'insieme.
 */

export type ApproachScene = {
  setState(s: number): void;
  setActive(on: boolean): void;
  /** Spazio libero tra titolo e testo dei livelli, in px dall'alto della tela: usato solo su schermi stretti. */
  setBand(top: number, bottom: number): void;
  dispose(): void;
};

const PAPER = 0xe9e8e4;
const BG = 0xfafaf9;
const INK = 0x0e0e0d;
const FLOOR = 0.36;
const MAX = 160;

/** Terrazze: passo orizzontale, salto di quota, lato della lastra. */
const STEP_X = 9.5;
const STEP_Y = 3;
const SLAB = 7.6;
const levelCenter = (i: number) => new THREE.Vector3(i * STEP_X, i * STEP_Y, 0);

/** Suite: griglia di aziende uguali e quota del prodotto che le serve. */
const SUITE = { cols: 4, rows: 3, px: 1.6, pz: 1.7, floors: 2, productY: 3.1 };
const suiteBuilding = (b: number) =>
  [((b % SUITE.cols) - (SUITE.cols - 1) / 2) * SUITE.px, (Math.floor(b / SUITE.cols) - 1) * SUITE.pz] as const;

/** Studio: edificio 3 × 2 celle, una cella ha solo il piano terra e aspetta il pezzo su misura. */
const STUDIO = { cols: 3, rows: 2, pitch: 1.05, floors: 3, notch: [2, 1] as const };
const studioCell = (ci: number, cj: number) => [(ci - 1) * STUDIO.pitch, (cj - 0.5) * STUDIO.pitch] as const;

/** Advisory: ali del complesso (x, z, larghezza, profondità, piani) e orbita dei sistemi. */
const WINGS: [number, number, number, number, number][] = [
  [-1.2, -0.8, 2.2, 2.2, 9],
  [1.3, -0.9, 1.8, 1.6, 6],
  [-1.0, 1.5, 1.6, 1.4, 5],
  [1.4, 1.2, 2.0, 1.8, 7],
];
const ORBIT = { r: 3.4, y: 1.6, count: 8 };

/** Partners: aziende del mercato attorno al lotto vuoto; una entra nel gruppo. */
const MARKET: [number, number, number, number, number][] = [
  [-2.2, -2.0, 1.2, 1.2, 3],
  [0, -2.4, 1.4, 1.0, 4],
  [2.3, -1.9, 1.0, 1.2, 2],
  [-2.4, 0.6, 1.0, 1.4, 5],
  [2.4, 0.8, 1.2, 1.0, 3],
  [0, 2.5, 1.6, 1.0, 2],
];
const ACQUIRED = 4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const smooth = (a: number, b: number, v: number) => {
  const t = range(v, a, b);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export async function createApproachScene(container: HTMLElement): Promise<ApproachScene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);

  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const lit = new THREE.InstancedBufferAttribute(new Float32Array(MAX), 1);
  geo.setAttribute("aLit", lit);
  const mat = blockMaterial({ face: PAPER, raw: BG, edge: INK, boost: -0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const centers = [0, 1, 2, 3].map(levelCenter);
  const lineMats = centers.map(() => new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.4 }));
  const at = (i: number, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).add(centers[i]);
  const addSegments = (points: THREE.Vector3[], material: THREE.Material) => {
    const object = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
    scene.add(object);
    return object;
  };

  // Suite: dal prodotto partono le linee verso il tetto di ogni azienda.
  const suiteRoofs = Array.from({ length: SUITE.cols * SUITE.rows }, (_, b) => {
    const [x, z] = suiteBuilding(b);
    return at(0, x, SUITE.floors * FLOOR, z);
  });
  const product = at(0, 0, SUITE.productY, 0);
  addSegments(suiteRoofs.flatMap((roof) => [product, roof]), lineMats[0]);

  // Studio: guide verticali sopra l'incavo, dove scende il pezzo.
  {
    const [x, z] = studioCell(STUDIO.notch[0], STUDIO.notch[1]);
    const h = STUDIO.pitch / 2;
    const corners = [
      [x - h, z - h],
      [x + h, z - h],
      [x + h, z + h],
      [x - h, z + h],
    ];
    addSegments(
      corners.flatMap(([cx, cz]) => [at(1, cx, FLOOR, cz), at(1, cx, FLOOR * 3 + 1.6, cz)]),
      lineMats[1],
    );
  }

  // Advisory: l'orbita dei sistemi e le integrazioni tra le ali a metà altezza.
  {
    const ring = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return at(2, Math.cos(a) * ORBIT.r, ORBIT.y + 0.25, Math.sin(a) * ORBIT.r);
    });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), lineMats[2]));
    const wingAt = (w: number) => at(2, WINGS[w][0], 1.3, WINGS[w][1]);
    addSegments([wingAt(0), wingAt(1), wingAt(0), wingAt(2), wingAt(1), wingAt(3), wingAt(2), wingAt(3)], lineMats[2]);
  }

  // Partners: il lotto vuoto tratteggiato e il legame con l'azienda acquisita.
  const plotMat = new THREE.LineDashedMaterial({ color: INK, transparent: true, opacity: 0.6, dashSize: 0.18, gapSize: 0.14 });
  {
    const h = 1.15;
    const plot = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        [
          [-h, -h],
          [h, -h],
          [h, h],
          [-h, h],
          [-h, -h],
        ].map(([x, z]) => at(3, x, 0.02, z)),
      ),
      plotMat,
    );
    plot.computeLineDistances();
    scene.add(plot);
  }
  const acquireMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0 });
  {
    const [x, z, , , floors] = MARKET[ACQUIRED];
    addSegments([at(3, x, floors * FLOOR, z), at(3, 0, 3 * FLOOR + 0.2, 0)], acquireMat);
  }

  // Aggiornamenti che scendono dal prodotto Suite verso ogni azienda.
  const pulseGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const pulses = suiteRoofs.map(() => {
    const m = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: INK, transparent: true }));
    scene.add(m);
    return m;
  });

  let goal = 0;
  let state = 0;
  let active = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const matrix = new THREE.Matrix4();
  const origin = new THREE.Vector3();
  const target = new THREE.Vector3();
  let n = 0;
  let levelLit = 1;
  // Ultimo piano dell'azienda acquisita: si stacca e cade nella sezione dopo (vedi PlatformStage).
  let released = false;
  // Valore aLit attuale del piano: serve a dare al blocco staccato gli stessi colori.
  let acquiredLit = 0.7;

  const box = (x: number, y: number, z: number, sx: number, sy: number, sz: number, l: number) => {
    matrix.makeScale(Math.max(sx, 1e-4), Math.max(sy, 1e-4), Math.max(sz, 1e-4));
    matrix.setPosition(origin.x + x, origin.y + y, origin.z + z);
    mesh.setMatrixAt(n, matrix);
    lit.setX(n, l * levelLit);
    n++;
  };

  let baseDist = 22;
  let viewW = 1;
  let viewH = 1;
  /** Altezza dell'inquadratura: lo schermo a barre aperte. La tela può essere più alta e prosegue sotto. */
  let frameH = 1;
  const resize = () => {
    viewW = container.clientWidth || 1;
    viewH = container.clientHeight || 1;
    frameH = Math.min(viewH, smallViewportHeight());
    renderer.setSize(viewW, viewH, false);
    mat.uniforms.uLine.value = 1.2 * renderer.getPixelRatio();
    camera.aspect = viewW / frameH;
    camera.updateProjectionMatrix();
    baseDist = 22 * Math.max(1, 1.3 / camera.aspect);
  };
  /**
   * Inquadratura: nella vista d'insieme (k = 0) la scalinata è centrata, un po' sotto il titolo;
   * sui livelli (k = 1) sta a destra su desktop e, su schermi stretti, al centro dello spazio tra titolo e testo.
   */
  const frame = (k: number) => {
    const desktop = viewW >= 1024;
    const x = desktop ? -viewW * 0.2 * k : 0;
    // Il centro della terrazza sta poco sopra il centro dello spazio libero: sopra ci sono gli edifici.
    const level = band ? frameH / 2 - (band.top + band.bottom) / 2 + (band.bottom - band.top) * 0.07 : frameH * 0.09;
    const y = desktop ? lerp(-frameH * 0.07, 0, k) : lerp(-frameH * 0.02, level, k);
    camera.setViewOffset(viewW, frameH, x, y, viewW, viewH);
  };
  /** Spazio tra titolo e testo dei livelli per cui è tarata la distanza (402×874): con meno spazio la camera si allontana. */
  const BAND_REF = 325;
  let band: { top: number; bottom: number } | null = null;
  const levelFit = () =>
    band && viewW < 1024 ? Math.min(1, Math.max(0.45, (band.bottom - band.top) / BAND_REF)) : 1;
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const EL = THREE.MathUtils.degToRad(24);
  const overview = new THREE.Vector3(1.5 * STEP_X + 1, 1.5 * STEP_Y + 1.3, 0);
  const levelTarget = (i: number) => centers[i].clone().add(new THREE.Vector3(0, 1.3, 0));

  const update = (time: number) => {
    const s = state;
    // Messa a fuoco: nella vista d'insieme tutte le terrazze sono piene, poi solo quella attiva.
    const focus = (i: number) => {
      const near = 0.35 + 0.65 * clamp01(1 - Math.abs(s - 1 - i));
      return s < 1 ? lerp(1, i === 0 ? 1 : 0.35, s) : near;
    };
    n = 0;

    // Terrazze e scale.
    origin.set(0, 0, 0);
    levelLit = 1;
    centers.forEach((c, i) => {
      box(c.x, c.y - 0.4, c.z, SLAB, 0.4, SLAB, 0.45 * (0.6 + 0.4 * focus(i)));
      if (i < 3) {
        const gap = STEP_X - SLAB;
        for (let k = 0; k < 5; k++) {
          const top = c.y + ((k + 1) * STEP_Y) / 6;
          box(c.x + SLAB / 2 + (k + 0.5) * (gap / 5), top - 0.15, SLAB / 2 - 1, gap / 5 - 0.05, 0.15, 1.6, 0.4);
        }
      }
    });

    // 1 Suite: aziende uguali, un prodotto scuro sopra che le serve tutte.
    origin.copy(centers[0]);
    levelLit = focus(0);
    for (let b = 0; b < SUITE.cols * SUITE.rows; b++) {
      const [x, z] = suiteBuilding(b);
      for (let f = 0; f < SUITE.floors; f++) box(x, f * FLOOR, z, 0.95, FLOOR - 0.04, 0.95, 0.8);
    }
    box(0, SUITE.productY + Math.sin(time * 1.2) * 0.06, 0, 1.6, 0.5, 1.6, 1.9);
    pulses.forEach((m, j) => {
      const phase = (time * 0.35 + j / pulses.length) % 1;
      m.position.lerpVectors(product, suiteRoofs[j], phase);
      const material = m.material as THREE.MeshBasicMaterial;
      material.opacity = Math.sin(phase * Math.PI) * focus(0);
      m.visible = material.opacity > 0.02;
    });

    // 2 Studio: l'edificio con l'incavo e il pezzo su misura che scende, si incastra e risale.
    origin.copy(centers[1]);
    levelLit = focus(1);
    const [nx, nz] = STUDIO.notch;
    for (let cj = 0; cj < STUDIO.rows; cj++) {
      for (let ci = 0; ci < STUDIO.cols; ci++) {
        const [x, z] = studioCell(ci, cj);
        const floors = ci === nx && cj === nz ? 1 : STUDIO.floors;
        for (let f = 0; f < floors; f++) box(x, f * FLOOR, z, 1, FLOOR - 0.04, 1, 0.8);
      }
    }
    {
      const [x, z] = studioCell(nx, nz);
      const lift = Math.max(0, Math.sin(time * 1.1)) * 1.4;
      for (let f = 1; f < STUDIO.floors; f++) box(x, f * FLOOR + lift, z, 1, FLOOR - 0.04, 1, 1.9);
    }

    // 3 Advisory: il complesso a più ali e i sistemi che gli girano attorno.
    origin.copy(centers[2]);
    levelLit = focus(2);
    WINGS.forEach(([x, z, w, d, floors]) => {
      for (let f = 0; f < floors; f++) box(x, f * FLOOR, z, w, FLOOR - 0.04, d, 0.8);
    });
    for (let j = 0; j < ORBIT.count; j++) {
      const a = time * 0.25 + (j / ORBIT.count) * Math.PI * 2;
      box(Math.cos(a) * ORBIT.r, ORBIT.y, Math.sin(a) * ORBIT.r, 0.5, 0.5, 0.5, 1.9);
    }

    // 4 Partners: gruppo (scuro) e partner (grigio) arrivano dai due lati, un tetto li unisce;
    // intanto un'azienda vicina si collega ed entra nel gruppo.
    origin.copy(centers[3]);
    levelLit = focus(3);
    const p = (time * 0.12) % 1;
    const show = smooth(0, 0.08, p) * (1 - smooth(0.9, 1, p));
    const slide = easeInOut(range(p, 0.04, 0.4));
    const roof = smooth(0.42, 0.52, p) * show;
    const acquired = smooth(0.55, 0.65, p) * show;
    MARKET.forEach(([x, z, w, d, floors], b) => {
      const l = b === ACQUIRED ? 0.8 + 1.1 * acquired : 0.7;
      if (b === ACQUIRED) acquiredLit = l * levelLit;
      const shown = b === ACQUIRED && released ? floors - 1 : floors;
      for (let f = 0; f < shown; f++) box(x, f * FLOOR, z, w, FLOOR - 0.04, d, l);
    });
    // Scendono in diagonale dall'alto: partendo dai lati a terra attraverserebbero gli edifici vicini.
    const drop = (1 - slide) * 2.2;
    for (let f = 0; f < 3; f++) {
      box(lerp(-1.7, -0.5, slide), f * FLOOR + drop, 0, 0.95 * show, (FLOOR - 0.04) * show, 1.9 * show, 1.9);
      box(lerp(1.7, 0.5, slide), f * FLOOR + drop, 0, 0.95 * show, (FLOOR - 0.04) * show, 1.9 * show, 1.35);
    }
    box(0, 3 * FLOOR, 0, 2.1 * roof, 0.2 * roof, 2.1 * roof, 1);
    acquireMat.opacity = 0.7 * acquired * focus(3);

    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    lit.needsUpdate = true;
    lineMats.forEach((m, i) => (m.opacity = 0.45 * focus(i)));
    plotMat.opacity = 0.7 * focus(3);

    // Camera: dalla vista d'insieme alla prima terrazza, poi su di livello in livello.
    let dist: number;
    frame(easeInOut(clamp01(s)));
    if (s < 1) {
      const t = easeInOut(s);
      target.lerpVectors(overview, levelTarget(0), t);
      // Su schermi stretti la vista d'insieme si avvicina: la scalinata riempie la larghezza.
      dist = lerp(baseDist * (viewW >= 1024 ? 2.8 : 2.45), baseDist / levelFit(), t);
    } else {
      const i = Math.min(Math.floor(s - 1), 2);
      const f = easeInOut(clamp01(s - 1 - i));
      target.lerpVectors(levelTarget(i), levelTarget(i + 1), f);
      // Durante la salita la camera si allontana un poco: si vede il cambio di livello.
      dist = (baseDist / levelFit()) * (1 + 0.35 * Math.sin(f * Math.PI));
    }
    const az = 0.42 + Math.sin(time * 0.2) * 0.03;
    camera.position.set(
      target.x + Math.sin(az) * Math.cos(EL) * dist,
      target.y + Math.sin(EL) * dist,
      target.z + Math.cos(az) * Math.cos(EL) * dist,
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!active) return;
    state += (goal - state) * 0.12;
    if (Math.abs(goal - state) < 0.0005) state = goal;
    update(clock.getElapsedTime());
  };
  raf = requestAnimationFrame(loop);

  // Rettangolo a schermo del piano che cade: gli otto spigoli proiettati con la camera attuale.
  const corner = new THREE.Vector3();
  const paperColor = new THREE.Color(PAPER);
  const rawColor = new THREE.Color(BG);
  const LIGHT = new THREE.Vector3(-0.5, 1, 0.6).normalize();
  const FACE_LIGHT = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)].map((n) =>
    Math.max(0, n.dot(LIGHT)),
  );
  const source: BlockSource = {
    blockRect() {
      const [x, z, w, d, floors] = MARKET[ACQUIRED];
      const view = canvas.getBoundingClientRect();
      if (view.width === 0) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let k = 0; k < 8; k++) {
        corner
          .set(x + (k & 1 ? w : -w) / 2, (floors - 1) * FLOOR + (k & 2 ? FLOOR - 0.04 : 0), z + (k & 4 ? d : -d) / 2)
          .add(centers[3])
          .project(camera);
        const sx = view.left + ((corner.x + 1) / 2) * view.width;
        const sy = view.top + ((1 - corner.y) / 2) * view.height;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    },
    blockColors() {
      // Stessa formula del fragment shader di blockMaterial, in spazio lineare, per le normali
      // delle facce viste dalla camera: sopra (+y), fronte (+z), lato destro (+x).
      const lit = acquiredLit;
      const base = clamp01(lit);
      const shade = 1 - Math.max(lit - 1, 0) * 0.9;
      return FACE_LIGHT.map((light) =>
        rawColor
          .clone()
          .lerp(paperColor.clone().multiplyScalar(0.75 + 0.6 * light), base)
          .multiplyScalar(shade)
          .getStyle(),
      ) as [string, string, string];
    },
    releaseBlock(on: boolean) {
      if (released === on) return;
      released = on;
      update(clock.getElapsedTime());
    },
  };
  blockDrop.source = source;

  return {
    setState(s: number) {
      goal = Math.min(4, Math.max(0, s));
    },
    setActive(on: boolean) {
      active = on;
    },
    setBand(top: number, bottom: number) {
      band = { top, bottom };
    },
    dispose() {
      if (blockDrop.source === source) blockDrop.source = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((object) => {
        const m = object as THREE.Mesh;
        m.geometry?.dispose();
        const material = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(material) ? material : material ? [material] : []).forEach((x) => x.dispose());
      });
      mesh.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
