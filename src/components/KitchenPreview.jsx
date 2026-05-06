import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { kitchenModules } from '../data/kitchen.js';

const moduleById = new Map(kitchenModules.map((item) => [item.id, item]));

function hash(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function makeTexture({ base, accent = 'rgba(255,255,255,0.12)', mode = 'fine', seed = 1, repeat = [2, 2] }) {
  const random = hash(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, base);
  gradient.addColorStop(0.45, base);
  gradient.addColorStop(1, accent);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  if (mode === 'wood') {
    for (let y = -20; y < 540; y += 8) {
      const wave = Math.sin(y * 0.035) * 18;
      ctx.strokeStyle = random() > 0.42 ? 'rgba(80,43,18,0.22)' : 'rgba(255,232,184,0.16)';
      ctx.lineWidth = 1 + random() * 2.6;
      ctx.beginPath();
      ctx.moveTo(-30, y + wave);
      ctx.bezierCurveTo(120, y - 18 + random() * 22, 270, y + 24 - random() * 18, 550, y + Math.sin(y * 0.02) * 22);
      ctx.stroke();
    }
  }

  if (mode === 'stone') {
    for (let i = 0; i < 82; i += 1) {
      const y = random() * 512;
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(48,43,38,0.14)';
      ctx.lineWidth = random() > 0.82 ? 2.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(-40, y);
      ctx.bezierCurveTo(120, y + random() * 80 - 40, 300, y + random() * 70 - 35, 560, y + random() * 54 - 27);
      ctx.stroke();
    }
  }

  if (mode === 'tile') {
    ctx.strokeStyle = 'rgba(116,105,94,0.22)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 86) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 86) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 2600; i += 1) {
    const shade = random() > 0.52 ? '255,255,255' : '0,0,0';
    ctx.fillStyle = `rgba(${shade},${0.018 + random() * 0.028})`;
    ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  return texture;
}

function createMaterials(source) {
  const isLight = source.face.toLowerCase().startsWith('#f');
  const faceMap = makeTexture({
    base: source.face,
    accent: isLight ? '#ffffff' : '#45464a',
    mode: 'fine',
    seed: source.id?.length ?? 11,
    repeat: [1.2, 1.6],
  });
  const woodMap = makeTexture({ base: source.counter, accent: '#d9b579', mode: 'wood', seed: 17, repeat: [2.8, 1.2] });
  const stoneMap = makeTexture({ base: source.counter, accent: '#e7dfd1', mode: 'stone', seed: 23, repeat: [1.8, 1.2] });
  const bodyMap = makeTexture({ base: source.body, accent: '#fffaf0', seed: 31, repeat: [1.6, 1.6] });
  const floorMap = makeTexture({ base: '#d8cfc2', accent: '#efe4d7', mode: 'tile', seed: 37, repeat: [4.4, 2.2] });
  const backsplashMap = makeTexture({ base: '#cfc7bb', accent: '#f6eee4', mode: 'stone', seed: 43, repeat: [3.5, 0.9] });

  return {
    face: new THREE.MeshPhysicalMaterial({
      color: source.face,
      map: faceMap,
      roughness: isLight ? 0.48 : 0.34,
      metalness: 0.02,
      clearcoat: 0.34,
      clearcoatRoughness: 0.42,
    }),
    body: new THREE.MeshStandardMaterial({ color: source.body, map: bodyMap, roughness: 0.74, metalness: 0.01 }),
    counter: new THREE.MeshPhysicalMaterial({
      color: source.counter,
      map: source.counter === '#9b7a55' ? woodMap : stoneMap,
      roughness: source.counter === '#9b7a55' ? 0.34 : 0.28,
      metalness: 0.01,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
    }),
    shadow: new THREE.MeshStandardMaterial({ color: '#171412', roughness: 0.86, metalness: 0 }),
    reveal: new THREE.MeshStandardMaterial({ color: '#101010', roughness: 0.62, metalness: 0.08 }),
    metal: new THREE.MeshStandardMaterial({ color: '#2a2926', roughness: 0.2, metalness: 0.72 }),
    steel: new THREE.MeshStandardMaterial({ color: '#c4c0b8', roughness: 0.18, metalness: 0.75 }),
    fridge: new THREE.MeshPhysicalMaterial({
      color: '#bfc0b8',
      roughness: 0.22,
      metalness: 0.42,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
    }),
    fridgeDark: new THREE.MeshStandardMaterial({ color: '#262420', roughness: 0.36, metalness: 0.15 }),
    blackFrame: new THREE.MeshStandardMaterial({ color: '#15130f', roughness: 0.24, metalness: 0.62 }),
    plant: new THREE.MeshStandardMaterial({ color: '#4b7a3d', roughness: 0.72, metalness: 0 }),
    plantDark: new THREE.MeshStandardMaterial({ color: '#244c2c', roughness: 0.78, metalness: 0 }),
    pot: new THREE.MeshStandardMaterial({ color: '#f2eee6', roughness: 0.7, metalness: 0 }),
    rug: new THREE.MeshStandardMaterial({ color: '#d8caba', roughness: 0.95, metalness: 0 }),
    book: new THREE.MeshStandardMaterial({ color: '#d7c8a7', roughness: 0.72, metalness: 0 }),
    brass: new THREE.MeshStandardMaterial({ color: '#b48a42', roughness: 0.28, metalness: 0.5 }),
    ovenGlass: new THREE.MeshPhysicalMaterial({
      color: '#070707',
      roughness: 0.08,
      metalness: 0.04,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#d7e8eb',
      roughness: 0.03,
      metalness: 0,
      transmission: 0.42,
      transparent: true,
      opacity: 0.38,
      clearcoat: 0.75,
    }),
    wall: new THREE.MeshStandardMaterial({ color: '#f4efe8', roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ color: '#d8cfc2', map: floorMap, roughness: 0.72 }),
    backsplash: new THREE.MeshStandardMaterial({ color: '#cec4b6', map: backsplashMap, roughness: 0.55 }),
    warmLight: new THREE.MeshBasicMaterial({ color: '#ffdca7' }),
  };
}

function roundedGeometry(width, height, depth, radius = 0.018, segments = 3) {
  const safeRadius = Math.max(
    0.0005,
    Math.min(
      radius,
      Math.max(0.0005, width / 2 - 0.001),
      Math.max(0.0005, height / 2 - 0.001),
      Math.max(0.0005, depth / 2 - 0.001),
    ),
  );
  return new RoundedBoxGeometry(width, height, depth, segments, safeRadius);
}

function addBox(parent, { x, y, z, width, height, depth, material, radius = 0.012, castShadow = true, receiveShadow = true }) {
  const geometry = roundedGeometry(width, height, depth, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, { x, y, z, width, height, material, rotation = [0, 0, 0], receiveShadow = true }) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, { x, y, z, radius = 0.018, length = 0.36, material, axis = 'x' }) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 28);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPlant(parent, mats, x, y, z, scale = 1) {
  addCylinder(parent, { x, y, z, radius: 0.055 * scale, length: 0.12 * scale, material: mats.pot, axis: 'y' });
  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2;
    const leaf = addBox(parent, {
      x: x + Math.cos(angle) * 0.04 * scale,
      y: y + 0.105 * scale + (i % 3) * 0.025 * scale,
      z: z + Math.sin(angle) * 0.035 * scale,
      width: 0.028 * scale,
      height: 0.12 * scale,
      depth: 0.014 * scale,
      material: i % 2 ? mats.plant : mats.plantDark,
      radius: 0.012 * scale,
    });
    leaf.rotation.z = -0.45 + (i % 3) * 0.45;
    leaf.rotation.y = angle;
  }
}

