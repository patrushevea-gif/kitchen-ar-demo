import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { kitchenModules } from '../data/kitchen.js';

const moduleById = new Map(kitchenModules.map((m) => [m.id, m]));

// ── Seeded deterministic RNG ──────────────────────────────────────────────────
function seedRng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Texture factory ───────────────────────────────────────────────────────────
function makeTexture(color, mode) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, S, S);

  if (mode === 'wood') {
    const rng = seedRng(77);
    for (let y = -10; y < S + 10; y += 7) {
      const main = y % 21 === 0;
      ctx.strokeStyle = main ? 'rgba(55,28,8,0.22)' : 'rgba(200,155,75,0.10)';
      ctx.lineWidth = main ? 1.4 : 0.7;
      ctx.beginPath();
      ctx.moveTo(-20, y + Math.sin(y * 0.05) * 8);
      ctx.bezierCurveTo(
        S * 0.3, y - 12 + rng() * 5,
        S * 0.65, y + 12 - rng() * 5,
        S + 20, y + Math.sin(y * 0.03) * 10,
      );
      ctx.stroke();
    }
  } else if (mode === 'shagreen') {
    // Soft circles with seeded positions — looks like real пескоструй/shagreen
    const rng = seedRng(42);
    for (let i = 0; i < 380; i++) {
      const x = rng() * S;
      const y = rng() * S;
      const r = 2 + rng() * 3.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.fill();
    }
  }
  // 'plain' — solid base color, no marks

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(mode === 'wood' ? 2.2 : 1.6, mode === 'wood' ? 1.0 : 2.0);
  tex.anisotropy = 16;
  return tex;
}

