import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { AssistantState, AuraTheme } from '../../types';
import { AURA_THEMES } from '../../data/auraThemes';

interface QuantumCoreProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  volume: number;
  frequencyData: number[];
  isMuted: boolean;
  onActionClick: () => void;
}

export const QuantumCore: React.FC<QuantumCoreProps> = ({
  state,
  auraTheme,
  volume,
  frequencyData,
  isMuted,
  onActionClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Three.js objects
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const coreWireframeRef = useRef<THREE.Mesh | null>(null);
  const ring1Ref = useRef<THREE.Group | null>(null);
  const ring2Ref = useRef<THREE.Group | null>(null);
  const ring3Ref = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const shockwavesRef = useRef<THREE.Mesh[]>([]);
  const pointLightRef = useRef<THREE.PointLight | null>(null);

  // Mouse parallax
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // Track pointer for smooth parallax
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const relX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const relY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    mousePos.current.targetX = Math.max(-1, Math.min(1, relX));
    mousePos.current.targetY = Math.max(-1, Math.min(1, relY));
  }, []);

  // Set up Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(currentTheme.primary), 3, 20);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // 1. Central Geodesic Core Mesh
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentTheme.primary),
      emissive: new THREE.Color(currentTheme.accent),
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // Outer wireframe shell
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(currentTheme.accent),
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);
    coreWireframeRef.current = wireMesh;

    // 2. Concentric Gyroscopic Cyber-Rings
    const createGyroRing = (radius: number, tube: number, segs: number, colorHex: string) => {
      const group = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, segs);
      const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.9,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(mesh);

      // Add orbiting satellite node
      const nodeGeo = new THREE.SphereGeometry(tube * 2.2, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(radius, 0, 0);
      group.add(node);

      return group;
    };

    const ring1 = createGyroRing(2.1, 0.035, 64, currentTheme.primary);
    const ring2 = createGyroRing(2.6, 0.03, 64, currentTheme.accent);
    const ring3 = createGyroRing(3.1, 0.025, 64, currentTheme.primary);

    scene.add(ring1);
    scene.add(ring2);
    scene.add(ring3);

    ring1Ref.current = ring1;
    ring2Ref.current = ring2;
    ring3Ref.current = ring3;

    // 3. 3D Neural Particle Constellation
    const particleCount = 380;
    const posArray = new Float32Array(particleCount * 3);
    const scaleArray = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.0 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = radius * Math.cos(phi);

      scaleArray[i] = Math.random();
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));

    // Simple canvas texture for circular glow particles
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pCtx = particleCanvas.getContext('2d')!;
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    const pTex = new THREE.CanvasTexture(particleCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      map: pTex,
      transparent: true,
      color: new THREE.Color(currentTheme.accent),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 4. Reactive Shockwaves
    const shockwaves: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const sGeo = new THREE.RingGeometry(1.6, 1.68, 64);
      const sMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(currentTheme.accent),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.userData = { progress: i * 0.33, speed: 0.015 };
      scene.add(sMesh);
      shockwaves.push(sMesh);
    }
    shockwavesRef.current = shockwaves;

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Event listeners for parallax
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      renderer.dispose();
    };
  }, []);

  // Update Theme Colors dynamically in 3D Scene
  useEffect(() => {
    if (!pointLightRef.current) return;
    const pColor = new THREE.Color(currentTheme.primary);
    const aColor = new THREE.Color(currentTheme.accent);

    pointLightRef.current.color = pColor;

    if (coreMeshRef.current) {
      const mat = coreMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color = pColor;
      mat.emissive = aColor;
    }

    if (coreWireframeRef.current) {
      const mat = coreWireframeRef.current.material as THREE.MeshBasicMaterial;
      mat.color = aColor;
    }

    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.color = aColor;
    }

    if (ring1Ref.current) {
      const mesh = ring1Ref.current.children[0] as THREE.Mesh;
      (mesh.material as THREE.MeshStandardMaterial).color = pColor;
      (mesh.material as THREE.MeshStandardMaterial).emissive = pColor;
    }
    if (ring2Ref.current) {
      const mesh = ring2Ref.current.children[0] as THREE.Mesh;
      (mesh.material as THREE.MeshStandardMaterial).color = aColor;
      (mesh.material as THREE.MeshStandardMaterial).emissive = aColor;
    }
    if (ring3Ref.current) {
      const mesh = ring3Ref.current.children[0] as THREE.Mesh;
      (mesh.material as THREE.MeshStandardMaterial).color = pColor;
      (mesh.material as THREE.MeshStandardMaterial).emissive = pColor;
    }
  }, [currentTheme]);

  // Main Render Animation Loop
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse parallax damping
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.06;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.06;

      if (cameraRef.current) {
        cameraRef.current.position.x = mousePos.current.x * 0.8;
        cameraRef.current.position.y = mousePos.current.y * 0.8;
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Speeds and scales according to assistant state
      let speedMult = 1;
      let coreScaleTarget = 1;
      let emissiveTarget = 0.45;

      switch (state) {
        case 'disconnected':
          speedMult = 0.35;
          coreScaleTarget = 0.95;
          emissiveTarget = 0.15;
          break;
        case 'connecting':
          speedMult = 2.4;
          coreScaleTarget = 1.05 + Math.sin(time * 6) * 0.05;
          emissiveTarget = 0.7;
          break;
        case 'idle':
          speedMult = 0.85;
          coreScaleTarget = 1.0 + Math.sin(time * 2) * 0.03;
          emissiveTarget = 0.4;
          break;
        case 'listening':
          speedMult = 1.2 + volume * 2.5;
          coreScaleTarget = 1.05 + volume * 0.4;
          emissiveTarget = 0.6 + volume * 0.4;
          break;
        case 'thinking':
          speedMult = 3.2;
          coreScaleTarget = 1.1 + Math.sin(time * 8) * 0.08;
          emissiveTarget = 0.85;
          break;
        case 'speaking':
          speedMult = 1.8 + volume * 3.5;
          coreScaleTarget = 1.1 + volume * 0.6;
          emissiveTarget = 0.8 + volume * 0.5;
          break;
        case 'interrupted':
          speedMult = 0.6;
          coreScaleTarget = 0.96;
          emissiveTarget = 0.5;
          break;
        case 'ending':
          speedMult = 0.4;
          coreScaleTarget = 0.92;
          emissiveTarget = 0.2;
          break;
      }

      // 1. Rotate Gyro Rings with unique speeds and axes
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = time * 0.4 * speedMult;
        ring1Ref.current.rotation.y = time * 0.6 * speedMult;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.y = -time * 0.5 * speedMult;
        ring2Ref.current.rotation.z = time * 0.35 * speedMult;
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.z = time * 0.55 * speedMult;
        ring3Ref.current.rotation.x = -time * 0.3 * speedMult;
      }

      // 2. Core geometry pulse & audio frequency reaction
      if (coreMeshRef.current && coreWireframeRef.current) {
        // Average frequency level for vertex energy
        const freqAvg =
          frequencyData.length > 0
            ? frequencyData.slice(0, 16).reduce((a, b) => a + b, 0) / 16
            : 0;

        const effectiveScale = coreScaleTarget + freqAvg * 0.35;
        coreMeshRef.current.scale.set(effectiveScale, effectiveScale, effectiveScale);
        coreWireframeRef.current.scale.set(
          effectiveScale * 1.06,
          effectiveScale * 1.06,
          effectiveScale * 1.06
        );

        coreMeshRef.current.rotation.y = time * 0.25 * speedMult;
        coreMeshRef.current.rotation.x = time * 0.15 * speedMult;
        coreWireframeRef.current.rotation.y = -time * 0.2 * speedMult;
        coreWireframeRef.current.rotation.z = time * 0.1 * speedMult;

        const mat = coreMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          emissiveTarget,
          0.1
        );
      }

      // 3. Neural Particles swirl & breath
      if (particlesRef.current) {
        particlesRef.current.rotation.y = time * 0.12 * speedMult;
        particlesRef.current.rotation.x = Math.sin(time * 0.08) * 0.2;

        const particleScale =
          state === 'speaking' || state === 'listening'
            ? 1 + volume * 0.5
            : 1 + Math.sin(time * 1.5) * 0.05;

        particlesRef.current.scale.set(particleScale, particleScale, particleScale);
      }

      // 4. Shockwave ripples when speaking or high volume
      if (shockwavesRef.current) {
        shockwavesRef.current.forEach((wave) => {
          if (state === 'speaking' || (state === 'listening' && volume > 0.08)) {
            wave.userData.progress += wave.userData.speed * (1 + volume * 2);
            if (wave.userData.progress > 1) {
              wave.userData.progress = 0;
            }
            const p = wave.userData.progress;
            const s = 1.0 + p * 2.5;
            wave.scale.set(s, s, s);
            (wave.material as THREE.MeshBasicMaterial).opacity = (1 - p) * (0.35 + volume * 0.4);
            wave.lookAt(cameraRef.current?.position || new THREE.Vector3(0, 0, 8));
          } else {
            (wave.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, volume, frequencyData]);

  return (
    <div
      ref={containerRef}
      id="aira-quantum-core-container"
      className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center select-none"
    >
      {/* Three.js 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        id="aira-quantum-3d-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Central Interactive Cyber Core Touchpad */}
      <button
        id="aira-quantum-core-trigger"
        type="button"
        onClick={onActionClick}
        aria-label={
          state === 'disconnected'
            ? 'Wake AIRA voice intelligence'
            : state === 'speaking'
            ? 'Interrupt AIRA'
            : 'Disconnect AIRA session'
        }
        className="relative z-10 w-[114px] h-[114px] sm:w-[130px] sm:h-[130px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 focus:outline-none group"
      >
        {/* Optical Glass Ring Overlay */}
        <div
          className="absolute inset-0 rounded-full border transition-all duration-500 backdrop-blur-md"
          style={{
            borderColor: state === 'disconnected' ? 'rgba(255, 255, 255, 0.12)' : currentTheme.border,
            background: 'radial-gradient(circle at 35% 35%, rgba(25, 32, 48, 0.65) 0%, rgba(9, 12, 20, 0.9) 100%)',
            boxShadow:
              state === 'disconnected'
                ? '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.15)'
                : `0 12px 40px ${currentTheme.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
          }}
        />

        {/* Ambient radial flare behind icon */}
        <div
          className="absolute w-16 h-16 rounded-full filter blur-md opacity-50 transition-colors duration-500"
          style={{ backgroundColor: currentTheme.primary }}
        />

        {/* Dynamic Status Symbol */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase transition-colors duration-300" style={{ color: currentTheme.accent }}>
            {state === 'disconnected' && 'INITIATE'}
            {state === 'connecting' && 'LINKING'}
            {state === 'idle' && (isMuted ? 'MUTED' : 'ONLINE')}
            {state === 'listening' && (isMuted ? 'MUTED' : 'LISTENING')}
            {state === 'thinking' && 'COMPUTING'}
            {state === 'speaking' && 'SPEAKING'}
            {state === 'interrupted' && 'YIELDING'}
            {state === 'ending' && 'RESTING'}
          </span>
          <span className="text-[9px] text-slate-400 font-sans tracking-wide mt-0.5">
            {state === 'disconnected' && 'Tap to Wake'}
            {state === 'speaking' && 'Tap to Interrupt'}
            {state !== 'disconnected' && state !== 'speaking' && 'Neural Core v2'}
          </span>
        </div>
      </button>
    </div>
  );
};