function addHandle(parent, mats, x, y, z, width) {
  addCylinder(parent, { x, y, z, radius: 0.012, length: Math.max(0.22, width * 0.68), material: mats.metal, axis: 'x' });
  addBox(parent, { x: x - width * 0.28, y, z: z - 0.012, width: 0.022, height: 0.022, depth: 0.045, material: mats.metal, radius: 0.006 });
  addBox(parent, { x: x + width * 0.28, y, z: z - 0.012, width: 0.022, height: 0.022, depth: 0.045, material: mats.metal, radius: 0.006 });
}

function addPanel(parent, mats, x, y, z, width, height, { handle = true, glass = false } = {}) {
  addBox(parent, { x, y, z, width, height, depth: 0.034, material: mats.face, radius: 0.018 });
  addBox(parent, { x, y, z: z + 0.02, width: width - 0.058, height: height - 0.058, depth: 0.009, material: glass ? mats.glass : mats.face, radius: 0.014 });
  addBox(parent, { x, y: y + height / 2 - 0.026, z: z + 0.028, width: width - 0.044, height: 0.01, depth: 0.01, material: mats.reveal, radius: 0.002 });
  addBox(parent, { x, y: y - height / 2 + 0.026, z: z + 0.028, width: width - 0.044, height: 0.01, depth: 0.01, material: mats.reveal, radius: 0.002 });
  if (handle) addHandle(parent, mats, x, y + height / 2 - 0.085, z + 0.055, width);
}

