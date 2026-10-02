import * as THREE from "three";
import { smallViewportHeight } from "@/lib/viewport";

/**
 * Scena three.js dell'hero: Mindlead Holding al centro, le controllate intorno.
 * Tutto è guidato da un solo valore di avanzamento (0–1) che arriva dallo scroll.
 */

export type CircuitScene = {
  setProgress(p: number): void;
  setActive(on: boolean): void;
  dispose(): void;
};

const INK = 0x0e0e0d;
const PAPER = 0xfafaf9;
const FOV = 28;

const CHIP = { w: 4.2, h: 0.6, d: 4.2 };

type ModuleSpec = { label: string; x: number; z: number; w: number; d: number; h: number; partners?: boolean };

const MODULES: ModuleSpec[] = [
  { label: "01  ADVISORY", x: -7.6, z: -5.2, w: 4.4, d: 2.6, h: 0.5 },
  { label: "02  STUDIO", x: 7.4, z: -5.6, w: 3.8, d: 3.6, h: 0.55 },
  { label: "03  SUITE", x: 7.8, z: 5.4, w: 4.6, d: 2.4, h: 0.5 },
  { label: "04  PARTNERS", x: -7.4, z: 5.8, w: 4.8, d: 3.6, h: 0.3, partners: true },
];

const NEXT = { label: "05  NEXT", x: 0, z: -9.6, w: 3.6, d: 2.2 };

const SMALL_PARTS: { x: number; z: number; cap: boolean }[] = [
  { x: -11.4, z: -1.2, cap: true },
  { x: -11.4, z: 1.0, cap: false },
  { x: 11.6, z: 0.4, cap: true },
  { x: 11.6, z: -1.8, cap: false },
  { x: -2.8, z: 9.6, cap: true },
  { x: 2.8, z: 9.4, cap: true },
];

const TRACE = { w: 0.16, h: 0.05 };
const BUS = [-0.38, 0, 0.38];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ogni materiale ricorda la sua opacità di base, così i fade sono proporzionali. */
function withBase<M extends THREE.Material>(material: M, base = 1): M {
  material.transparent = true;
  material.opacity = base;
  material.userData.base = base;
  return material;
}

function setOpacity(object: THREE.Object3D, t: number) {
  object.visible = t > 0.001;
  object.traverse((child) => {
    const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
      m.opacity = (m.userData.base ?? 1) * t;
    });
  });
}

function block(w: number, h: number, d: number, edgeOpacity = 0.45) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, withBase(new THREE.MeshLambertMaterial({ color: PAPER })));
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    withBase(new THREE.LineBasicMaterial({ color: INK }), edgeOpacity),
  );
  edges.position.y = h / 2;
  group.add(mesh, edges);
  return group;
}