// ── Material set ──────────────────────────────────────────────────────────────
function createMaterials(source) {
  const woodTex = makeTexture(source.counter, 'wood');
  const faceTex = source.shagreen ? makeTexture(source.face, 'shagreen') : null;

  // Smooth (non-shagreen) materials get more clearcoat — lacquered look
  const clearcoat = source.shagreen ? 0.05 : 0.28;
  const clearcoatRoughness = source.shagreen ? 0.74 : 0.32;

  return {
    face: new THREE.MeshPhysicalMaterial({
      color: source.face,
      ...(faceTex && { map: faceTex }),
      roughness: 0.56,
      metalness: 0.01,
      clearcoat,
      clearcoatRoughness,
    }),
    body: new THREE.MeshStandardMaterial({ color: source.body, roughness: 0.74, metalness: 0.01 }),
    wood: new THREE.MeshPhysicalMaterial({
      color: source.counter,
      map: woodTex,
      roughness: 0.36,
      metalness: 0.01,
      clearcoat: 0.16,
      clearcoatRoughness: 0.36,
    }),
    black: new THREE.MeshStandardMaterial({ color: '#13110e', roughness: 0.40, metalness: 0.20 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c4c1ba', roughness: 0.22, metalness: 0.62 }),
    fridge: new THREE.MeshStandardMaterial({ color: '#b8b5ae', roughness: 0.20, metalness: 0.64 }),
    fridgeDoor: new THREE.MeshStandardMaterial({ color: '#c6c3bc', roughness: 0.16, metalness: 0.68 }),
    fridgeSep: new THREE.MeshStandardMaterial({ color: '#888580', roughness: 0.55, metalness: 0.30 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#040404',
      roughness: 0.08,
      metalness: 0.04,
      clearcoat: 0.85,
      transparent: true,
      opacity: 0.74,
    }),
    wall: new THREE.MeshStandardMaterial({ color: '#f0ebe4', roughness: 0.92 }),
    backsplash: new THREE.MeshStandardMaterial({ color: '#d4cbc0', roughness: 0.65 }),
    floor: new THREE.MeshStandardMaterial({ color: '#d7c7b3', roughness: 0.76 }),
    rug: new THREE.MeshStandardMaterial({ color: '#d3c4b2', roughness: 0.96 }),
    light: new THREE.MeshBasicMaterial({ color: '#ffd89a' }),
  };
}

// ── Primitive helpers ─────────────────────────────────────────────────────────
function rounded(w, h, d, r = 0.012) {
  const safe = Math.max(0.0005, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  return new RoundedBoxGeometry(w, h, d, 3, safe);
}

function box(parent, { x, y, z, w, h, d, mat, r = 0.012, shadow = true }) {
  const mesh = new THREE.Mesh(rounded(w, h, d, r), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cyl(parent, { x, y, z, radius = 0.012, length = 0.3, mat, axis = 'x' }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), mat);
  mesh.position.set(x, y, z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// ── Shared panel + handle builder ─────────────────────────────────────────────
function frontPanel(parent, mats, x, y, z, w, h, split = 1, handle = true) {
  const gap = 0.018;
  const panelW = (w - gap * (split + 1)) / split;
  for (let i = 0; i < split; i++) {
    const px = x - w / 2 + gap + panelW / 2 + i * (panelW + gap);
    box(parent, { x: px, y, z, w: panelW, h, d: 0.032, mat: mats.face, r: 0.012 });
    box(parent, { x: px, y: y + h / 2 - 0.026, z: z + 0.018, w: panelW * 0.86, h: 0.009, d: 0.010, mat: mats.black, r: 0.003 });
    if (handle) {
      cyl(parent, { x: px, y: y + h / 2 - 0.088, z: z + 0.052, radius: 0.008, length: panelW * 0.56, mat: mats.black });
    }
  }
}

// ── Base cabinet ──────────────────────────────────────────────────────────────
function addBase(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const fz = z + d / 2 + 0.032;

  box(parent, { x, y: h / 2, z, w, h, d, mat: mats.body, r: 0.01 });
  box(parent, { x, y: 0.065, z: fz - 0.035, w: w * 0.9, h: 0.13, d: 0.05, mat: mats.black, r: 0.004 });
  box(parent, { x, y: h + 0.035, z: z + 0.01, w: w + 0.05, h: 0.07, d: d + 0.17, mat: mats.wood, r: 0.014 });

  if (item.id === 'drawers-800') {
    for (let row = 0; row < 3; row++) {
      const y = 0.25 + row * 0.22;
      frontPanel(parent, mats, x, y, fz, w - 0.04, 0.19, 1, false);
      cyl(parent, { x, y: y + 0.045, z: fz + 0.054, radius: 0.008, length: w * 0.62, mat: mats.black });
    }
  } else if (item.id === 'oven-600') {
    frontPanel(parent, mats, x, 0.22, fz, w - 0.02, 0.28, 1);
    box(parent, { x, y: 0.58, z: fz + 0.012, w: w - 0.08, h: 0.42, d: 0.04, mat: mats.glass, r: 0.014 });
    box(parent, { x, y: 0.76, z: fz + 0.042, w: w * 0.52, h: 0.034, d: 0.012, mat: mats.metal, r: 0.004 });
  } else if (item.id === 'sink-800') {
    frontPanel(parent, mats, x, 0.43, fz, w - 0.02, 0.68, 2);
    box(parent, { x, y: h + 0.085, z: z + 0.02, w: w * 0.52, h: 0.026, d: d * 0.4, mat: mats.metal, r: 0.02 });
    cyl(parent, { x: x + w * 0.18, y: h + 0.14, z: z + 0.02, radius: 0.013, length: 0.14, mat: mats.metal, axis: 'z' });
  } else {
    frontPanel(parent, mats, x, 0.43, fz, w - 0.02, 0.68, w > 0.65 ? 2 : 1);
  }
}

// ── Pantry column (пенал) with integrated oven ─────────────────────────────
function addPantry(parent, item, mats, x) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;   // 2.14 m
  const fz = d / 2 + 0.028;

  // Body
  box(parent, { x, y: h / 2, z: 0, w, h, d, mat: mats.body, r: 0.012 });

  // Wood crown on top
  box(parent, { x, y: h - 0.038, z: -0.005, w: w + 0.044, h: 0.078, d: d + 0.05, mat: mats.wood, r: 0.010 });

  // Upper facade panel (1.74 – 2.06)
  frontPanel(parent, mats, x, 1.90, fz, w - 0.038, 0.30, 1);

  // Built-in microwave (1.50 – 1.72)
  const mwY = 1.61;
  box(parent, { x, y: mwY, z: fz + 0.006, w: w - 0.052, h: 0.22, d: 0.046, mat: mats.metal, r: 0.010 });
  box(parent, { x: x - w * 0.04, y: mwY + 0.018, z: fz + 0.054, w: w * 0.66, h: 0.13, d: 0.008, mat: mats.glass, r: 0.008 });
  // microwave control panel
  box(parent, { x: x + w * 0.28, y: mwY, z: fz + 0.054, w: 0.052, h: 0.14, d: 0.010, mat: mats.black, r: 0.005 });

  // Built-in oven (0.90 – 1.46)
  const ovenY = 1.18;
  box(parent, { x, y: ovenY, z: fz + 0.006, w: w - 0.052, h: 0.54, d: 0.046, mat: mats.metal, r: 0.010 });
  box(parent, { x, y: ovenY + 0.04, z: fz + 0.055, w: w - 0.10, h: 0.30, d: 0.009, mat: mats.glass, r: 0.010 });
  // oven control strip
  box(parent, { x, y: ovenY + 0.23, z: fz + 0.054, w: w - 0.12, h: 0.022, d: 0.010, mat: mats.black, r: 0.002 });
  // oven handle
  cyl(parent, { x, y: ovenY - 0.20, z: fz + 0.068, radius: 0.009, length: w * 0.60, mat: mats.black });

  // Lower facade panel (0.04 – 0.84)
  frontPanel(parent, mats, x, 0.44, fz, w - 0.038, 0.78, 1);

  // Wood side accent strips
  const sw = 0.026;
  box(parent, { x: x - w * 0.43, y: h / 2 - 0.04, z: fz - 0.055, w: sw, h: h - 0.09, d: 0.022, mat: mats.wood, r: 0.004 });
  box(parent, { x: x + w * 0.43, y: h / 2 - 0.04, z: fz - 0.055, w: sw, h: h - 0.09, d: 0.022, mat: mats.wood, r: 0.004 });
}

// ── Freestanding refrigerator ──────────────────────────────────────────────
function addFridge(parent, item, mats, x) {
  const w = item.width / 1000;   // 0.60
  const d = item.depth / 1000;   // 0.62
  const h = item.height / 1000;  // 2.00
  const fz = d / 2 + 0.018;

  // Body — stainless steel (slightly rounded)
  box(parent, { x, y: h / 2, z: 0, w, h, d, mat: mats.fridge, r: 0.020 });

  // Ventilation strip at top
  box(parent, { x, y: h - 0.038, z: 0, w: w - 0.024, h: 0.056, d: d - 0.024, mat: mats.fridgeSep, r: 0.010 });

  // Fridge door (main compartment, y 0.62 – 1.90)
  box(parent, { x, y: 1.26, z: fz + 0.006, w: w - 0.034, h: 1.28, d: 0.024, mat: mats.fridgeDoor, r: 0.016 });

  // Freezer door (y 0.06 – 0.56)
  box(parent, { x, y: 0.31, z: fz + 0.006, w: w - 0.034, h: 0.50, d: 0.024, mat: mats.fridgeDoor, r: 0.016 });

  // Separator between fridge and freezer
  box(parent, { x, y: 0.59, z: fz + 0.018, w: w * 0.94, h: 0.040, d: 0.018, mat: mats.fridgeSep, r: 0.004 });

  // Fridge handle — vertical bar on right side
  box(parent, { x: x + w * 0.29, y: 1.46, z: fz + 0.068, w: 0.018, h: 0.40, d: 0.018, mat: mats.black, r: 0.008 });
  // handle top bracket
  box(parent, { x: x + w * 0.29, y: 1.66, z: fz + 0.046, w: 0.018, h: 0.018, d: 0.030, mat: mats.black, r: 0.005 });
  // handle bottom bracket
  box(parent, { x: x + w * 0.29, y: 1.26, z: fz + 0.046, w: 0.018, h: 0.018, d: 0.030, mat: mats.black, r: 0.005 });

  // Freezer horizontal handle
  cyl(parent, { x, y: 0.44, z: fz + 0.066, radius: 0.009, length: w * 0.52, mat: mats.black });
}

// ── Wall cabinet ──────────────────────────────────────────────────────────────
function addWall(parent, item, mats, x, z = -0.12) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const y = 1.56;
  const fz = z + d / 2 + 0.028;

  box(parent, { x, y, z, w, h, d, mat: mats.body, r: 0.01 });
  box(parent, { x, y: y - h / 2 - 0.033, z: fz, w: w * 0.92, h: 0.022, d: 0.020, mat: mats.light, r: 0.003, shadow: false });

  if (item.id.includes('glass')) {
    const shelfW = w - 0.08;
    const shelfH = h - 0.06;
    [-1, 1].forEach((sx) => {
      box(parent, { x: x + sx * shelfW / 2, y, z: fz - 0.08, w: 0.024, h: shelfH, d: d - 0.04, mat: mats.black, r: 0.003 });
    });
    [-0.24, 0.02, 0.28].forEach((off) => {
      box(parent, { x, y: y + off, z: fz - 0.08, w: shelfW, h: 0.028, d: d - 0.04, mat: mats.wood, r: 0.004 });
    });
    box(parent, { x: x - 0.14, y: y + 0.18, z: fz - 0.01, w: 0.14, h: 0.16, d: 0.05, mat: mats.wood, r: 0.004 });
    box(parent, { x: x + 0.12, y: y - 0.08, z: fz - 0.01, w: 0.17, h: 0.052, d: 0.11, mat: mats.metal, r: 0.006 });
  } else {
    frontPanel(parent, mats, x, y, fz, w - 0.02, h - 0.075, w > 0.65 ? 2 : 1);
  }
}

// ── Room surfaces ─────────────────────────────────────────────────────────────
function addRoom(scene, mats) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.6), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.006, 0.6);
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  box(scene, { x: 0, y: 1.16, z: -0.50, w: 8, h: 2.46, d: 0.08, mat: mats.wall, r: 0.002 });
  // Backsplash
  box(scene, { x: 0, y: 0.66, z: -0.438, w: 8, h: 0.68, d: 0.026, mat: mats.backsplash, r: 0.002 });
  // Metal rail between backsplash and upper cabinets
  box(scene, { x: 0, y: 1.015, z: -0.412, w: 8, h: 0.024, d: 0.026, mat: mats.metal, r: 0.002 });
}