function addSplitDoors(parent, mats, x, y, z, width, height, split = 1, options = {}) {
  const gap = 0.02;
  const panelWidth = (width - gap * (split + 1)) / split;
  for (let i = 0; i < split; i += 1) {
    const px = x - width / 2 + gap + panelWidth / 2 + i * (panelWidth + gap);
    addPanel(parent, mats, px, y, z, panelWidth, height, options);
  }
}

function addBaseShell(parent, mats, x, z, w, d, h) {
  addBox(parent, { x, y: h / 2, z, width: w, height: h, depth: d, material: mats.body, radius: 0.012 });
  addBox(parent, { x, y: 0.065, z: z + d / 2 + 0.004, width: w * 0.92, height: 0.13, depth: 0.055, material: mats.shadow, radius: 0.006 });
  addBox(parent, { x, y: h + 0.035, z: z + 0.012, width: w + 0.045, height: 0.07, depth: d + 0.15, material: mats.counter, radius: 0.02 });
  addBox(parent, { x, y: h + 0.083, z: z + d / 2 + 0.088, width: w + 0.06, height: 0.02, depth: 0.035, material: mats.counter, radius: 0.006 });
}

function addOven(parent, mats, x, y, z, w) {
  addBox(parent, { x, y, z, width: w - 0.08, height: 0.44, depth: 0.042, material: mats.ovenGlass, radius: 0.018 });
  addBox(parent, { x, y: y + 0.17, z: z + 0.03, width: w - 0.16, height: 0.052, depth: 0.018, material: mats.metal, radius: 0.006 });
  addBox(parent, { x, y, z: z + 0.032, width: w - 0.24, height: 0.24, depth: 0.014, material: mats.glass, radius: 0.012 });
  addCylinder(parent, { x: x - w * 0.22, y: y + 0.18, z: z + 0.052, radius: 0.024, length: 0.018, material: mats.steel, axis: 'z' });
  addCylinder(parent, { x: x + w * 0.22, y: y + 0.18, z: z + 0.052, radius: 0.024, length: 0.018, material: mats.steel, axis: 'z' });
}

function addSink(parent, mats, x, y, z, w, d) {
  addBox(parent, { x, y, z, width: w * 0.54, height: 0.035, depth: d * 0.44, material: mats.steel, radius: 0.028 });
  addBox(parent, { x, y: y + 0.018, z, width: w * 0.44, height: 0.018, depth: d * 0.34, material: mats.shadow, radius: 0.02 });
  addCylinder(parent, { x: x + w * 0.19, y: y + 0.072, z: z - d * 0.08, radius: 0.016, length: 0.12, material: mats.steel, axis: 'y' });
  addCylinder(parent, { x: x + w * 0.19, y: y + 0.13, z: z - d * 0.02, radius: 0.012, length: 0.16, material: mats.steel, axis: 'z' });
  addCylinder(parent, { x: x + w * 0.19, y: y + 0.13, z: z + d * 0.08, radius: 0.012, length: 0.12, material: mats.steel, axis: 'z' });
}

