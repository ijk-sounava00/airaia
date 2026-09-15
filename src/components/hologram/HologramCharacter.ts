import * as THREE from 'three';
import { AssistantState, CharacterEmotion } from '../../types';
import {
  createHologramMaterial,
  createAnimeSkinMaterial,
  createBlushMaterial,
  createChestCoreMaterial,
  HologramUniforms,
} from './HologramShader';

export interface CharacterAnimationState {
  state: AssistantState;
  emotion: CharacterEmotion;
  volume: number; // 0 to 1 audio volume
  frequencies: number[]; // 32 frequency bins
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  isInterrupted: boolean;
  mousePos: { x: number; y: number }; // normalized -1 to 1
}

export class HologramCharacter {
  public group: THREE.Group;
  private hologramMaterials: THREE.ShaderMaterial[] = [];
  private skinMaterials: THREE.ShaderMaterial[] = [];

  // Articulated Groups (Bones / Joints)
  private rootBone: THREE.Group;
  private spineBone: THREE.Group;
  private chestBone: THREE.Group;
  private neckBone: THREE.Group;
  private headBone: THREE.Group;
  private leftArmBone: THREE.Group;
  private rightArmBone: THREE.Group;
  private leftForearmBone: THREE.Group;
  private rightForearmBone: THREE.Group;
  private leftHandBone: THREE.Group;
  private rightHandBone: THREE.Group;

  // Legs & Skirt
  private skirtGroup: THREE.Group;
  private leftLegBone: THREE.Group;
  private rightLegBone: THREE.Group;

  // Hair Nodes for physics sway
  private hairBangsGroup: THREE.Group;
  private leftHairStrand: THREE.Group;
  private rightHairStrand: THREE.Group;
  private highSidePonytail: THREE.Group;
  private hairRibbonGroup: THREE.Group;

  // Facial Rig Nodes
  private leftEyeGroup: THREE.Group;
  private rightEyeGroup: THREE.Group;
  private leftIris: THREE.Mesh;
  private rightIris: THREE.Mesh;
  private leftUpperLid: THREE.Mesh;
  private rightUpperLid: THREE.Mesh;
  private leftLowerLid: THREE.Mesh;
  private rightLowerLid: THREE.Mesh;
  private rightWinkArc: THREE.Mesh; // Cute anime wink curve (^)
  private leftEyebrow: THREE.Mesh;
  private rightEyebrow: THREE.Mesh;
  private leftBlush: THREE.Mesh;
  private rightBlush: THREE.Mesh;
  private upperLip: THREE.Mesh;
  private lowerLip: THREE.Mesh;
  private mouthCavity: THREE.Mesh;

  // Chest Core Emblem
  private chestCoreMesh: THREE.Mesh;
  private chestRingMesh: THREE.Mesh;

  // Hologram Pedestal & VFX
  private pedestalGroup: THREE.Group;
  private outerRing: THREE.Mesh;
  private innerRing: THREE.Mesh;
  private glyphRing: THREE.Mesh;
  private lightCone: THREE.Mesh;
  private particles: THREE.Points;

  // Animation Timers & State
  private clock = new THREE.Clock();
  private blinkTimer = 0;
  private blinkInterval = 3.8;
  private blinkProgress = 0; // 0 = open, 1 = closed
  private isBlinking = false;
  private glitchTimer = 0;

  // Smoothed Animation Targets (for buttery-smooth transitions)
  private currentHeadRot = new THREE.Euler(0, 0, 0);
  private targetHeadRot = new THREE.Euler(0, 0, 0);
  private currentEyeGaze = new THREE.Vector2(0, 0);
  private currentMouthOpen = 0;
  private currentMouthWidth = 1.0;
  private currentSmile = 0.2;
  private currentPout = 0;
  private currentBrowLift = 0;
  private currentBrowTilt = 0;
  private currentBlushOpacity = 0.55;
  private currentWinkFactor = 0; // 0 = normal eye, 1 = fully winking
  private currentChestBreathing = 0;
  private currentLeftArmRot = new THREE.Euler(0, 0, 0);
  private currentRightArmRot = new THREE.Euler(0, 0, 0);

  constructor(primaryColor: string = '#06b6d4', accentColor: string = '#38bdf8') {
    this.group = new THREE.Group();
    this.group.name = 'HologramAiraAnimeCharacter';

    // 1. Build Base Holographic Pedestal & Emitter VFX
    this.pedestalGroup = this.buildPedestal(primaryColor, accentColor);
    this.group.add(this.pedestalGroup);

    // 2. Build Character Hierarchy
    this.rootBone = new THREE.Group();
    this.rootBone.position.y = -0.52;
    this.group.add(this.rootBone);

    // Torso / Spine
    this.spineBone = new THREE.Group();
    this.rootBone.add(this.spineBone);

    // Flared Peplum / Skirt
    this.skirtGroup = new THREE.Group();
    this.skirtGroup.position.set(0, 0.15, 0);
    this.spineBone.add(this.skirtGroup);

    // Legs
    this.leftLegBone = new THREE.Group();
    this.leftLegBone.position.set(-0.11, 0.08, 0);
    this.spineBone.add(this.leftLegBone);

    this.rightLegBone = new THREE.Group();
    this.rightLegBone.position.set(0.11, 0.08, 0);
    this.spineBone.add(this.rightLegBone);

    this.chestBone = new THREE.Group();
    this.chestBone.position.y = 0.44;
    this.spineBone.add(this.chestBone);

    // Neck & Head
    this.neckBone = new THREE.Group();
    this.neckBone.position.y = 0.36;
    this.chestBone.add(this.neckBone);

    this.headBone = new THREE.Group();
    this.headBone.position.y = 0.15;
    this.neckBone.add(this.headBone);

    // Arms
    this.leftArmBone = new THREE.Group();
    this.leftArmBone.position.set(-0.32, 0.3, 0);
    this.chestBone.add(this.leftArmBone);

    this.leftForearmBone = new THREE.Group();
    this.leftForearmBone.position.set(-0.02, -0.3, 0);
    this.leftArmBone.add(this.leftForearmBone);

    this.leftHandBone = new THREE.Group();
    this.leftHandBone.position.set(0, -0.26, 0);
    this.leftForearmBone.add(this.leftHandBone);

    this.rightArmBone = new THREE.Group();
    this.rightArmBone.position.set(0.32, 0.3, 0);
    this.chestBone.add(this.rightArmBone);

    this.rightForearmBone = new THREE.Group();
    this.rightForearmBone.position.set(0.02, -0.3, 0);
    this.rightArmBone.add(this.rightForearmBone);

    this.rightHandBone = new THREE.Group();
    this.rightHandBone.position.set(0, -0.26, 0);
    this.rightForearmBone.add(this.rightHandBone);

    // Hair Groups
    this.hairBangsGroup = new THREE.Group();
    this.leftHairStrand = new THREE.Group();
    this.rightHairStrand = new THREE.Group();
    this.highSidePonytail = new THREE.Group();
    this.hairRibbonGroup = new THREE.Group();

    // 3. Assemble Full Anime Hologram Meshes
    this.buildBodyAndOutfitMeshes(primaryColor, accentColor);
    this.buildLegsAndBoots(primaryColor, accentColor);
    this.buildHeadAndFaceMeshes(primaryColor, accentColor);
    this.buildAnimeHairAndBow(primaryColor, accentColor);
    this.buildFloatingParticles(primaryColor);
  }

