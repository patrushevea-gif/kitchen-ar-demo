import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { kitchenModules } from '../data/kitchen.js';

const moduleById = new Map(kitchenModules.map((item) => [item.id, item]));

function makeTexture(primary, secondary, mode = 'grain') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (mode === 'wood') {
    for (let y = 0; y < 256; y += 7) {
      ctx.strokeStyle = y % 21 === 0 ? secondary : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = y % 21 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * 0.08) * 5);
      ctx.bezierCurveTo(70, y - 8, 160, y + 10, 256, y + Math.sin(y * 0.12) * 5);
      ctx.stroke();
    }
  } else if (mode === 'stone') {
    for (let i = 0; i < 48; i += 1) {
      ctx.strokeStyle = i % 3 === 0 ? secondary : 'rgba(255,255,255,0.16)';
      ctx.lineWidth = Math.random() > 0.7 ? 1.6 : 0.8;
      ctx.beginPath();
      const y = Math.random() * 256;
      ctx.moveTo(-20, y);
      ctx.bezierCurveTo(70, y + Math.random() * 32 - 16, 160, y + Math.random() * 42 - 21, 276, y + Math.random() * 30 - 15);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 900; i += 1) {
      const shade = Math.random() > 0.5 ? '255,255,255' : '0,0,0';
      ctx.fillStyle = `rgba(${shade},0.035)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createMaterials(source) {
  const isLight = source.face.toLowerCase().startsWith('#f');
  const counterMode = source.counter === '#9b7a55' ? 'wood' : 'stone';
  const faceTexture = makeTexture(source.face, isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');
  const bodyTexture = makeTexture(source.body, 'rgba(80,65,50,0.09)');
  const counterTexture = makeTexture(source.counter, counterMode === 'wood' ? 'rgba(70,38,12,0.22)' : 'rgba(255,255,255,0.2)', counterMode);

  return {
    face: new THREE.MeshStandardMaterial({ color: source.face, map: faceTexture, roughness: 0.58, metalness: 0.02 }),
    body: new THREE.MeshStandardMaterial({ color: source.body, map: bodyTexture, roughness: 0.72, metalness: 0.02 }),
    counter: new THREE.MeshStandardMaterial({ color: source.counter, map: counterTexture, roughness: 0.46, metalness: 0.01 }),
    dark: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.5, metalness: 0.08 }),
    metal: new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.28, metalness: 0.55 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#cbd5d2',
      roughness: 0.08,
      metalness: 0,
      transmission: 0.25,
      transparent: true,
      opacity: 0.48,
    }),
    sink: new THREE.MeshStandardMaterial({ color: '#b9b8b2', roughness: 0.22, metalness: 0.45 }),
    wall: new THREE.MeshStandardMaterial({ color: '#f6f2ec', roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ color: '#ded6c9', roughness: 0.85 }),
  };
}

function addBox(parent, { x, y, z, width, height, depth, material, castShadow = true, receiveShadow = true }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function addDoor(parent, mats, x, y, z, width, height, split = 1) {
  const gap = 0.018;
  const panelWidth = (width - gap * (split + 1)) / split;
  for (let i = 0; i < split; i += 1) {
    const px = x - width / 2 + gap + panelWidth / 2 + i * (panelWidth + gap);
    addBox(parent, { x: px, y, z, width: panelWidth, height, depth: 0.026, material: mats.face });
    addBox(parent, { x: px, y: y + height / 2 - 0.05, z: z + 0.017, width: panelWidth * 0.82, height: 0.012, depth: 0.012, material: mats.metal });
  }
}

function addBaseModule(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = z + d / 2 + 0.018;

  addBox(parent, { x, y: h / 2, z, width: w, height: h, depth: d, material: mats.body });
  addBox(parent, { x, y: 0.06, z: frontZ - 0.03, width: w * 0.92, height: 0.12, depth: 0.04, material: mats.dark });
  addBox(parent, { x, y: h + 0.035, z, width: w + 0.02, height: 0.07, depth: d + 0.09, material: mats.counter });

  if (item.id === 'drawers-800') {
    for (let row = 0; row < 3; row += 1) {
      addBox(parent, {
        x,
        y: 0.23 + row * 0.21,
        z: frontZ,
        width: w - 0.045,
        height: 0.17,
        depth: 0.026,
        material: mats.face,
      });
      addBox(parent, { x, y: 0.3 + row * 0.21, z: frontZ + 0.017, width: w * 0.74, height: 0.012, depth: 0.012, material: mats.metal });
    }
  } else if (item.id === 'oven-600') {
    addDoor(parent, mats, x, 0.23, frontZ, w, 0.32, 1);
    addBox(parent, { x, y: 0.59, z: frontZ + 0.002, width: w - 0.07, height: 0.36, depth: 0.03, material: mats.dark });
    addBox(parent, { x, y: 0.75, z: frontZ + 0.02, width: w * 0.62, height: 0.018, depth: 0.014, material: mats.metal });
  } else if (item.id === 'sink-800') {
    addDoor(parent, mats, x, 0.43, frontZ, w, 0.72, 2);
    addBox(parent, { x, y: h + 0.08, z: z + 0.02, width: w * 0.52, height: 0.025, depth: d * 0.44, material: mats.sink });
    addBox(parent, { x: x + w * 0.18, y: h + 0.13, z: z + 0.03, width: 0.035, height: 0.11, depth: 0.035, material: mats.metal });
  } else {
    addDoor(parent, mats, x, 0.43, frontZ, w, 0.72, w > 0.65 ? 2 : 1);
  }
}

function addTallModule(parent, item, mats, x, z = 0) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const frontZ = z + d / 2 + 0.018;
  addBox(parent, { x, y: h / 2, z, width: w, height: h, depth: d, material: mats.body });
  addDoor(parent, mats, x, h / 2, frontZ, w, h - 0.12, 1);
  addBox(parent, { x, y: 0.06, z: frontZ - 0.03, width: w * 0.9, height: 0.12, depth: 0.04, material: mats.dark });
}

function addWallModule(parent, item, mats, x) {
  const w = item.width / 1000;
  const d = item.depth / 1000;
  const h = item.height / 1000;
  const y = 1.55;
  const z = -0.1;
  const frontZ = z + d / 2 + 0.018;
  addBox(parent, { x, y, z, width: w, height: h, depth: d, material: mats.body });

  if (item.id.includes('glass')) {
    addDoor(parent, mats, x, y, frontZ, w, h - 0.06, 2);
    addBox(parent, { x, y, z: frontZ + 0.018, width: w - 0.12, height: h - 0.16, depth: 0.018, material: mats.glass });
    addBox(parent, { x, y: y - 0.04, z: z + 0.02, width: w - 0.18, height: 0.016, depth: d - 0.08, material: mats.metal });
    addBox(parent, { x, y: y + 0.18, z: z + 0.02, width: w - 0.18, height: 0.016, depth: d - 0.08, material: mats.metal });
  } else {
    addDoor(parent, mats, x, y, frontZ, w, h - 0.06, w > 0.65 ? 2 : 1);
  }
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
    renderer.toneMappingExposure = 1.04;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const cameraTarget = new THREE.Vector3(0.25, 1.08, 0.15);
    camera.position.set(4.35, 2.75, 5.05);
    camera.lookAt(cameraTarget);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.minDistance = 2.15;
    controls.maxDistance = 8.5;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.64;
    controls.minAzimuthAngle = -Math.PI * 0.52;
    controls.maxAzimuthAngle = Math.PI * 0.58;
    controls.rotateSpeed = 0.68;
    controls.zoomSpeed = 0.82;
    controls.panSpeed = 0.55;
    controls.update();

    const mats = createMaterials(material);
    const kitchen = new THREE.Group();
    scene.add(kitchen);

    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.9);
    key.position.set(3.4, 5.8, 4.3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xfff0dc, 0.7);
    fill.position.set(-3.2, 2.8, 2.4);
    scene.add(fill);

    addBox(scene, { x: 0, y: -0.035, z: 0, width: 7.6, height: 0.05, depth: 3.4, material: mats.floor, receiveShadow: true });
    addBox(scene, { x: 0, y: 1.15, z: -0.45, width: 7.6, height: 2.4, depth: 0.08, material: mats.wall, receiveShadow: true });
    addBox(scene, { x: 0, y: 0.62, z: -0.39, width: 7.6, height: 0.58, depth: 0.025, material: mats.counter, receiveShadow: true });

    let cursor = -Math.min(wallLength / 1000, 4.6) / 2;
    const baseModules = modules.filter((item) => item.type === 'base' || item.type === 'tall');
    const wallModules = modules.filter((item) => item.type === 'wall');

    baseModules.forEach((item) => {
      const w = item.width / 1000;
      const centerX = cursor + w / 2;
      if (item.type === 'tall') addTallModule(kitchen, item, mats, centerX);
      else addBaseModule(kitchen, item, mats, centerX);
      cursor += w + 0.018;
    });

    let wallCursor = -Math.min(wallLength / 1000, 3.2) / 2 + 0.62;
    wallModules.forEach((item) => {
      const w = item.width / 1000;
      addWallModule(kitchen, item, mats, wallCursor + w / 2);
      wallCursor += w + 0.018;
    });

    if (scheme === 'corner') {
      const sideDepth = Math.min(sideLength / 1000, 3);
      addBox(scene, { x: 2.05, y: 1.15, z: sideDepth / 2 - 0.02, width: 0.08, height: 2.4, depth: sideDepth + 0.3, material: mats.wall, receiveShadow: true });
      addBaseModule(kitchen, { id: 'side-run', width: 600, height: 820, depth: sideDepth * 1000, type: 'base' }, mats, 1.68, sideDepth / 2 - 0.08);
      addWallModule(kitchen, { id: 'side-wall', width: 600, height: 720, depth: 340, type: 'wall' }, mats, 1.68);
    }

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
      renderer.dispose();
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
      <div className="preview-badge">Реалистичная демо-сборка</div>
    </div>
  );
}
