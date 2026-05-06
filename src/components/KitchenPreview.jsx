import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { kitchenModules } from '../data/kitchen.js';

const moduleById = new Map(kitchenModules.map((item) => [item.id, item]));

function makeCanvasTexture(base, accent, mode = 'grain') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 384, 384);
  gradient.addColorStop(0, base);
  gradient.addColorStop(0.55, base);
  gradient.addColorStop(1, accent);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 384, 384);

  if (mode === 'wood') {
    for (let y = -20; y < 420; y += 8) {
      ctx.strokeStyle = y % 24 === 0 ? 'rgba(75,37,14,0.28)' : 'rgba(255,221,165,0.14)';
      ctx.lineWidth = y % 24 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(-30, y + Math.sin(y * 0.04) * 12);
      ctx.bezierCurveTo(120, y - 18, 230, y + 22, 420, y + Math.sin(y * 0.025) * 18);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 1200; i += 1) {
      const shade = i % 2 ? '255,255,255' : '0,0,0';
      const alpha = mode === 'facade' ? 0.025 : 0.018;
      ctx.fillStyle = `rgba(${shade},${alpha})`;
      ctx.fillRect(Math.random() * 384, Math.random() * 384, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(mode === 'wood' ? 2.6 : 1.35, mode === 'wood' ? 1.1 : 1.8);
  texture.anisotropy = 8;
  return texture;
}

function createMaterials(source) {
  const faceTexture = makeCanvasTexture(source.face, '#171411', 'facade');
  const woodTexture = makeCanvasTexture(source.counter, '#d4a06d', 'wood');
  const wallTexture = makeCanvasTexture('#d9d0c3', '#f4eee5', 'grain');

  return {
    face: new THREE.MeshPhysicalMaterial({
      color: source.face,
      map: faceTexture,
      roughness: 0.58,
      metalness: 0.02,
      clearcoat: 0.06,
      clearcoatRoughness: 0.74,
    }),
    darkFace: new THREE.MeshPhysicalMaterial({
      color: '#211f1c',
      map: faceTexture,
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.04,
    }),
    body: new THREE.MeshStandardMaterial({ color: source.body, roughness: 0.72, metalness: 0.01 }),
    wood: new THREE.MeshPhysicalMaterial({
      color: source.counter,
      map: woodTexture,
      roughness: 0.38,
      metalness: 0.01,
      clearcoat: 0.12,
      clearcoatRoughness: 0.42,
    }),
    black: new THREE.MeshStandardMaterial({ color: '#14120f', roughness: 0.42, metalness: 0.18 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9c6bd', roughness: 0.24, metalness: 0.55 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#070707',
      roughness: 0.12,
      metalness: 0.04,
      clearcoat: 0.7,
      transparent: true,
      opacity: 0.72,
    }),
    wall: new THREE.MeshStandardMaterial({ color: '#f0ebe4', roughness: 0.92 }),
    backsplash: new THREE.MeshStandardMaterial({ color: '#d2c9bd', map: wallTexture, roughness: 0.68 }),
    floor: new THREE.MeshStandardMaterial({ color: '#d7c7b3', roughness: 0.76 }),
    rug: new THREE.MeshStandardMaterial({ color: '#d3c4b2', roughness: 0.96 }),
    light: new THREE.MeshBasicMaterial({ color: '#ffd89a' }),
  };
}

function rounded(width, height, depth, radius = 0.012) {
  const safe = Math.max(
    0.0005,
    Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001),
  );
  return new RoundedBoxGeometry(width, height, depth, 3, safe);
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

function frontPanel(parent, mats, x, y, z, w, h, split = 1, handle = true) {
  const gap = 0.018;
  const panelW = (w - gap * (split + 1)) / split;
  for (let i = 0; i < split; i += 1) {
    const px = x - w / 2 + gap + panelW / 2 + i * (panelW + gap);
    box(parent, { x: px, y, z, w: panelW, h, d: 0.032, mat: mats.face, r: 0.012 });
    box(parent, { x: px, y: y + h / 2 - 0.028, z: z + 0.02, w: panelW * 0.86, h: 0.01, d: 0.012, mat: mats.black, r: 0.003 });
    if (handle) {
      cyl(parent, { x: px, y: y + h / 2 - 0.09, z: z + 0.054, radius: 0.008, length: panelW * 0.58, mat: mats.black });
    }
  }
}

function addBase(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = z + d / 2 + 0.032;
  box(parent, { x, y: h / 2, z, w, h, d, mat: mats.body, r: 0.01 });
  box(parent, { x, y: 0.065, z: frontZ - 0.035, w: w * 0.9, h: 0.13, d: 0.05, mat: mats.black, r: 0.004 });
  box(parent, { x, y: h + 0.035, z: z + 0.01, w: w + 0.05, h: 0.07, d: d + 0.17, mat: mats.wood, r: 0.014 });

  if (item.id === 'drawers-800') {
    for (let row = 0; row < 3; row += 1) {
      const y = 0.25 + row * 0.22;
      frontPanel(parent, mats, x, y, frontZ, w - 0.04, 0.19, 1, false);
      cyl(parent, { x, y: y + 0.045, z: frontZ + 0.056, radius: 0.008, length: w * 0.62, mat: mats.black });
    }
  } else if (item.id === 'oven-600') {
    frontPanel(parent, mats, x, 0.22, frontZ, w - 0.02, 0.28, 1);
    box(parent, { x, y: 0.58, z: frontZ + 0.012, w: w - 0.08, h: 0.42, d: 0.04, mat: mats.glass, r: 0.014 });
    box(parent, { x, y: 0.76, z: frontZ + 0.04, w: w * 0.52, h: 0.035, d: 0.012, mat: mats.metal, r: 0.004 });
  } else if (item.id === 'sink-800') {
    frontPanel(parent, mats, x, 0.43, frontZ, w - 0.02, 0.68, 2);
    box(parent, { x, y: h + 0.088, z: z + 0.02, w: w * 0.52, h: 0.028, d: d * 0.4, mat: mats.metal, r: 0.02 });
    cyl(parent, { x: x + w * 0.18, y: h + 0.14, z: z + 0.02, radius: 0.012, length: 0.14, mat: mats.metal, axis: 'z' });
  } else {
    frontPanel(parent, mats, x, 0.43, frontZ, w - 0.02, 0.68, w > 0.65 ? 2 : 1);
  }
}

function addTall(parent, item, mats, x) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = d / 2 + 0.03;
  box(parent, { x, y: h / 2, z: 0, w, h, d, mat: mats.body, r: 0.012 });
  box(parent, { x, y: 1.42, z: frontZ + 0.012, w: w - 0.065, h: 0.98, d: 0.042, mat: mats.metal, r: 0.012 });
  box(parent, { x, y: 0.54, z: frontZ + 0.012, w: w - 0.065, h: 0.72, d: 0.042, mat: mats.metal, r: 0.012 });
  box(parent, { x, y: 1.02, z: frontZ + 0.045, w: w - 0.12, h: 0.018, d: 0.014, mat: mats.black, r: 0.002 });
  box(parent, { x: x - w * 0.32, y: 1.12, z: frontZ + 0.028, w: 0.03, h: 1.62, d: 0.02, mat: mats.wood, r: 0.004 });
  box(parent, { x: x + w * 0.32, y: 1.12, z: frontZ + 0.028, w: 0.03, h: 1.62, d: 0.02, mat: mats.wood, r: 0.004 });
}

function addWall(parent, item, mats, x, z = -0.12) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const y = 1.56;
  const frontZ = z + d / 2 + 0.028;
  box(parent, { x, y, z, w, h, d, mat: mats.body, r: 0.01 });
  box(parent, { x, y: y - h / 2 - 0.034, z: frontZ, w: w * 0.92, h: 0.022, d: 0.02, mat: mats.light, r: 0.003, shadow: false });

  if (item.id.includes('glass')) {
    const shelfW = w - 0.08;
    const shelfH = h - 0.06;
    [-1, 1].forEach((sideX) => {
      box(parent, { x: x + sideX * shelfW / 2, y, z: frontZ - 0.08, w: 0.024, h: shelfH, d: d - 0.04, mat: mats.black, r: 0.003 });
    });
    [-0.24, 0.02, 0.28].forEach((offset) => {
      box(parent, { x, y: y + offset, z: frontZ - 0.08, w: shelfW, h: 0.03, d: d - 0.04, mat: mats.wood, r: 0.004 });
    });
    box(parent, { x: x - 0.16, y: y + 0.18, z: frontZ - 0.01, w: 0.15, h: 0.17, d: 0.05, mat: mats.wood, r: 0.004 });
    box(parent, { x: x + 0.12, y: y - 0.09, z: frontZ - 0.01, w: 0.18, h: 0.055, d: 0.12, mat: mats.metal, r: 0.006 });
  } else {
    frontPanel(parent, mats, x, y, frontZ, w - 0.02, h - 0.075, w > 0.65 ? 2 : 1);
  }
}