  /**
   * Builds holographic emitter platform with animated concentric rings and upward light column
   */
  private buildPedestal(primaryColor: string, accentColor: string): THREE.Group {
    const pedestal = new THREE.Group();
    pedestal.position.y = -1.25;

    const ringMat = createHologramMaterial(primaryColor, accentColor, 0.9);
    this.hologramMaterials.push(ringMat);

    // Base emitter disc
    const baseDiscGeo = new THREE.CylinderGeometry(1.2, 1.28, 0.05, 48);
    const baseDisc = new THREE.Mesh(baseDiscGeo, ringMat);
    pedestal.add(baseDisc);

    // Concentric rotating cyber rings
    const outerGeo = new THREE.TorusGeometry(1.15, 0.022, 16, 64);
    this.outerRing = new THREE.Mesh(outerGeo, ringMat);
    this.outerRing.rotation.x = Math.PI / 2;
    pedestal.add(this.outerRing);

    const glyphGeo = new THREE.TorusGeometry(0.85, 0.03, 16, 64);
    this.glyphRing = new THREE.Mesh(glyphGeo, ringMat);
    this.glyphRing.rotation.x = Math.PI / 2;
    pedestal.add(this.glyphRing);

    const innerGeo = new THREE.TorusGeometry(0.55, 0.02, 16, 48);
    this.innerRing = new THREE.Mesh(innerGeo, ringMat);
    this.innerRing.rotation.x = Math.PI / 2;
    pedestal.add(this.innerRing);

    // Upward Volumetric Holographic Light Cone
    const coneGeo = new THREE.CylinderGeometry(0.35, 1.15, 2.6, 32, 1, true);
    const coneUniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(accentColor) },
    };
    const coneMat = new THREE.ShaderMaterial({
      uniforms: coneUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float fade = (1.0 - vUv.y) * 0.22;
          float beam = sin(vUv.x * 30.0 + uTime * 2.0) * 0.05 + 0.95;
          gl_FragColor = vec4(uColor, fade * beam);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.lightCone = new THREE.Mesh(coneGeo, coneMat);
    this.lightCone.position.y = 1.35;
    pedestal.add(this.lightCone);

    return pedestal;
  }

  /**
   * Floating cyber particles ascending from hologram base
   */
  private buildFloatingParticles(primaryColor: string) {
    const count = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.6;
      positions[i * 3 + 1] = Math.random() * 2.4 - 1.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(primaryColor),
      size: 0.04,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  /**
   * Builds stylized anime female body, cyber suit, chest core emblem, and arms
   */
  private buildBodyAndOutfitMeshes(primaryColor: string, accentColor: string) {
    const holoMat = createHologramMaterial(primaryColor, accentColor, 0.88);
    const skinMat = createAnimeSkinMaterial(accentColor, 0.92);
    this.hologramMaterials.push(holoMat);
    this.skinMaterials.push(skinMat);

    // 1. Lower Spine / Waist
    const pelvisGeo = new THREE.CylinderGeometry(0.17, 0.21, 0.32, 18);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, holoMat);
    pelvisMesh.position.y = 0.16;
    this.spineBone.add(pelvisMesh);

    // Holographic cyber waist belt with glowing cyan piping
    const beltGeo = new THREE.TorusGeometry(0.2, 0.02, 12, 32);
    const beltMesh = new THREE.Mesh(beltGeo, holoMat);
    beltMesh.rotation.x = Math.PI / 2;
    beltMesh.position.y = 0.22;
    this.spineBone.add(beltMesh);

    // 2. Translucent Flared Peplum / Ruffled Skirt around hips (exact match to photo!)
    const skirtGeo = new THREE.ConeGeometry(0.36, 0.24, 24, 1, true);
    const skirtMat = createHologramMaterial('#ffffff', accentColor, 0.72);
    this.hologramMaterials.push(skirtMat);
    const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
    skirtMesh.rotation.x = Math.PI; // Flare downwards
    skirtMesh.position.y = 0.05;
    this.skirtGroup.add(skirtMesh);

    // Cyan glowing rim trim around the bottom edge of the peplum skirt
    const skirtTrimGeo = new THREE.TorusGeometry(0.36, 0.015, 8, 36);
    const skirtTrim = new THREE.Mesh(skirtTrimGeo, holoMat);
    skirtTrim.rotation.x = Math.PI / 2;
    skirtTrim.position.y = -0.07;
    this.skirtGroup.add(skirtTrim);

    // 3. Chest & Torso: Futuristic White/Cyan Bodice with anime contours
    const chestGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.38, 18);
    const chestMesh = new THREE.Mesh(chestGeo, holoMat);
    chestMesh.position.y = 0.18;
    this.chestBone.add(chestMesh);

    // Neck / Shoulders skin
    const upperChestSkinGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.15, 16);
    const upperChestSkin = new THREE.Mesh(upperChestSkinGeo, skinMat);
    upperChestSkin.position.y = 0.32;
    this.chestBone.add(upperChestSkin);

    // 4. Glowing Circular Yellow/Cyan Chest Core Emblem (Exact match to photo!)
    const coreCenterGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 24);
    const coreMat = createChestCoreMaterial('#facc15', '#fef08a');
    this.chestCoreMesh = new THREE.Mesh(coreCenterGeo, coreMat);
    this.chestCoreMesh.rotation.x = Math.PI / 2;
    this.chestCoreMesh.position.set(0, 0.24, 0.16);
    this.chestBone.add(this.chestCoreMesh);

    // Outer cyan glowing halo ring around the core
    const coreHaloGeo = new THREE.TorusGeometry(0.065, 0.012, 12, 28);
    this.chestRingMesh = new THREE.Mesh(coreHaloGeo, holoMat);
    this.chestRingMesh.position.set(0, 0.24, 0.16);
    this.chestBone.add(this.chestRingMesh);

    // Cyber Collar / Choker
    const collarGeo = new THREE.TorusGeometry(0.1, 0.018, 12, 24);
    const collarMesh = new THREE.Mesh(collarGeo, holoMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.35;
    this.chestBone.add(collarMesh);

    // Delicate anime neck
    const neckGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.2, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.08;
    this.neckBone.add(neckMesh);

    // 5. Arms with Detached Cyber Arm-Warmers / Sleeves (as seen in photo)
    this.buildArm(this.leftArmBone, this.leftForearmBone, this.leftHandBone, -1, holoMat, skinMat);
    this.buildArm(this.rightArmBone, this.rightForearmBone, this.rightHandBone, 1, holoMat, skinMat);
  }

  /**
   * Helper to build slender cyber anime arms with detached puffy sleeves & graceful hands
   */
  private buildArm(
    upperArm: THREE.Group,
    forearm: THREE.Group,
    hand: THREE.Group,
    side: number,
    holoMat: THREE.ShaderMaterial,
    skinMat: THREE.ShaderMaterial
  ) {
    // Shoulder node
    const shoulderGeo = new THREE.SphereGeometry(0.07, 16, 12);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, skinMat);
    upperArm.add(shoulderMesh);

    // Upper arm (bare skin anime look)
    const upperArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 12);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, skinMat);
    upperArmMesh.position.y = -0.15;
    upperArm.add(upperArmMesh);

    // Detached cyber sleeve top ring cuff
    const sleeveCuffGeo = new THREE.TorusGeometry(0.052, 0.012, 10, 20);
    const sleeveCuff = new THREE.Mesh(sleeveCuffGeo, holoMat);
    sleeveCuff.rotation.x = Math.PI / 2;
    sleeveCuff.position.y = -0.02;
    forearm.add(sleeveCuff);

    // Forearm: Detached White/Cyan Cyber Gauntlet / Sleeve
    const forearmGeo = new THREE.CylinderGeometry(0.052, 0.042, 0.26, 14);
    const forearmMesh = new THREE.Mesh(forearmGeo, holoMat);
    forearmMesh.position.y = -0.13;
    forearm.add(forearmMesh);

    // Glowing wrist cuff
    const wristCuffGeo = new THREE.TorusGeometry(0.046, 0.01, 10, 20);
    const wristCuff = new THREE.Mesh(wristCuffGeo, holoMat);
    wristCuff.rotation.x = Math.PI / 2;
    wristCuff.position.y = -0.24;
    forearm.add(wristCuff);

    // Hand palm
    const palmGeo = new THREE.BoxGeometry(0.055, 0.08, 0.025);
    const palmMesh = new THREE.Mesh(palmGeo, skinMat);
    palmMesh.position.y = -0.04;
    hand.add(palmMesh);

    // Slender anime fingers
    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.065, 8);
      const fingerMesh = new THREE.Mesh(fingerGeo, skinMat);
      fingerMesh.position.set((f - 1.5) * 0.014, -0.1, 0);
      hand.add(fingerMesh);
    }
    // Thumb
    const thumbGeo = new THREE.CylinderGeometry(0.008, 0.006, 0.045, 8);
    const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
    thumbMesh.position.set(-side * 0.03, -0.05, 0.012);
    thumbMesh.rotation.z = side * 0.45;
    hand.add(thumbMesh);
  }

  /**
   * Builds slender anime legs with cyber boots / glowing cuffs (for full-body hologram)
   */
  private buildLegsAndBoots(primaryColor: string, accentColor: string) {
    const skinMat = createAnimeSkinMaterial(accentColor, 0.92);
    const holoMat = createHologramMaterial(primaryColor, accentColor, 0.88);
    this.skinMaterials.push(skinMat);
    this.hologramMaterials.push(holoMat);

    const buildLeg = (legBone: THREE.Group, side: number) => {
      // Thigh (anime skin)
      const thighGeo = new THREE.CylinderGeometry(0.075, 0.058, 0.38, 14);
      const thighMesh = new THREE.Mesh(thighGeo, skinMat);
      thighMesh.position.y = -0.18;
      legBone.add(thighMesh);

      // Knee joint
      const kneeGeo = new THREE.SphereGeometry(0.055, 12, 10);
      const kneeMesh = new THREE.Mesh(kneeGeo, skinMat);
      kneeMesh.position.y = -0.37;
      legBone.add(kneeMesh);

      // Cyber Boot / Sock Top Cuff
      const bootCuffGeo = new THREE.TorusGeometry(0.065, 0.014, 10, 24);
      const bootCuff = new THREE.Mesh(bootCuffGeo, holoMat);
      bootCuff.rotation.x = Math.PI / 2;
      bootCuff.position.y = -0.42;
      legBone.add(bootCuff);

      // Lower leg / Boot
      const bootGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.36, 14);
      const bootMesh = new THREE.Mesh(bootGeo, holoMat);
      bootMesh.position.y = -0.58;
      legBone.add(bootMesh);

      // Cyber Shoe / Foot
      const footGeo = new THREE.BoxGeometry(0.07, 0.06, 0.14);
      const footMesh = new THREE.Mesh(footGeo, holoMat);
      footMesh.position.set(0, -0.76, 0.04);
      legBone.add(footMesh);
    };

    buildLeg(this.leftLegBone, -1);
    buildLeg(this.rightLegBone, 1);
  }

  /**
   * Sculpted 3D Anime Head, Expressive Eyes, Blush Cheeks, Eyelids, Eyebrows & Morphing Mouth
   */
  private buildHeadAndFaceMeshes(primaryColor: string, accentColor: string) {
    const skinMat = createAnimeSkinMaterial(accentColor, 0.94);
    const holoMat = createHologramMaterial(primaryColor, accentColor, 0.9);
    this.skinMaterials.push(skinMat);
    this.hologramMaterials.push(holoMat);

    // 1. Anime Head Contour (Tapered delicate chin & sweet cheekbones)
    const headGeo = new THREE.SphereGeometry(0.23, 24, 20);
    headGeo.scale(0.88, 1.08, 0.94);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.05;
    this.headBone.add(headMesh);

    // Delicate tapered anime chin / jawline
    const chinGeo = new THREE.ConeGeometry(0.15, 0.2, 16);
    chinGeo.scale(0.8, 1, 0.68);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.rotation.x = Math.PI;
    chinMesh.position.set(0, -0.11, 0.08);
    this.headBone.add(chinMesh);

    // Cute petite anime nose
    const noseGeo = new THREE.ConeGeometry(0.014, 0.035, 6);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.rotation.x = -Math.PI / 2.5;
    noseMesh.position.set(0, 0.03, 0.22);
    this.headBone.add(noseMesh);

    // 2. Rosy Anime Blush Cheeks (Glows softly on happy/wink!)
    const blushGeo = new THREE.CircleGeometry(0.038, 16);
    const blushMat = createBlushMaterial();

    this.leftBlush = new THREE.Mesh(blushGeo, blushMat);
    this.leftBlush.position.set(-0.12, 0.01, 0.19);
    this.leftBlush.rotation.y = -0.3;
    this.headBone.add(this.leftBlush);

    this.rightBlush = new THREE.Mesh(blushGeo, blushMat);
    this.rightBlush.position.set(0.12, 0.01, 0.19);
    this.rightBlush.rotation.y = 0.3;
    this.headBone.add(this.rightBlush);

    // 3. Large Anime Eyes (Left & Right)
    this.leftEyeGroup = new THREE.Group();
    this.leftEyeGroup.position.set(-0.09, 0.08, 0.185);
    this.headBone.add(this.leftEyeGroup);

    this.rightEyeGroup = new THREE.Group();
    this.rightEyeGroup.position.set(0.09, 0.08, 0.185);
    this.headBone.add(this.rightEyeGroup);

    // Sclera (Eye whites with clean translucent tint)
    const scleraGeo = new THREE.SphereGeometry(0.062, 16, 12);
    scleraGeo.scale(1.0, 1.25, 0.35);
    const scleraMat = createHologramMaterial('#f0f9ff', primaryColor, 0.95);
    this.hologramMaterials.push(scleraMat);

    const leftSclera = new THREE.Mesh(scleraGeo, scleraMat);
    const rightSclera = new THREE.Mesh(scleraGeo, scleraMat);
    this.leftEyeGroup.add(leftSclera);
    this.rightEyeGroup.add(rightSclera);

    // Irises (Deep glowing cyan anime eyes with gradient highlights)
    const irisGeo = new THREE.CircleGeometry(0.042, 24);
    const irisMat = createHologramMaterial(accentColor, '#ffffff', 0.98);
    this.hologramMaterials.push(irisMat);

    this.leftIris = new THREE.Mesh(irisGeo, irisMat);
    this.leftIris.position.set(0, 0, 0.026);
    this.leftEyeGroup.add(this.leftIris);

    this.rightIris = new THREE.Mesh(irisGeo, irisMat);
    this.rightIris.position.set(0, 0, 0.026);
    this.rightEyeGroup.add(this.rightIris);

    // Pupils (Deep midnight navy)
    const pupilGeo = new THREE.CircleGeometry(0.02, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x061129, transparent: true, opacity: 0.95 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.028);
    this.leftEyeGroup.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.028);
    this.rightEyeGroup.add(rightPupil);

    // Sparkling Anime Specular Highlights (Star & Circle catchlights)
    const shineGeo = new THREE.CircleGeometry(0.012, 12);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98 });
    const leftShine1 = new THREE.Mesh(shineGeo, shineMat);
    leftShine1.position.set(0.014, 0.018, 0.03);
    this.leftEyeGroup.add(leftShine1);

    const leftShine2 = new THREE.Mesh(new THREE.CircleGeometry(0.006, 8), shineMat);
    leftShine2.position.set(-0.012, -0.012, 0.03);
    this.leftEyeGroup.add(leftShine2);

    const rightShine1 = new THREE.Mesh(shineGeo, shineMat);
    rightShine1.position.set(0.014, 0.018, 0.03);
    this.rightEyeGroup.add(rightShine1);

    const rightShine2 = new THREE.Mesh(new THREE.CircleGeometry(0.006, 8), shineMat);
    rightShine2.position.set(-0.012, -0.012, 0.03);
    this.rightEyeGroup.add(rightShine2);

    // 4. Winking Arc Mesh for Right Eye (Playful anime wink `^` shape)
    const winkGeo = new THREE.TorusGeometry(0.045, 0.008, 8, 16, Math.PI * 0.7);
    const winkMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0 });
    this.rightWinkArc = new THREE.Mesh(winkGeo, winkMat);
    this.rightWinkArc.rotation.z = Math.PI * 0.15;
    this.rightWinkArc.position.set(0, 0.005, 0.034);
    this.rightEyeGroup.add(this.rightWinkArc);

    // 5. Eyelids (Upper & Lower for realistic blinking and expressions)
    const upperLidGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.018, 16, 1, false, 0, Math.PI);
    const lidMat = createHologramMaterial(accentColor, primaryColor, 0.95);
    this.hologramMaterials.push(lidMat);

    this.leftUpperLid = new THREE.Mesh(upperLidGeo, lidMat);
    this.leftUpperLid.rotation.z = Math.PI;
    this.leftUpperLid.position.set(0, 0.065, 0.032);
    this.leftEyeGroup.add(this.leftUpperLid);

    this.rightUpperLid = new THREE.Mesh(upperLidGeo, lidMat);
    this.rightUpperLid.rotation.z = Math.PI;
    this.rightUpperLid.position.set(0, 0.065, 0.032);
    this.rightEyeGroup.add(this.rightUpperLid);

    const lowerLidGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.014, 16, 1, false, 0, Math.PI);
    this.leftLowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
    this.leftLowerLid.position.set(0, -0.065, 0.03);
    this.leftEyeGroup.add(this.leftLowerLid);

    this.rightLowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
    this.rightLowerLid.position.set(0, -0.065, 0.03);
    this.rightEyeGroup.add(this.rightLowerLid);

    // 6. Expressive Eyebrows
    const browGeo = new THREE.BoxGeometry(0.085, 0.012, 0.02);
    const browMat = createHologramMaterial(accentColor, '#ffffff', 0.98);
    this.hologramMaterials.push(browMat);

    this.leftEyebrow = new THREE.Mesh(browGeo, browMat);
    this.leftEyebrow.position.set(-0.09, 0.17, 0.215);
    this.leftEyebrow.rotation.z = 0.06;
    this.headBone.add(this.leftEyebrow);

    this.rightEyebrow = new THREE.Mesh(browGeo, browMat);
    this.rightEyebrow.position.set(0.09, 0.17, 0.215);
    this.rightEyebrow.rotation.z = -0.06;
    this.headBone.add(this.rightEyebrow);

    // 7. Articulated Mouth & Lip-Sync Rig
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.065, 0.215);
    this.headBone.add(mouthGroup);

    // Upper Lip
    const lipGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.062, 12);
    const lipMat = createHologramMaterial(accentColor, primaryColor, 0.95);
    this.hologramMaterials.push(lipMat);

    this.upperLip = new THREE.Mesh(lipGeo, lipMat);
    this.upperLip.rotation.z = Math.PI / 2;
    this.upperLip.position.y = 0.007;
    mouthGroup.add(this.upperLip);

    // Lower Lip
    this.lowerLip = new THREE.Mesh(lipGeo, lipMat);
    this.lowerLip.rotation.z = Math.PI / 2;
    this.lowerLip.position.y = -0.007;
    mouthGroup.add(this.lowerLip);

    // Inner mouth cavity (revealed dynamically during speech)
    const cavityGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12);
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0x050a18, transparent: true, opacity: 0.85 });
    this.mouthCavity = new THREE.Mesh(cavityGeo, cavityMat);
    this.mouthCavity.rotation.z = Math.PI / 2;
    this.mouthCavity.position.set(0, 0, -0.01);
    this.mouthCavity.scale.set(0.1, 0.1, 0.1);
    mouthGroup.add(this.mouthCavity);
  }

  /**
   * Builds the distinctive Anime Hair Bow / Ribbon atop the head, high side ponytail, and fringe
   * (Exact match to the uploaded reference picture!)
   */
  private buildAnimeHairAndBow(primaryColor: string, accentColor: string) {
    const hairMat = createHologramMaterial(primaryColor, accentColor, 0.82);
    const ribbonMat = createHologramMaterial('#ffffff', accentColor, 0.92);
    this.hologramMaterials.push(hairMat);
    this.hologramMaterials.push(ribbonMat);

    // 1. DISTINCTIVE HAIR BOW / RIBBON (Perched atop head as shown in photo!)
    this.hairRibbonGroup.position.set(0.05, 0.26, -0.02);
    this.hairRibbonGroup.rotation.z = -0.15; // slight cute tilt
    this.headBone.add(this.hairRibbonGroup);

    // Bow Center Knot
    const knotGeo = new THREE.SphereGeometry(0.04, 12, 10);
    const knotMesh = new THREE.Mesh(knotGeo, ribbonMat);
    this.hairRibbonGroup.add(knotMesh);

    // Bow Left Loop
    const leftLoopGeo = new THREE.TorusGeometry(0.07, 0.025, 10, 24, Math.PI * 1.5);
    const leftLoop = new THREE.Mesh(leftLoopGeo, ribbonMat);
    leftLoop.rotation.z = Math.PI * 0.75;
    leftLoop.position.set(-0.065, 0.03, 0);
    this.hairRibbonGroup.add(leftLoop);

    // Bow Right Loop
    const rightLoopGeo = new THREE.TorusGeometry(0.07, 0.025, 10, 24, Math.PI * 1.5);
    const rightLoop = new THREE.Mesh(rightLoopGeo, ribbonMat);
    rightLoop.rotation.z = -Math.PI * 0.25;
    rightLoop.position.set(0.065, 0.03, 0);
    this.hairRibbonGroup.add(rightLoop);

    // Flowing ribbon tails draping down behind
    const ribbonTailGeo = new THREE.CylinderGeometry(0.02, 0.008, 0.24, 8);
    ribbonTailGeo.scale(1, 1, 0.3);
    const ribbonTail1 = new THREE.Mesh(ribbonTailGeo, ribbonMat);
    ribbonTail1.position.set(-0.04, -0.12, -0.04);
    ribbonTail1.rotation.z = 0.35;
    this.hairRibbonGroup.add(ribbonTail1);

    const ribbonTail2 = new THREE.Mesh(ribbonTailGeo, ribbonMat);
    ribbonTail2.position.set(0.04, -0.12, -0.04);
    ribbonTail2.rotation.z = -0.35;
    this.hairRibbonGroup.add(ribbonTail2);

    // 2. Front Bangs / Fringe framing the forehead
    this.hairBangsGroup.position.set(0, 0.14, 0.18);
    this.headBone.add(this.hairBangsGroup);

    for (let b = -4; b <= 4; b++) {
      const strandGeo = new THREE.ConeGeometry(0.042, 0.18 + Math.abs(b) * 0.02, 8);
      strandGeo.scale(0.85, 1, 0.3);
      const strand = new THREE.Mesh(strandGeo, hairMat);
      strand.rotation.x = Math.PI * 0.95;
      strand.rotation.z = b * -0.1;
      strand.position.set(b * 0.034, 0, Math.cos(b * 0.28) * 0.04);
      this.hairBangsGroup.add(strand);
    }

    // 3. Side Locks framing cheeks
    this.leftHairStrand.position.set(-0.17, 0.1, 0.06);
    this.headBone.add(this.leftHairStrand);
    const sideLockGeo = new THREE.ConeGeometry(0.048, 0.44, 8);
    sideLockGeo.scale(0.7, 1, 0.3);
    const leftLock = new THREE.Mesh(sideLockGeo, hairMat);
    leftLock.rotation.x = Math.PI;
    leftLock.position.y = -0.19;
    this.leftHairStrand.add(leftLock);

    this.rightHairStrand.position.set(0.17, 0.1, 0.06);
    this.headBone.add(this.rightHairStrand);
    const rightLock = new THREE.Mesh(sideLockGeo, hairMat);
    rightLock.rotation.x = Math.PI;
    rightLock.position.y = -0.19;
    this.rightHairStrand.add(rightLock);

    // 4. Back Hair Base
    const backHairGeo = new THREE.SphereGeometry(0.25, 20, 16);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, 0.06, -0.06);
    this.headBone.add(backHair);

    // 5. HIGH SWEPT SIDE PONYTAIL (Cascading on right side with cyber ring tie, matching photo!)
    this.highSidePonytail.position.set(0.22, 0.18, -0.08);
    this.headBone.add(this.highSidePonytail);

    // Cyber hair tie ring
    const tieGeo = new THREE.TorusGeometry(0.05, 0.016, 8, 20);
    const tieMat = createHologramMaterial(accentColor, '#ffffff', 0.96);
    this.hologramMaterials.push(tieMat);
    const tieMesh = new THREE.Mesh(tieGeo, tieMat);
    this.highSidePonytail.add(tieMesh);

    // Sweeping cascading ponytail locks
    const ponytailGeo1 = new THREE.CylinderGeometry(0.05, 0.012, 0.82, 12);
    ponytailGeo1.scale(1, 1, 0.45);
    const ponytailMesh1 = new THREE.Mesh(ponytailGeo1, hairMat);
    ponytailMesh1.position.set(0.08, -0.4, 0);
    ponytailMesh1.rotation.z = -0.25;
    this.highSidePonytail.add(ponytailMesh1);

    const ponytailGeo2 = new THREE.CylinderGeometry(0.038, 0.008, 0.65, 10);
    ponytailGeo2.scale(1, 1, 0.4);
    const ponytailMesh2 = new THREE.Mesh(ponytailGeo2, hairMat);
    ponytailMesh2.position.set(0.04, -0.32, 0.04);
    ponytailMesh2.rotation.z = -0.18;
    this.highSidePonytail.add(ponytailMesh2);
  }

  /**
   * Triggers a momentary holographic scanline glitch (e.g. on interrupt or connection)
   */
  public triggerGlitch(intensity: number = 0.6) {
    this.glitchTimer = intensity;
  }

  /**
   * Dynamic Color Theme Update (Synchronizes hologram glow with user's selected 10 color codes)
   */
  public updateThemeColors(primary: string, accent: string) {
    const primCol = new THREE.Color(primary);
    const accCol = new THREE.Color(accent);

    for (const mat of this.hologramMaterials) {
      if (mat.uniforms?.uColorPrimary) {
        mat.uniforms.uColorPrimary.value.copy(primCol);
      }
      if (mat.uniforms?.uColorAccent) {
        mat.uniforms.uColorAccent.value.copy(accCol);
      }
    }

    for (const mat of this.skinMaterials) {
      if (mat.uniforms?.uRimColor) {
        mat.uniforms.uRimColor.value.copy(accCol);
      }
    }

    if (this.particles?.material instanceof THREE.PointsMaterial) {
      this.particles.material.color.copy(primCol);
    }
  }

  /**
   * Main Frame Tick: updates breathing, gaze, facial expressions, lip-sync, and limb gestures
   */
  public update(animState: CharacterAnimationState) {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Hologram Shader Uniforms
    if (this.glitchTimer > 0) {
      this.glitchTimer = Math.max(0, this.glitchTimer - delta * 2.5);
    }

    for (const mat of this.hologramMaterials) {
      if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsedTime;
      if (mat.uniforms?.uAudioLevel) mat.uniforms.uAudioLevel.value = animState.volume;
      if (mat.uniforms?.uGlitchIntensity) mat.uniforms.uGlitchIntensity.value = this.glitchTimer;
    }

    for (const mat of this.skinMaterials) {
      if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsedTime;
    }

    // 2. Rotate Pedestal Emitter Rings & Float Particles
    if (this.outerRing) this.outerRing.rotation.z = elapsedTime * 0.45;
    if (this.glyphRing) this.glyphRing.rotation.z = -elapsedTime * 0.7;
    if (this.innerRing) this.innerRing.rotation.z = elapsedTime * 0.9;
    if (this.lightCone?.material instanceof THREE.ShaderMaterial) {
      this.lightCone.material.uniforms.uTime.value = elapsedTime;
    }

    if (this.particles) {
      const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const speedAttr = this.particles.geometry.getAttribute('speed') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const spd = speedAttr.array as Float32Array;

      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] += spd[i] * delta * 0.8;
        if (arr[i * 3 + 1] > 1.8) {
          arr[i * 3 + 1] = -1.1;
          arr[i * 3] = (Math.random() - 0.5) * 1.5;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Chest Core rotation/pulse
    if (this.chestCoreMesh) {
      this.chestCoreMesh.rotation.z = elapsedTime * 0.5;
      const corePulse = 1.0 + Math.sin(elapsedTime * 3.0) * 0.08 + animState.volume * 0.2;
      this.chestCoreMesh.scale.set(corePulse, corePulse, 1);
    }
    if (this.chestRingMesh) {
      this.chestRingMesh.rotation.z = -elapsedTime * 0.8;
    }

    // 3. Natural Breathing Animation (Subtle continuous spine & chest expansion)
    const breathingCycle = Math.sin(elapsedTime * 1.8);
    this.currentChestBreathing = THREE.MathUtils.lerp(this.currentChestBreathing, breathingCycle * 0.032, delta * 4);
    this.chestBone.position.y = 0.44 + this.currentChestBreathing;
    this.chestBone.scale.set(
      1 + this.currentChestBreathing * 0.35,
      1 + this.currentChestBreathing * 0.2,
      1 + this.currentChestBreathing * 0.5
    );

    // Floating subtle hover drift of the entire avatar
    this.rootBone.position.y = -0.52 + Math.sin(elapsedTime * 1.2) * 0.022;

    // 4. Natural Blinking System
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer >= this.blinkInterval) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.blinkInterval = 2.5 + Math.random() * 3.0;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 12;
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
    }
    const blinkAmount = Math.sin(this.blinkProgress);

    // 5. Emotional States & Target Expressions (From the Photo: Happy, Wink, Surprised, Thinking, Angry, etc.)
    let targetMouthOpen = 0;
    let targetMouthWidth = 1.0;
    let targetSmile = 0.15;
    let targetPout = 0;
    let targetBrowLift = 0;
    let targetBrowTilt = 0;
    let targetBlushOpacity = 0.5;
    let targetWink = 0;
    let targetHeadPitch = 0;
    let targetHeadYaw = 0;
    let targetHeadRoll = 0;

    // Eye Gaze tracking (smoothly tracks cursor / user)
    const targetGazeX = THREE.MathUtils.clamp(animState.mousePos.x * 0.025, -0.022, 0.022);
    const targetGazeY = THREE.MathUtils.clamp(-animState.mousePos.y * 0.02, -0.018, 0.018);
    this.currentEyeGaze.x = THREE.MathUtils.lerp(this.currentEyeGaze.x, targetGazeX, delta * 6);
    this.currentEyeGaze.y = THREE.MathUtils.lerp(this.currentEyeGaze.y, targetGazeY, delta * 6);

    this.leftIris.position.set(this.currentEyeGaze.x, this.currentEyeGaze.y, 0.026);
    this.rightIris.position.set(this.currentEyeGaze.x, this.currentEyeGaze.y, 0.026);

    // Map Active Emotion & State
    const activeEmotion = animState.emotion;

    switch (activeEmotion) {
      case 'happy':
        // Happy: Radiant smile, bright open eyes, blushing cheeks, cheerful head tilt
        targetSmile = 0.45;
        targetBrowLift = 0.025;
        targetBlushOpacity = 0.85;
        targetHeadRoll = 0.06;
        targetHeadPitch = -0.02;
        break;

      case 'wink':
        // Wink: Playful wink on right eye (^), radiant beaming smile, charming tilt, rosy blush!
        targetWink = 1.0;
        targetSmile = 0.48;
        targetBrowLift = 0.03;
        targetBlushOpacity = 0.9;
        targetHeadRoll = -0.08;
        targetHeadPitch = -0.03;
        break;

      case 'surprised':
        // Surprised: Wide eyes, raised brows, small cute round "o" mouth, head pulled back
        targetMouthOpen = 0.35;
        targetMouthWidth = 0.75;
        targetBrowLift = 0.045;
        targetHeadPitch = -0.06;
        targetSmile = 0.0;
        break;

      case 'thinking':
        // Thinking: Eyes glance up/away, head tilts thoughtfully, one brow arched, slight pursed mouth
        targetSmile = 0.08;
        targetBrowLift = 0.035;
        targetBrowTilt = 0.18;
        targetHeadPitch = 0.08;
        targetHeadRoll = -0.12;
        targetHeadYaw = 0.1 + Math.sin(elapsedTime * 2.0) * 0.04;
        break;

      case 'angry':
        // Angry / Pout: Cute anime pout! Brows furrowed inward, lips pursed, cheeks puffed
        targetSmile = -0.25;
        targetPout = 0.4;
        targetBrowLift = -0.02;
        targetBrowTilt = -0.22;
        targetBlushOpacity = 0.75;
        targetHeadPitch = 0.04;
        targetHeadRoll = 0.05;
        break;

      case 'listening':
        // Listening: Attentive forward lean, curious head tilt, gentle smile, eyes fixed on user
        targetSmile = 0.22;
        targetBrowLift = 0.02;
        targetHeadPitch = -0.05;
        targetHeadRoll = 0.06;
        targetHeadYaw = animState.mousePos.x * 0.15;
        break;

      case 'speaking':
        // Speaking: Active real-time lip-sync driven by audio volume & FFT frequencies!
        targetSmile = 0.25 + animState.volume * 0.25;
        targetBrowLift = 0.015 + Math.sin(elapsedTime * 4.0) * 0.02;

        const speechAmp = THREE.MathUtils.clamp(animState.volume * 3.2, 0, 1.0);
        targetMouthOpen = speechAmp;

        const lowFreq = (animState.frequencies[1] || 0) + (animState.frequencies[2] || 0);
        const highFreq = (animState.frequencies[8] || 0) + (animState.frequencies[10] || 0);
        targetMouthWidth = 1.0 + (highFreq - lowFreq) * 0.4;

        targetHeadPitch = Math.sin(elapsedTime * 3.5) * 0.06;
        targetHeadYaw = Math.sin(elapsedTime * 1.8) * 0.08 + animState.mousePos.x * 0.12;
        targetHeadRoll = Math.sin(elapsedTime * 2.2) * 0.04;
        break;

      case 'interrupted':
        // Interrupted: Eyes open wide, head snaps attentively, mouth snaps shut
        targetMouthOpen = 0;
        targetBrowLift = 0.04;
        targetHeadPitch = -0.06;
        targetHeadRoll = 0.08;
        break;

      case 'idle':
      default:
        // Peaceful alive idle
        targetSmile = 0.16;
        targetHeadPitch = Math.sin(elapsedTime * 0.8) * 0.02;
        targetHeadYaw = Math.sin(elapsedTime * 0.5) * 0.05 + animState.mousePos.x * 0.08;
        targetHeadRoll = Math.sin(elapsedTime * 0.6) * 0.02;
        break;
    }

    // Interpolate Expression Variables
    this.currentMouthOpen = THREE.MathUtils.lerp(this.currentMouthOpen, targetMouthOpen, delta * 24);
    this.currentMouthWidth = THREE.MathUtils.lerp(this.currentMouthWidth, targetMouthWidth, delta * 18);
    this.currentSmile = THREE.MathUtils.lerp(this.currentSmile, targetSmile, delta * 8);
    this.currentPout = THREE.MathUtils.lerp(this.currentPout, targetPout, delta * 8);
    this.currentBrowLift = THREE.MathUtils.lerp(this.currentBrowLift, targetBrowLift, delta * 10);
    this.currentBrowTilt = THREE.MathUtils.lerp(this.currentBrowTilt, targetBrowTilt, delta * 10);
    this.currentBlushOpacity = THREE.MathUtils.lerp(this.currentBlushOpacity, targetBlushOpacity, delta * 4);
    this.currentWinkFactor = THREE.MathUtils.lerp(this.currentWinkFactor, targetWink, delta * 12);

    // Apply Blush Opacity
    if (this.leftBlush?.material instanceof THREE.MeshBasicMaterial) {
      this.leftBlush.material.opacity = this.currentBlushOpacity;
    }
    if (this.rightBlush?.material instanceof THREE.MeshBasicMaterial) {
      this.rightBlush.material.opacity = this.currentBlushOpacity;
    }

    // Apply Mouth Morphing (Lip separation, smile curve & pout)
    const mouthGap = this.currentMouthOpen * 0.032;
    const smileOffset = this.currentSmile * 0.008;
    this.upperLip.position.y = 0.007 + mouthGap * 0.5 + smileOffset;
    this.lowerLip.position.y = -0.007 - mouthGap * 0.5 + smileOffset;
    this.upperLip.scale.x = this.currentMouthWidth * (1.0 - this.currentPout * 0.3);
    this.lowerLip.scale.x = this.currentMouthWidth * (1.0 - this.currentPout * 0.3);

    this.mouthCavity.scale.set(
      this.currentMouthWidth * (0.4 + this.currentMouthOpen),
      0.1 + this.currentMouthOpen * 1.4,
      0.1 + this.currentMouthOpen * 0.8
    );

    // Apply Blinking & Winking to Eyelids
    const leftBlinkTotal = THREE.MathUtils.clamp(blinkAmount * 0.065, 0, 0.065);
    this.leftUpperLid.position.y = 0.065 - leftBlinkTotal;

    // Right eyelid incorporates both natural blink and playful wink!
    const rightBlinkTotal = THREE.MathUtils.clamp(
      Math.max(blinkAmount, this.currentWinkFactor) * 0.065,
      0,
      0.065
    );
    this.rightUpperLid.position.y = 0.065 - rightBlinkTotal;

    // Winking Arc visibility (fades in as wink factor increases)
    if (this.rightWinkArc?.material instanceof THREE.MeshBasicMaterial) {
      this.rightWinkArc.material.opacity = this.currentWinkFactor * 0.95;
      this.rightIris.visible = this.currentWinkFactor < 0.7;
    }

    // Apply Eyebrows
    this.leftEyebrow.position.y = 0.17 + this.currentBrowLift;
    this.rightEyebrow.position.y = 0.17 + this.currentBrowLift;
    this.leftEyebrow.rotation.z = 0.06 + this.currentBrowTilt;
    this.rightEyebrow.rotation.z = -0.06 - this.currentBrowTilt;

    // 6. Head & Neck Articulation
    this.targetHeadRot.set(targetHeadPitch, targetHeadYaw, targetHeadRoll);
    this.currentHeadRot.x = THREE.MathUtils.lerp(this.currentHeadRot.x, this.targetHeadRot.x, delta * 6);
    this.currentHeadRot.y = THREE.MathUtils.lerp(this.currentHeadRot.y, this.targetHeadRot.y, delta * 6);
    this.currentHeadRot.z = THREE.MathUtils.lerp(this.currentHeadRot.z, this.targetHeadRot.z, delta * 6);

    this.headBone.rotation.copy(this.currentHeadRot);
    this.neckBone.rotation.set(this.currentHeadRot.x * 0.35, this.currentHeadRot.y * 0.35, this.currentHeadRot.z * 0.35);

    // 7. Hair Dynamics / Sway (Bangs, Side locks, Bow & Ponytail)
    const hairSway = Math.sin(elapsedTime * 2.2) * 0.06 + this.currentHeadRot.y * -0.35;
    this.highSidePonytail.rotation.z = hairSway * 0.8;
    this.highSidePonytail.rotation.x = Math.sin(elapsedTime * 1.8) * 0.04;
    this.leftHairStrand.rotation.z = hairSway * 0.4;
    this.rightHairStrand.rotation.z = hairSway * 0.4;
    this.hairBangsGroup.rotation.z = -hairSway * 0.25;
    this.hairRibbonGroup.rotation.z = -0.15 + hairSway * 0.3;

    // 8. Natural Hand & Arm Gestures based on emotion/state
    let targetLeftArm = new THREE.Euler(0.2, 0, -0.28);
    let targetRightArm = new THREE.Euler(0.2, 0, 0.28);

    if (activeEmotion === 'speaking') {
      const speakGesture = Math.sin(elapsedTime * 2.8) * 0.15;
      targetRightArm = new THREE.Euler(0.6 + speakGesture, 0.2, 0.42);
      targetLeftArm = new THREE.Euler(0.3 - speakGesture * 0.5, -0.1, -0.32);
    } else if (activeEmotion === 'thinking') {
      // Right hand raised gently toward chin (thoughtful anime pose)
      targetRightArm = new THREE.Euler(1.15, -0.25, 0.55);
      targetLeftArm = new THREE.Euler(0.2, 0, -0.28);
    } else if (activeEmotion === 'listening') {
      targetRightArm = new THREE.Euler(0.32, 0.1, 0.35);
      targetLeftArm = new THREE.Euler(0.32, -0.1, -0.35);
    } else if (activeEmotion === 'wink' || activeEmotion === 'happy') {
      // Playful cute anime pose
      targetRightArm = new THREE.Euler(0.45, 0.2, 0.45);
      targetLeftArm = new THREE.Euler(0.4, -0.15, -0.38);
    } else if (activeEmotion === 'angry') {
      // Hands on hips pout pose
      targetRightArm = new THREE.Euler(0.4, 0.3, 0.5);
      targetLeftArm = new THREE.Euler(0.4, -0.3, -0.5);
    }

    this.currentLeftArmRot.x = THREE.MathUtils.lerp(this.currentLeftArmRot.x, targetLeftArm.x, delta * 4);
    this.currentLeftArmRot.y = THREE.MathUtils.lerp(this.currentLeftArmRot.y, targetLeftArm.y, delta * 4);
    this.currentLeftArmRot.z = THREE.MathUtils.lerp(this.currentLeftArmRot.z, targetLeftArm.z, delta * 4);

    this.currentRightArmRot.x = THREE.MathUtils.lerp(this.currentRightArmRot.x, targetRightArm.x, delta * 4);
    this.currentRightArmRot.y = THREE.MathUtils.lerp(this.currentRightArmRot.y, targetRightArm.y, delta * 4);
    this.currentRightArmRot.z = THREE.MathUtils.lerp(this.currentRightArmRot.z, targetRightArm.z, delta * 4);

    this.leftArmBone.rotation.copy(this.currentLeftArmRot);
    this.rightArmBone.rotation.copy(this.currentRightArmRot);
  }

  /**
   * Cleanup Three.js resources
   */
  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