function addOpenRack(parent, mats, x, y, z, width = 0.78, height = 0.68, depth = 0.31) {
  const post = 0.025;
  const shelf = 0.035;
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  [-1, 1].forEach((sideX) => {
    [-1, 1].forEach((sideZ) => {
      addBox(parent, {
        x: x + sideX * halfW,
        y,
        z: z + sideZ * halfD,
        width: post,
        height,
        depth: post,
        material: mats.blackFrame,
        radius: 0.004,
      });
    });
  });
  [-0.28, 0, 0.28].forEach((offsetY) => {
    addBox(parent, { x, y: y + offsetY, z, width: width + post, height: shelf, depth, material: mats.counter, radius: 0.006 });
  });
  addBox(parent, { x: x - 0.18, y: y + 0.19, z: z + 0.02, width: 0.16, height: 0.19, depth: 0.05, material: mats.book, radius: 0.004 });
  addBox(parent, { x: x - 0.02, y: y + 0.18, z: z + 0.02, width: 0.05, height: 0.18, depth: 0.08, material: mats.pot, radius: 0.012 });
  addPlant(parent, mats, x + 0.23, y + 0.19, z + 0.02, 0.65);
  addBox(parent, { x: x + 0.18, y: y - 0.1, z: z + 0.02, width: 0.2, height: 0.06, depth: 0.13, material: mats.steel, radius: 0.01 });
}

function addKitchenRail(parent, mats, x, y, z) {
  addCylinder(parent, { x, y, z, radius: 0.01, length: 1.05, material: mats.blackFrame, axis: 'x' });
  [-0.35, -0.18, 0.02, 0.24, 0.42].forEach((offset, index) => {
    addCylinder(parent, { x: x + offset, y: y - 0.07, z, radius: 0.006, length: 0.14, material: mats.blackFrame, axis: 'y' });
    addBox(parent, {
      x: x + offset,
      y: y - 0.16,
      z: z + 0.02,
      width: index % 2 ? 0.06 : 0.1,
      height: 0.08,
      depth: 0.035,
      material: index % 2 ? mats.steel : mats.plantDark,
      radius: 0.006,
    });
  });
}

function addBaseModule(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = z + d / 2 + 0.032;
  addBaseShell(parent, mats, x, z, w, d, h);

  if (item.id === 'drawers-800') {
    const drawerHeight = 0.19;
    for (let row = 0; row < 3; row += 1) {
      const y = 0.26 + row * 0.22;
      addPanel(parent, mats, x, y, frontZ, w - 0.05, drawerHeight, { handle: false });
      addHandle(parent, mats, x, y + drawerHeight * 0.25, frontZ + 0.058, w - 0.1);
    }
  } else if (item.id === 'oven-600') {
    addSplitDoors(parent, mats, x, 0.2, frontZ, w, 0.27, 1);
    addOven(parent, mats, x, 0.57, frontZ + 0.012, w);
  } else if (item.id === 'sink-800') {
    addSplitDoors(parent, mats, x, 0.43, frontZ, w, 0.68, 2);
    addSink(parent, mats, x, h + 0.095, z + 0.025, w, d);
  } else {
    addSplitDoors(parent, mats, x, 0.43, frontZ, w, 0.68, w > 0.65 ? 2 : 1);
  }
}

