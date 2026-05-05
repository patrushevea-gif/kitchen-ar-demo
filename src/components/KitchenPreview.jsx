import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { kitchenModules } from '../data/kitchen.js';

const moduleById = new Map(kitchenModules.map((item) => [item.id, item]));

function addBox(scene, { x, y, z, width, height, depth, color, roughness = 0.72 }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export default function KitchenPreview({ layout, material, wallLength, sideLength = 2200, scheme }) {
  const canvasRef = useRef(null);

  const modules = useMemo(() => layout.map((id) => moduleById.get(id)).filter(Boolean), [layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(4.5, 3, 5.6);
    camera.lookAt(0, 1.2, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(3, 6, 4);
    sun.castShadow = true;
    scene.add(sun);

    const floor = addBox(scene, {
      x: 0,
      y: -0.035,
      z: 0,
      width: 7.6,
      height: 0.05,
      depth: 3.4,
      color: '#ded6c9',
      roughness: 0.85,
    });
    floor.receiveShadow = true;

    addBox(scene, {
      x: 0,
      y: 1.15,
      z: -0.45,
      width: 7.6,
      height: 2.4,
      depth: 0.08,
      color: '#f6f2ec',
      roughness: 0.9,
    });

    let cursor = -Math.min(wallLength / 1000, 4.6) / 2;
    const scale = 0.001;
    const baseModules = modules.filter((item) => item.type === 'base' || item.type === 'tall');
    const wallModules = modules.filter((item) => item.type === 'wall');

    baseModules.forEach((item) => {
      const w = item.width * scale;
      const h = item.height * scale;
      const d = item.depth * scale;
      const centerX = cursor + w / 2;
      addBox(scene, {
        x: centerX,
        y: h / 2,
        z: 0,
        width: w,
        height: h,
        depth: d,
        color: item.type === 'tall' ? material.body : material.face,
      });
      addBox(scene, {
        x: centerX,
        y: h + 0.035,
        z: 0,
        width: w,
        height: 0.07,
        depth: d + 0.08,
        color: material.counter,
      });
      cursor += w + 0.018;
    });

    let wallCursor = -Math.min(wallLength / 1000, 3.2) / 2 + 0.62;
    wallModules.forEach((item) => {
      const w = item.width * scale;
      const h = item.height * scale;
      const d = item.depth * scale;
      addBox(scene, {
        x: wallCursor + w / 2,
        y: 1.55,
        z: -0.1,
        width: w,
        height: h,
        depth: d,
        color: item.id.includes('glass') ? '#d8ddd9' : material.body,
      });
      wallCursor += w + 0.018;
    });

    if (scheme === 'corner') {
      const sideDepth = Math.min(sideLength / 1000, 3);
      addBox(scene, {
        x: 2.2,
        y: 0.41,
        z: sideDepth / 2 - 0.08,
        width: 0.58,
        height: 0.82,
        depth: sideDepth,
        color: material.face,
      });
      addBox(scene, {
        x: 2.2,
        y: 0.855,
        z: sideDepth / 2 - 0.08,
        width: 0.64,
        height: 0.07,
        depth: sideDepth + 0.06,
        color: material.counter,
      });
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
      scene.rotation.y = Math.sin(Date.now() * 0.00035) * 0.035;
      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) object.material.dispose();
      });
    };
  }, [modules, material, wallLength, sideLength, scheme]);

  return (
    <div className="preview-shell" aria-label="3D превью кухни">
      <canvas ref={canvasRef} />
      <div className="preview-badge">Черновая 3D-сборка</div>
    </div>
  );
}