function addSideWall(scene, mats, anchorX, sideMeters, side) {
  const wallX = anchorX + (side === 'right' ? 0.338 : -0.338);
  const wallZ = sideMeters / 2 - 0.28;
  const wlen = sideMeters + 0.8;
  box(scene, { x: wallX, y: 1.16, z: wallZ, w: 0.08, h: 2.46, d: wlen, mat: mats.wall, r: 0.002 });
  const bsX = side === 'right' ? wallX - 0.038 : wallX + 0.038;
  box(scene, { x: bsX, y: 0.66, z: wallZ, w: 0.026, h: 0.68, d: wlen - 0.14, mat: mats.backsplash, r: 0.002 });
}

// ── Decorative scene details ──────────────────────────────────────────────────
function addDetails(scene, mats) {
  // Knife rail
  cyl(scene, { x: -0.04, y: 1.02, z: -0.33, radius: 0.009, length: 1.0, mat: mats.black });
  [-0.34, -0.12, 0.10, 0.32].forEach((off) => {
    cyl(scene, { x: -0.04 + off, y: 0.95, z: -0.33, radius: 0.005, length: 0.11, mat: mats.black, axis: 'y' });
  });
  // Rug
  box(scene, { x: 0.2, y: 0.012, z: 1.28, w: 1.12, h: 0.018, d: 0.56, mat: mats.rug, r: 0.012, shadow: false });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KitchenPreview({ layout, material, wallLength, sideLength = 2200, scheme, cornerSide = 'right' }) {
  const canvasRef = useRef(null);
  const modules = useMemo(() => layout.map((id) => moduleById.get(id)).filter(Boolean), [layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const target = new THREE.Vector3(0.18, 1.02, 0.12);
    camera.position.set(4.2, 2.25, 4.6);
    camera.lookAt(target);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment(renderer);
    scene.environment = pmrem.fromScene(roomEnv, 0.03).texture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 1.8;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.minAzimuthAngle = -Math.PI * 0.62;
    controls.maxAzimuthAngle = Math.PI * 0.64;
    controls.update();

    const mats = createMaterials(material);
    const kitchen = new THREE.Group();
    scene.add(kitchen);
    addRoom(scene, mats);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd7c5af, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 4.6);
    key.position.set(2.6, 5.2, 3.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.5;
    key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    scene.add(key);
    const warm = new THREE.PointLight(0xffc982, 18, 3.2);
    warm.position.set(0.2, 1.0, 0.16);
    scene.add(warm);

    // Split modules by row
    const baseModules = modules.filter((m) => m.type === 'base' || m.type === 'tall');
    const wallModules = modules.filter((m) => m.type === 'wall');

    const startX = -Math.min(wallLength / 1000, 4.7) / 2;
    let cursor = startX;
    let wallCursor = startX;

    baseModules.forEach((item) => {
      const w = item.width / 1000;
      const cx = cursor + w / 2;
      if (item.type === 'tall') {
        if (item.id === 'fridge-600') addFridge(kitchen, item, mats, cx);
        else addPantry(kitchen, item, mats, cx);
        wallCursor += w + 0.018; // tall units have no upper cabinet above
      } else {
        addBase(kitchen, item, mats, cx);
      }
      cursor += w + 0.018;
    });

    wallModules.forEach((item) => {
      const w = item.width / 1000;
      addWall(kitchen, item, mats, wallCursor + w / 2);
      wallCursor += w + 0.018;
    });

    // ── Corner side wall ──────────────────────────────────────────────────────
    // rotation.y = -π/2 → local +X = world +Z, local +Z = world -X  (RIGHT corner)
    //   modules at positive local X → world +Z toward viewer ✓
    //   depth in local +Z → world -X (toward kitchen center) ✓
    //
    // rotation.y = +π/2 → local +X = world -Z, local +Z = world +X  (LEFT corner)
    //   modules at negative local X → world +Z toward viewer ✓
    //   depth in local +Z → world +X (toward kitchen center) ✓
    if (scheme === 'corner') {
      const sideMeters = Math.min(sideLength / 1000, 2.8);
      const sideCount = Math.max(1, Math.floor(sideMeters / 0.618));
      const sideWallCount = Math.min(sideCount, 3);

      const sideGroup = new THREE.Group();
      kitchen.add(sideGroup);

      if (cornerSide === 'right') {
        sideGroup.rotation.y = -Math.PI / 2;
        sideGroup.position.set(cursor + 0.312, 0, -0.3);
        for (let i = 0; i < sideCount; i++) {
          addBase(sideGroup, { id: 'base-600', width: 600, height: 820, depth: 560, type: 'base' }, mats, i * 0.618 + 0.3);
        }
        for (let i = 0; i < sideWallCount; i++) {
          addWall(sideGroup, { id: 'wall-600', width: 600, height: 720, depth: 340, type: 'wall' }, mats, i * 0.618 + 0.3);
        }
        addSideWall(scene, mats, cursor + 0.312, sideMeters, 'right');
      } else {
        // Left corner: modules at negative local X so they go toward +Z in world
        sideGroup.rotation.y = Math.PI / 2;
        sideGroup.position.set(startX - 0.312, 0, -0.3);
        for (let i = 0; i < sideCount; i++) {
          addBase(sideGroup, { id: 'base-600', width: 600, height: 820, depth: 560, type: 'base' }, mats, -(i * 0.618 + 0.3));
        }
        for (let i = 0; i < sideWallCount; i++) {
          addWall(sideGroup, { id: 'wall-600', width: 600, height: 720, depth: 340, type: 'wall' }, mats, -(i * 0.618 + 0.3));
        }
        addSideWall(scene, mats, startX - 0.312, sideMeters, 'left');
      }
    }

    addDetails(scene, mats);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      roomEnv.dispose?.();
      pmrem.dispose();
      renderer.dispose();
      scene.environment?.dispose?.();
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material?.dispose();
      });
      Object.values(mats).forEach((m) => { m.map?.dispose(); m.dispose(); });
    };
  }, [modules, material, wallLength, sideLength, scheme, cornerSide]);

  return (
    <div className="preview-shell" aria-label="3D превью кухни">
      <canvas ref={canvasRef} />
      <div className="preview-badge">{material.name}</div>
      <div className="preview-hint">Вращение — мышь · Масштаб — колёсико · Перемещение — ПКМ</div>
    </div>
  );
}