function addRoom(scene, mats) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 4.4), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.006, 0.6);
  floor.receiveShadow = true;
  scene.add(floor);
  box(scene, { x: 0, y: 1.16, z: -0.5, w: 7.8, h: 2.45, d: 0.08, mat: mats.wall, r: 0.002 });
  box(scene, { x: 0, y: 0.66, z: -0.438, w: 7.8, h: 0.68, d: 0.026, mat: mats.backsplash, r: 0.002 });
  box(scene, { x: 0, y: 1.015, z: -0.412, w: 7.8, h: 0.024, d: 0.026, mat: mats.metal, r: 0.002 });
}

function addReferenceDetails(scene, kitchen, mats) {
  cyl(scene, { x: -0.05, y: 1.02, z: -0.33, radius: 0.009, length: 1.0, mat: mats.black });
  [-0.34, -0.12, 0.1, 0.32].forEach((offset) => {
    cyl(scene, { x: -0.05 + offset, y: 0.94, z: -0.33, radius: 0.005, length: 0.12, mat: mats.black, axis: 'y' });
  });
  box(scene, { x: 0.18, y: 0.012, z: 1.25, w: 1.14, h: 0.018, d: 0.58, mat: mats.rug, r: 0.014, shadow: false });
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
    renderer.toneMappingExposure = 0.98;
    renderer.physicallyCorrectLights = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const target = new THREE.Vector3(0.18, 1.02, 0.12);
    camera.position.set(4.2, 2.25, 4.6);
    camera.lookAt(target);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment(renderer);
    scene.environment = pmrem.fromScene(roomEnvironment, 0.03).texture;

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

    const ambient = new THREE.HemisphereLight(0xffffff, 0xd7c5af, 1.35);
    scene.add(ambient);

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

    const baseModules = modules.filter((item) => item.type === 'base' || item.type === 'tall');
    const wallModules = modules.filter((item) => item.type === 'wall');
    let cursor = -Math.min(wallLength / 1000, 4.7) / 2;

    baseModules.forEach((item) => {
      const w = item.width / 1000;
      const centerX = cursor + w / 2;
      if (item.type === 'tall') addTall(kitchen, item, mats, centerX);
      else addBase(kitchen, item, mats, centerX);
      cursor += w + 0.018;
    });

    let wallCursor = -Math.min(wallLength / 1000, 3.25) / 2 + 0.62;
    wallModules.forEach((item) => {
      const w = item.width / 1000;
      addWall(kitchen, item, mats, wallCursor + w / 2);
      wallCursor += w + 0.018;
    });

    if (scheme === 'corner') {
      const sideDepth = Math.min(sideLength / 1000, 3);
      addBase(kitchen, { id: 'side-run', width: 540, height: 820, depth: sideDepth * 1000, type: 'base' }, mats, 1.82, sideDepth / 2 - 0.08);
      addWall(kitchen, { id: 'side-wall', width: 540, height: 720, depth: 340, type: 'wall' }, mats, 1.82, 0.75);
    }

    addReferenceDetails(scene, kitchen, mats);

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
      <div className="preview-badge">Графит шагрень, дерево, свет, AR-сборка</div>
    </div>
  );
}