function addTallModule(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = z + d / 2 + 0.032;
  addBox(parent, { x, y: h / 2, z, width: w, height: h, depth: d, material: mats.body, radius: 0.016 });
  addBox(parent, { x, y: h - 0.11, z: frontZ + 0.005, width: w - 0.06, height: 0.22, depth: 0.05, material: mats.counter, radius: 0.014 });
  addBox(parent, { x, y: 1.43, z: frontZ + 0.018, width: w - 0.07, height: 0.98, depth: 0.04, material: mats.fridge, radius: 0.018 });
  addBox(parent, { x, y: 0.54, z: frontZ + 0.018, width: w - 0.07, height: 0.72, depth: 0.04, material: mats.fridge, radius: 0.018 });
  addBox(parent, { x, y: 1.02, z: frontZ + 0.05, width: w - 0.12, height: 0.024, depth: 0.018, material: mats.fridgeDark, radius: 0.004 });
  addBox(parent, { x: x - w * 0.31, y: 1.12, z: frontZ + 0.035, width: 0.024, height: 1.56, depth: 0.018, material: mats.counter, radius: 0.006 });
  addBox(parent, { x: x + w * 0.31, y: 1.12, z: frontZ + 0.035, width: 0.024, height: 1.56, depth: 0.018, material: mats.counter, radius: 0.006 });
  addBox(parent, { x, y: 0.065, z: frontZ - 0.035, width: w * 0.88, height: 0.13, depth: 0.055, material: mats.shadow, radius: 0.006 });
}

function addWallModule(parent, item, mats, x, z = -0.12) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const y = 1.56;
  const frontZ = z + d / 2 + 0.028;
  addBox(parent, { x, y, z, width: w, height: h, depth: d, material: mats.body, radius: 0.014 });
  addBox(parent, { x, y: y - h / 2 - 0.034, z: frontZ, width: w * 0.92, height: 0.024, depth: 0.024, material: mats.warmLight, radius: 0.004, castShadow: false });

  if (item.id.includes('glass')) {
    addOpenRack(parent, mats, x, y, frontZ - 0.08, w - 0.06, h - 0.05, d - 0.02);
  } else {
    addSplitDoors(parent, mats, x, y, frontZ, w, h - 0.075, w > 0.65 ? 2 : 1);
  }
}

function addRoom(scene, mats) {
  addPlane(scene, { x: 0, y: -0.006, z: 0.6, width: 7.8, height: 4.4, material: mats.floor, rotation: [-Math.PI / 2, 0, 0] });
  addBox(scene, { x: 0, y: 1.16, z: -0.5, width: 7.8, height: 2.45, depth: 0.09, material: mats.wall, radius: 0.002, receiveShadow: true });
  addBox(scene, { x: 0, y: 0.66, z: -0.438, width: 7.8, height: 0.68, depth: 0.028, material: mats.backsplash, radius: 0.004, receiveShadow: true });
  addBox(scene, { x: 0, y: 0.315, z: -0.412, width: 7.8, height: 0.028, depth: 0.03, material: mats.steel, radius: 0.004 });
  addBox(scene, { x: 0, y: 1.015, z: -0.412, width: 7.8, height: 0.026, depth: 0.03, material: mats.steel, radius: 0.004 });
}

function addPhotoReferenceDetails(scene, kitchen, mats) {
  addKitchenRail(scene, mats, -0.05, 1.02, -0.33);
  addBox(kitchen, { x: 2.0, y: 0.53, z: 0.38, width: 0.12, height: 0.9, depth: 0.78, material: mats.counter, radius: 0.014 });
  addBox(kitchen, { x: 1.98, y: 1.42, z: 0.38, width: 0.1, height: 1.06, depth: 0.36, material: mats.counter, radius: 0.012 });
  addBox(scene, { x: 0.22, y: 0.012, z: 1.25, width: 1.18, height: 0.018, depth: 0.58, material: mats.rug, radius: 0.02 });
  for (let stripe = -3; stripe <= 3; stripe += 1) {
    addBox(scene, {
      x: 0.22 + stripe * 0.15,
      y: 0.028,
      z: 1.25,
      width: 0.012,
      height: 0.006,
      depth: 0.5,
      material: mats.wall,
      radius: 0.002,
      castShadow: false,
    });
  }
  addPlant(scene, mats, -2.38, 0.08, 0.98, 1.8);
  addPlant(scene, mats, 2.38, 0.08, 0.98, 1.8);
  addBox(scene, { x: -0.42, y: 0.95, z: -0.32, width: 0.08, height: 0.16, depth: 0.06, material: mats.pot, radius: 0.012 });
  addPlant(scene, mats, -0.42, 1.05, -0.32, 0.65);
  addBox(scene, { x: 0.24, y: 0.97, z: -0.32, width: 0.18, height: 0.12, depth: 0.08, material: mats.steel, radius: 0.012 });
}