/** Etichetta stampata sulla faccia superiore, in mono come il resto del sito. */
function label(text: string, width: number, family: string, opacity = 0.85, align: "left" | "center" = "left") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `500 92px ${family}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "6px";
    ctx.fillStyle = "#0e0e0d";
    ctx.textBaseline = "middle";
    ctx.textAlign = align;
    ctx.fillText(text, align === "center" ? canvas.width / 2 : 6, 96);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const height = (width * canvas.height) / canvas.width;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    withBase(new THREE.MeshBasicMaterial({ map: texture, depthWrite: false }), opacity),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.userData.height = height;
  return mesh;
}

/** Sagoma del marchio in bianco: il colore lo decide il materiale che la usa. */
async function loadMark(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function rectLine(w: number, d: number, material: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
  const pts = [
    new THREE.Vector3(-w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, -d / 2),
  ];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
  line.computeLineDistances();
  return line;
}

type Segment = { group: THREE.Group; axis: "x" | "z"; len: number };
type Trace = { module: number; bus: number; points: THREE.Vector3[]; segs: Segment[]; cum: number[]; length: number };

/** Percorso ortogonale dal lato del modulo verso il chip; i bus paralleli non si incrociano. */
function routeTrace(m: ModuleSpec, offset: number): THREE.Vector3[] {
  const y = 0.002;
  const half = CHIP.w / 2;
  const sx = Math.sign(m.x) || 1;
  const tz = Math.max(-half + 0.7, Math.min(half - 0.7, m.z * 0.18));
  const dz = Math.sign(tz - m.z) || 1;
  const lane = half + 1.7 + offset * dz;
  return [
    new THREE.Vector3(m.x - (sx * m.w) / 2, y, m.z + offset),
    new THREE.Vector3(sx * lane, y, m.z + offset),
    new THREE.Vector3(sx * lane, y, tz + offset),
    new THREE.Vector3(sx * half, y, tz + offset),
  ];
}

export async function createCircuitScene(container: HTMLElement): Promise<CircuitScene> {
  const [markTexture] = await Promise.all([
    loadMark("/brand/mindlead-mark.png").catch(() => null),
    document.fonts?.ready,
  ]);
  const probe = document.createElement("span");
  probe.className = "font-mono";
  document.body.appendChild(probe);
  const mono = getComputedStyle(probe).fontFamily || "monospace";
  probe.remove();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;display:block";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 400);
  const target = new THREE.Vector3(0, CHIP.h, 0);

  // Luci tarate perché le facce superiori restino del colore della pagina.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe7e6e3, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-8, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.08 }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Scheda: solo contorno e griglia di punti, nessun fondo.
  const board = new THREE.Group();
  const outline = rectLine(30, 24, withBase(new THREE.LineBasicMaterial({ color: INK }), 0.16));
  outline.position.y = 0.001;
  const dots: number[] = [];
  for (let x = -14; x <= 14; x += 1) for (let z = -11; z <= 11; z += 1) dots.push(x, 0.001, z);
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
  const dotField = new THREE.Points(
    dotGeo,
    withBase(new THREE.PointsMaterial({ color: INK, size: 2, sizeAttenuation: false }), 0.22),
  );
  board.add(outline, dotField);
  scene.add(board);

  // Chip centrale: Mindlead Holding.
  const chip = block(CHIP.w, CHIP.h, CHIP.d, 0.6);
  // Stampe sulla faccia del chip: svaniscono nel tuffo prima che la texture si sgrani.
  const print = new THREE.Group();
  const logoZ = -0.3;
  const die = rectLine(2.2, 2.2, withBase(new THREE.LineBasicMaterial({ color: INK }), 0.45));
  die.position.set(0, CHIP.h + 0.003, logoZ);
  print.add(die);
  // Il rilievo non usa l'opacità: con alphaTest la sagoma sparirebbe di colpo.
  // Per farlo svanire lo si sbianca verso il chip e lo si appiattisce.
  const relief = new THREE.Group();
  relief.position.set(0, CHIP.h + 0.004, logoZ);
  const reliefMats: { mat: THREE.MeshBasicMaterial; color: THREE.Color }[] = [];
  if (markTexture) {
    // Rilievo: strati sottili della stessa sagoma. I bordi più chiari fanno da fianco,
    // l'ultimo strato è la faccia e proietta l'ombra sul chip.
    // Materiali non illuminati: la faccia resta esattamente del colore del logo (#505B6A).
    const size = 1.6;
    const layers = 20;
    const depth = 0.16;
    const geo = new THREE.PlaneGeometry(size, size);
    const side = new THREE.MeshBasicMaterial({ color: 0x9aa2ad, map: markTexture, alphaTest: 0.5 });
    const face = new THREE.MeshBasicMaterial({ color: 0x505b6a, map: markTexture, alphaTest: 0.5 });
    reliefMats.push({ mat: side, color: side.color.clone() }, { mat: face, color: face.color.clone() });
    for (let i = 0; i <= layers; i++) {
      const layer = new THREE.Mesh(geo, i === layers ? face : side);
      layer.rotation.x = -Math.PI / 2;
      layer.position.y = (depth * i) / layers;
      if (i === layers) {
        layer.castShadow = true;
        layer.customDepthMaterial = new THREE.MeshDepthMaterial({
          depthPacking: THREE.RGBADepthPacking,
          map: markTexture,
          alphaTest: 0.5,
        });
      }
      relief.add(layer);
    }
  }
  chip.add(relief);
  const paper = new THREE.Color(PAPER);
  const chipLabel = label("MINDLEAD HOLDING", 2.9, mono, 0.9, "center");
  chipLabel.position.set(0, CHIP.h + 0.004, CHIP.d / 2 - 0.3 - chipLabel.userData.height / 2);
  print.add(chipLabel);
  chip.add(print);
  const pinGeo = new THREE.BoxGeometry(0.14, 0.08, 0.42);
  const pinMat = withBase(new THREE.MeshLambertMaterial({ color: 0xd8d7d2 }));
  const pins = new THREE.InstancedMesh(pinGeo, pinMat, 40);
  const pinDummy = new THREE.Object3D();
  let pinIndex = 0;
  for (let i = 0; i < 10; i++) {
    const o = -CHIP.w / 2 + 0.35 + i * ((CHIP.w - 0.7) / 9);
    const spots: [number, number, number][] = [
      [o, -CHIP.d / 2 - 0.2, 0],
      [o, CHIP.d / 2 + 0.2, 0],
      [-CHIP.w / 2 - 0.2, o, Math.PI / 2],
      [CHIP.w / 2 + 0.2, o, Math.PI / 2],
    ];
    for (const [x, z, r] of spots) {
      pinDummy.position.set(x, 0.04, z);
      pinDummy.rotation.set(0, r, 0);
      pinDummy.updateMatrix();
      pins.setMatrixAt(pinIndex++, pinDummy.matrix);
    }
  }
  chip.add(pins);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 0.915, 128),
    withBase(new THREE.MeshBasicMaterial({ color: INK, depthWrite: false }), 0),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, CHIP.h + 0.005, logoZ);
  chip.add(ring);
  scene.add(chip);

  // Controllate.
  const modules = MODULES.map((spec) => {
    const group = block(spec.w, spec.h, spec.d);
    group.position.set(spec.x, 0, spec.z);
    const tag = label(spec.label, Math.min(2.8, spec.w - 0.6), mono);
    tag.position.set(
      -spec.w / 2 + 0.3 + (tag.geometry as THREE.PlaneGeometry).parameters.width / 2,
      spec.h + 0.004,
      spec.d / 2 - 0.3 - tag.userData.height / 2,
    );
    group.add(tag);
    scene.add(group);
    return group;
  });

  // Sul modulo Partners, due chip senza nome: le venture fondate con i partner.
  const partnersSpec = MODULES[3];
  const ventures = [-1.15, 1.15].map((dx) => {
    const v = block(1.6, 0.32, 1.5, 0.5);
    v.position.set(partnersSpec.x + dx, partnersSpec.h, partnersSpec.z - 0.3);
    scene.add(v);
    return v;
  });

  // Il prossimo posto libero, tratteggiato.
  const next = new THREE.Group();
  const dashed = withBase(new THREE.LineDashedMaterial({ color: INK, dashSize: 0.22, gapSize: 0.16 }), 0.4);
  const socket = rectLine(NEXT.w, NEXT.d, dashed);
  socket.position.y = 0.003;
  const nextTag = label(NEXT.label, 2.2, mono, 0.5);
  nextTag.position.set(-NEXT.w / 2 + 0.25 + 1.1, 0.004, NEXT.d / 2 - 0.25 - nextTag.userData.height / 2);
  const link = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.003, NEXT.d / 2),
      new THREE.Vector3(0, 0.003, NEXT.d / 2 + (Math.abs(NEXT.z) - NEXT.d / 2 - CHIP.d / 2 - 0.45)),
    ]),
    dashed,
  );
  link.computeLineDistances();
  next.add(socket, nextTag, link);
  next.position.set(NEXT.x, 0, NEXT.z);
  scene.add(next);

  // Componenti minori: condensatori e resistenze.
  const smalls = SMALL_PARTS.map((s) => {
    let obj: THREE.Object3D;
    if (s.cap) {
      const group = new THREE.Group();
      const geo = new THREE.CylinderGeometry(0.34, 0.34, 0.8, 40);
      const mesh = new THREE.Mesh(geo, withBase(new THREE.MeshLambertMaterial({ color: PAPER })));
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 30),
        withBase(new THREE.LineBasicMaterial({ color: INK }), 0.45),
      );
      edges.position.y = 0.4;
      group.add(mesh, edges);
      obj = group;
    } else {
      obj = block(1.0, 0.26, 0.42, 0.4);
    }
    obj.position.set(s.x, 0, s.z);
    scene.add(obj);
    return obj;
  });

  // Piste in rilievo: un bus di tre per ogni controllata.
  const traceMat = new THREE.MeshLambertMaterial({ color: 0xe6e5e1 });
  const traceEdge = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.28 });
  const traces: Trace[] = [];
  MODULES.forEach((m, mi) => {
    BUS.forEach((offset, bi) => {
      const points = routeTrace(m, offset);
      const segs: Segment[] = [];
      const cum = [0];
      let length = 0;
      for (let k = 1; k < points.length; k++) {
        const a = points[k - 1];
        const b = points[k];
        const len = a.distanceTo(b);
        length += len;
        cum.push(length);
        if (len < 0.01) continue;
        const axis: "x" | "z" = Math.abs(b.x - a.x) > Math.abs(b.z - a.z) ? "x" : "z";
        const geo =
          axis === "x"
            ? new THREE.BoxGeometry(len + TRACE.w, TRACE.h, TRACE.w).translate((len + TRACE.w) / 2 - TRACE.w / 2, TRACE.h / 2, 0)
            : new THREE.BoxGeometry(TRACE.w, TRACE.h, len + TRACE.w).translate(0, TRACE.h / 2, (len + TRACE.w) / 2 - TRACE.w / 2);
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(geo, traceMat);
        mesh.receiveShadow = true;
        group.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geo), traceEdge));
        group.position.copy(a);
        if (axis === "x" && b.x < a.x) group.rotation.y = Math.PI;
        if (axis === "z" && b.z < a.z) group.rotation.y = Math.PI;
        group.visible = false;
        scene.add(group);
        segs.push({ group, axis, len });
      }
      traces.push({ module: mi, bus: bi, points, segs, cum, length });
    });
  });

  // Energia: impulsi con scia che corrono dai moduli verso il chip.
  const PULSES_PER_TRACE = 2;
  const TRAIL = 4;
  const pulseMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 14, 10),
    new THREE.MeshBasicMaterial({ color: INK }),
    traces.length * PULSES_PER_TRACE * TRAIL,
  );
  pulseMesh.frustumCulled = false;
  pulseMesh.visible = false;
  scene.add(pulseMesh);
  const tmp = new THREE.Vector3();
  const dummy = new THREE.Object3D();

  const pointAt = (trace: Trace, s: number, out: THREE.Vector3) => {
    const d = clamp01(s) * trace.length;
    let k = 1;
    while (k < trace.cum.length - 1 && trace.cum[k] < d) k++;
    const a = trace.points[k - 1];
    const b = trace.points[k];
    const segLen = trace.cum[k] - trace.cum[k - 1] || 1;
    out.lerpVectors(a, b, (d - trace.cum[k - 1]) / segLen);
    out.y = TRACE.h + 0.09;
    return out;
  };

  // Ingombro della scena costruita: spigoli di moduli, zoccolo "next" e componenti piccoli.
  const bounds: THREE.Vector3[] = [];
  const corners = (x: number, z: number, w: number, d: number, h: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, h]) {
      bounds.push(new THREE.Vector3(x + (sx * w) / 2, y, z + (sz * d) / 2));
    }
  };
  MODULES.forEach((m) => corners(m.x, m.z, m.w, m.d, m.h + 0.6));
  corners(NEXT.x, NEXT.z, NEXT.w, NEXT.d, 0);
  SMALL_PARTS.forEach((s) => corners(s.x, s.z, 1.0, 0.8, 0.8));
  const projected = new THREE.Vector3();
  // In alto c'è l'header: lì il margine è più ampio.
  const fits = () =>
    bounds.every((point) => {
      projected.copy(point).project(camera);
      return Math.abs(projected.x) < 0.92 && projected.y > -0.9 && projected.y < 0.82;
    });

  // Camera: distanza a cui tutta la scena sta nello schermo, poi tuffo nel chip.
  let width = 1;
  let height = 1;
  let baseDistance = 30;
  const resize = () => {
    width = container.clientWidth || 1;
    height = container.clientHeight || 1;
    // Inquadratura sullo schermo a barre aperte: la tela può essere più alta e prosegue sotto.
    const frameH = Math.min(height, smallViewportHeight());
    renderer.setSize(width, height, false);
    camera.aspect = width / frameH;
    camera.clearViewOffset();
    // Stessa posa di fine avvicinamento in update (elevazione 56°, giro -22°, centro spostato di 1.6).
    const z = target.z;
    target.z = 1.6;
    baseDistance = Math.min(54 / camera.aspect, 72);
    for (let i = 0; i < 60; i++) {
      placeCamera(baseDistance, 56, -22);
      camera.updateMatrixWorld();
      if (fits()) break;
      baseDistance *= 1.03;
    }
    target.z = z;
    if (height > frameH) {
      camera.setViewOffset(width, frameH, 0, 0, width, height);
      camera.updateProjectionMatrix();
    }
    needsRender = true;
  };

  const placeCamera = (dist: number, elevDeg: number, azDeg: number) => {
    const e = THREE.MathUtils.degToRad(elevDeg);
    const a = THREE.MathUtils.degToRad(azDeg);
    camera.position.set(
      target.x + dist * Math.cos(e) * Math.sin(a),
      target.y + dist * Math.sin(e),
      target.z + dist * Math.cos(e) * Math.cos(a),
    );
    camera.lookAt(target);
  };

  let goal = 0;
  let progress = 0;
  let active = true;
  let needsRender = true;
  let raf = 0;
  const clock = new THREE.Clock();

  const drop = (object: THREE.Object3D, t: number, baseY = 0) => {
    const e = easeOut(t);
    object.position.y = baseY + (1 - e) * 5;
    setOpacity(object, e);
  };

  const update = (time: number) => {
    const p = progress;

    // Il bianco deve arrivare entro ~0.68: in page.tsx il manifesto entra proprio lì.
    canvas.style.opacity = String(range(p, 0.05, 0.14) * (1 - range(p, 0.68, 0.72)));

    setOpacity(board, easeOut(range(p, 0.05, 0.16)));
    const chipIn = range(p, 0.12, 0.2);
    drop(chip, chipIn);
    const printT = easeOut(chipIn) * (1 - range(p, 0.54, 0.6));
    setOpacity(print, printT);
    relief.visible = printT > 0.001;
    relief.scale.y = Math.max(printT, 0.001);
    reliefMats.forEach(({ mat, color }) => {
      mat.opacity = 1;
      mat.color.lerpColors(paper, color, printT);
    });
    modules.forEach((m, i) => drop(m, range(p, 0.18 + i * 0.04, 0.26 + i * 0.04)));
    ventures.forEach((v, i) => drop(v, range(p, 0.32 + i * 0.03, 0.38 + i * 0.03), partnersSpec.h));
    setOpacity(next, range(p, 0.36, 0.42));
    smalls.forEach((s, i) => drop(s, range(p, 0.24 + i * 0.02, 0.3 + i * 0.02)));

    // Ogni pista cresce tratto dopo tratto, dal modulo verso il chip.
    traces.forEach((trace) => {
      const start = 0.3 + trace.module * 0.02 + trace.bus * 0.008;
      const grown = range(p, start, start + 0.07) * trace.length;
      let used = 0;
      trace.segs.forEach((seg) => {
        const t = clamp01((grown - used) / seg.len);
        used += seg.len;
        seg.group.visible = t > 0.001;
        const s = Math.max(t, 0.0001);
        seg.group.scale.set(seg.axis === "x" ? s : 1, 1, seg.axis === "z" ? s : 1);
      });
    });

    // Energia verso il centro, e un'onda sul chip quando arriva.
    const energy = range(p, 0.42, 0.47) * (1 - range(p, 0.54, 0.58));
    pulseMesh.visible = energy > 0.001;
    if (pulseMesh.visible) {
      let n = 0;
      traces.forEach((trace, ti) => {
        for (let j = 0; j < PULSES_PER_TRACE; j++) {
          const head = (time * 0.32 + j / PULSES_PER_TRACE + ti * 0.137) % 1;
          for (let k = 0; k < TRAIL; k++) {
            pointAt(trace, head - k * 0.018, tmp);
            dummy.position.copy(tmp);
            dummy.scale.setScalar(energy * (1 - k * 0.24) * (head - k * 0.018 > 0 ? 1 : 0));
            dummy.updateMatrix();
            pulseMesh.setMatrixAt(n++, dummy.matrix);
          }
        }
      });
      pulseMesh.instanceMatrix.needsUpdate = true;
    }
    const wave = (time * 0.8) % 1;
    ring.scale.setScalar(1 + wave * 1.3);
    (ring.material as THREE.MeshBasicMaterial).opacity = energy * 0.5 * (1 - wave);

    // Prima un lento avvicinamento, poi il tuffo dentro il chip.
    const settle = easeInOut(range(p, 0.05, 0.48));
    const dive = easeInOut(range(p, 0.48, 0.7));
    const startDist = baseDistance * 1.55;
    const dist = lerp(startDist, baseDistance, settle) * Math.pow(0.9 / baseDistance, dive);
    const elev = lerp(lerp(50, 56, settle), 89, easeInOut(range(p, 0.48, 0.67)));
    const az = lerp(lerp(-34, -22, settle), 0, dive);
    // Il centro dell'inquadratura scende verso i moduli vicini, poi torna sul chip.
    target.z = lerp(1.6, 0, dive);
    placeCamera(dist, elev, az);

    renderer.render(scene, camera);
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const diff = goal - progress;
    progress += diff * 0.2;
    if (Math.abs(diff) < 0.00005) progress = goal;
    const animating = progress > 0.4 && progress < 0.72;
    if (!active || (!animating && !needsRender && Math.abs(diff) < 0.00005)) return;
    needsRender = false;
    update(clock.getElapsedTime());
  };

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(loop);

  return {
    setProgress(p: number) {
      goal = clamp01(p);
      needsRender = true;
    },
    setActive(on: boolean) {
      active = on;
      needsRender = true;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        mesh.customDepthMaterial?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => {
          (m as THREE.MeshBasicMaterial).map?.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      canvas.remove();
    },
  };
}
