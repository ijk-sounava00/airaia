import * as THREE from 'three';

/**
 * Custom GLSL Shaders for Futuristic Holographic Anime Companion
 * Features:
 * - Animated scanlines traveling along Y axis
 * - Fresnel rim edge illumination (ethereal holographic outline)
 * - Soft anime cel-shading + glowing translucency
 * - Audio-reactive surface pulsation and vertex jitter
 * - Color theme synchronization
 */

export interface HologramUniforms {
  uTime: { value: number };
  uColorPrimary: { value: THREE.Color };
  uColorAccent: { value: THREE.Color };
  uFresnelPower: { value: number };
  uScanlineFrequency: { value: number };
  uScanlineSpeed: { value: number };
  uOpacity: { value: number };
  uAudioLevel: { value: number };
  uGlitchIntensity: { value: number };
}

export function createHologramMaterial(
  primaryColor: string = '#06b6d4',
  accentColor: string = '#38bdf8',
  opacity: number = 0.85
): THREE.ShaderMaterial {
  const uniforms: HologramUniforms = {
    uTime: { value: 0 },
    uColorPrimary: { value: new THREE.Color(primaryColor) },
    uColorAccent: { value: new THREE.Color(accentColor) },
    uFresnelPower: { value: 2.0 },
    uScanlineFrequency: { value: 48.0 },
    uScanlineSpeed: { value: 1.8 },
    uOpacity: { value: opacity },
    uAudioLevel: { value: 0.0 },
    uGlitchIntensity: { value: 0.0 },
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uAudioLevel;
    uniform float uGlitchIntensity;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec3 pos = position;
      
      // Subtle audio-reactive vertex breathing
      float pulse = sin(uTime * 3.5 + pos.y * 3.0) * 0.006 * (1.0 + uAudioLevel * 2.0);
      pos += normal * pulse;

      // Holographic digital glitch displacement
      if (uGlitchIntensity > 0.05) {
        float slice = step(0.92, sin(pos.y * 20.0 + uTime * 25.0));
        float jitter = (random(vec2(pos.y, uTime)) - 0.5) * 0.05 * uGlitchIntensity * slice;
        pos.x += jitter;
        pos.z += jitter * 0.5;
      }
      
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;
      
      vec4 mvPosition = viewMatrix * worldPos;
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColorPrimary;
    uniform vec3 uColorAccent;
    uniform float uFresnelPower;
    uniform float uScanlineFrequency;
    uniform float uScanlineSpeed;
    uniform float uOpacity;
    uniform float uAudioLevel;
    uniform float uGlitchIntensity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel Rim factor (intense glow at grazing edges)
      float fresnel = 1.0 - abs(dot(viewDir, normal));
      fresnel = pow(clamp(fresnel, 0.0, 1.0), uFresnelPower);

      // Moving holographic scanlines
      float scanline = sin(vWorldPosition.y * uScanlineFrequency - uTime * uScanlineSpeed);
      scanline = (scanline + 1.0) * 0.5;
      scanline = mix(0.75, 1.15, scanline);

      // Audio-reactive brilliance boost
      float audioBoost = uAudioLevel * 0.35;

      // Color blending between primary and accent with fresnel highlighting
      vec3 baseColor = mix(uColorPrimary, uColorAccent, fresnel * 0.6 + vUv.y * 0.3);
      baseColor += uColorAccent * (fresnel * 1.3 + audioBoost);

      // Final opacity combines base transparency, scanlines, and edge fresnel
      float alpha = (fresnel * 0.85 + 0.32 + scanline * 0.16 + audioBoost * 0.25) * uOpacity;
      
      // Micro flicker
      float flicker = 1.0 - sin(uTime * 16.0) * 0.03;
      alpha *= flicker;

      if (uGlitchIntensity > 0.1) {
        baseColor = mix(baseColor, vec3(0.9, 0.95, 1.0), uGlitchIntensity * 0.4);
      }

      gl_FragColor = vec4(baseColor, clamp(alpha, 0.0, 1.0));
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as any,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Anime Hologram Skin Material:
 * Soft translucent porcelain skin with subtle warm undertones and glowing cyan holographic rim
 */
export function createAnimeSkinMaterial(
  rimColor: string = '#38bdf8',
  opacity: number = 0.92
): THREE.ShaderMaterial {
  const uniforms = {
    uTime: { value: 0 },
    uSkinColor: { value: new THREE.Color('#fff1f2') }, // delicate pale rosy porcelain
    uShadowColor: { value: new THREE.Color('#fed7aa') }, // soft warm shadow
    uRimColor: { value: new THREE.Color(rimColor) },
    uOpacity: { value: opacity },
  };

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uSkinColor;
    uniform vec3 uShadowColor;
    uniform vec3 uRimColor;
    uniform float uOpacity;
    uniform float uTime;

    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Simple light direction
      vec3 lightDir = normalize(vec3(0.2, 0.8, 1.0));
      float NdotL = dot(normal, lightDir);
      
      // Cel-shaded 2-tone anime skin gradient
      float diffuse = smoothstep(-0.1, 0.2, NdotL);
      vec3 col = mix(uShadowColor, uSkinColor, diffuse);

      // Holographic cyan rim glow
      float fresnel = 1.0 - abs(dot(viewDir, normal));
      fresnel = pow(clamp(fresnel, 0.0, 1.0), 2.5);
      col = mix(col, uRimColor, fresnel * 0.7);

      float alpha = uOpacity * (0.85 + fresnel * 0.25);
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as any,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Material for Anime Blush Cheeks
 */
export function createBlushMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fb7185'),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Material for Glowing Yellow/Cyan Chest Core Gem
 */
export function createChestCoreMaterial(
  coreColor: string = '#facc15',
  emissiveColor: string = '#fef08a'
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(coreColor),
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.98,
  });
}