export default function KitchenPreview({ layout, material, wallLength, sideLength = 2200, scheme }) {
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
    renderer.toneMappingExposure = 1.02;
    renderer.physicallyCorrectLights = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const cameraTarget = new THREE.Vector3(0.22, 1.02, 0.1);
    camera.position.set(4.25, 2.35, 4.75);
    camera.lookAt(cameraTarget);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment(renderer);
    scene.environment = pmrem.fromScene(roomEnvironment, 0.03).texture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.minDistance = 1.85;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.minAzimuthAngle = -Math.PI * 0.62;
    controls.maxAzimuthAngle = Math.PI * 0.64;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.78;
    controls.panSpeed = 0.48;
    controls.update();

    const mats = createMaterials(material);
    const kitchen = new THREE.Group();
    scene.add(kitchen);
    addRoom(scene, mats);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xd9c7b1, 1.45);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 4.8);
    key.position.set(2.8, 5.3, 3.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -4.5;
    key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    scene.add(key);

    const fill = new THREE.PointLight(0xffdfbd, 38, 5.5);
    fill.position.set(-2.1, 2.2, 2.8);
    scene.add(fill);

    const underLight = new THREE.PointLight(0xffc982, 12, 3.2);
    underLight.position.set(0.2, 1.0, 0.16);
    scene.add(underLight);

    let cursor = -Math.min(wallLength / 1000, 4.7) / 2;
    const baseModules = modules.filter((item) => item.type === 'base' || item.type === 'tall');
    const wallModules = modules.filter((item) => item.type === 'wall');

    baseModules.forEach((item) => {
      const w = item.width / 1000;
      const centerX = cursor + w / 2;
      if (item.type === 'tall') addTallModule(kitchen, item, mats, centerX);
      else addBaseModule(kitchen, item, mats, centerX);
      cursor += w + 0.018;
    });

    let wallCursor = -Math.min(wallLength / 1000, 3.25) / 2 + 0.62;
    wallModules.forEach((item) => {
      const w = item.width / 1000;
      addWallModule(kitchen, item, mats, wallCursor + w / 2);
      wallCursor += w + 0.018;
    });

    if (scheme === 'corner') {
      const sideDepth = Math.min(sideLength / 1000, 3);
      addBox(scene, { x: 2.05, y: 1.16, z: sideDepth / 2 - 0.02, width: 0.09, height: 2.45, depth: sideDepth + 0.35, material: mats.wall, radius: 0.002, receiveShadow: true });
      addBox(scene, { x: 2.0, y: 0.66, z: sideDepth / 2 - 0.02, width: 0.03, height: 0.68, depth: sideDepth + 0.25, material: mats.backsplash, radius: 0.004 });
      addBaseModule(kitchen, { id: 'side-run', width: 620, height: 820, depth: sideDepth * 1000, type: 'base' }, mats, 1.68, sideDepth / 2 - 0.08);
      addWallModule(kitchen, { id: 'side-wall', width: 620, height: 720, depth: 340, type: 'wall' }, mats, 1.68, 0.75);
    }

    addPhotoReferenceDetails(scene, kitchen, mats);

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
      roomEnvironment.dispose?.();
      pmrem.dispose();
      renderer.dispose();
      scene.environment?.dispose?.();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
        else object.material?.dispose();
      });
      Object.values(mats).forEach((item) => {
        item.map?.dispose();
        item.dispose();
      });
    };
  }, [modules, material, wallLength, sideLength, scheme]);

  return (
    <div className="preview-shell" aria-label="3D превью кухни">
      <canvas ref={canvasRef} />
      <div className="preview-badge">Демо-визуализация: материалы, свет, фасады</div>
    </div>
  );
}
