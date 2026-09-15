import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import {
  Power,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Loader2,
  Heart,
  Brain,
  Settings as SettingsIcon,
  Smile,
  Flame,
  HelpCircle,
  Frown,
  Eye,
  Radio,
} from 'lucide-react';
import { AssistantState, AuraTheme, CharacterEmotion } from '../../types';
import { AURA_THEMES } from '../../data/auraThemes';
import { HologramCharacter } from './HologramCharacter';

interface HologramStageProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  volume: number;
  frequencyData: number[];
  isMuted: boolean;
  onActionClick: () => void;
  onMuteToggle?: () => void;
  onOpenMemory?: () => void;
  onOpenSettings?: () => void;
  liveTranscript?: { role: 'user' | 'aira'; text: string; timestamp: number } | null;
}

export const HologramStage: React.FC<HologramStageProps> = ({
  state,
  auraTheme,
  volume,
  frequencyData,
  isMuted,
  onActionClick,
  onMuteToggle,
  onOpenMemory,
  onOpenSettings,
  liveTranscript,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<HologramCharacter | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Explicit user-triggered emotion override
  const [activeEmotionOverride, setActiveEmotionOverride] = useState<CharacterEmotion | null>(null);
  const [showExpressionPanel, setShowExpressionPanel] = useState<boolean>(true);

  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // Auto-revert manual emotion override after a brief duration so she returns to dynamic speech/listening
  useEffect(() => {
    if (!activeEmotionOverride) return;
    const timer = setTimeout(() => {
      setActiveEmotionOverride(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeEmotionOverride]);

  // Derive current active emotion from either manual override or conversation state
  const currentEmotion: CharacterEmotion = activeEmotionOverride
    ? activeEmotionOverride
    : state === 'speaking'
    ? 'speaking'
    : state === 'listening'
    ? 'listening'
    : state === 'thinking'
    ? 'thinking'
    : state === 'interrupted'
    ? 'interrupted'
    : 'idle';

  // Pointer tracking for eye gaze and subtle parallax
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const normX = (clientX / window.innerWidth) * 2 - 1;
    const normY = (clientY / window.innerHeight) * 2 - 1;

    mouseTargetRef.current = { x: normX, y: normY };
  }, []);

  // Initialize Three.js scene & 3D Holographic Character
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 480;
    const height = containerRef.current.clientHeight || 560;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: positioned to frame anime hologram companion perfectly in center
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.1, 3.25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(new THREE.Color(currentTheme.primary), 1.6);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(1.5, 2, 2.5);
    scene.add(keyLight);

    const character = new HologramCharacter(currentTheme.primary, currentTheme.accent);
    scene.add(character.group);
    characterRef.current = character;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      character.dispose();
      renderer.dispose();
    };
  }, []);

  // Update theme colors when user switches aura
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.updateThemeColors(currentTheme.primary, currentTheme.accent);
    }
  }, [auraTheme, currentTheme]);

  // Glitch effect on interruption or state change
  useEffect(() => {
    if (state === 'interrupted' || state === 'connecting') {
      characterRef.current?.triggerGlitch(0.7);
    }
  }, [state]);

  // Main Render Loop
  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      const curX = THREE.MathUtils.lerp(mousePos.x, mouseTargetRef.current.x, 0.08);
      const curY = THREE.MathUtils.lerp(mousePos.y, mouseTargetRef.current.y, 0.08);
      setMousePos({ x: curX, y: curY });

      if (cameraRef.current) {
        cameraRef.current.position.x = curX * 0.12;
        cameraRef.current.position.y = 0.1 - curY * 0.08;
        cameraRef.current.lookAt(0, 0.08, 0);
      }

      if (characterRef.current) {
        characterRef.current.update({
          state,
          emotion: currentEmotion,
          volume,
          frequencies: frequencyData,
          isSpeaking: state === 'speaking',
          isListening: state === 'listening',
          isThinking: state === 'thinking',
          isInterrupted: state === 'interrupted',
          mousePos: { x: curX, y: curY },
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, volume, frequencyData, currentEmotion, mousePos]);

  // Horizontal dual waveform bars (left and right of main voice button)
  const leftWaveformBars = Array.from({ length: 12 }, (_, i) => {
    const raw = frequencyData[12 - i] || 0;
    const baseH = state === 'disconnected' ? 4 : 8;
    return Math.min(100, baseH + (raw / 255) * 85 * (state === 'speaking' || state === 'listening' ? 1.4 : 0.4));
  });

  const rightWaveformBars = Array.from({ length: 12 }, (_, i) => {
    const raw = frequencyData[i + 1] || 0;
    const baseH = state === 'disconnected' ? 4 : 8;
    return Math.min(100, baseH + (raw / 255) * 85 * (state === 'speaking' || state === 'listening' ? 1.4 : 0.4));
  });

  // Speech bubble content
  const speechBubbleText = () => {
    if (activeEmotionOverride === 'wink') return 'Hehe, you like it? ♡';
    if (activeEmotionOverride === 'happy') return 'Yay! I am so happy to be here ♡';
    if (activeEmotionOverride === 'surprised') return 'Woah! Really?!';
    if (activeEmotionOverride === 'thinking') return 'Hmm... let me ponder that...';
    if (activeEmotionOverride === 'angry') return 'Hmph! You tease me too much!';

    if (state === 'disconnected') return "Hey... I'm AIRA ♡";
    if (state === 'connecting') return 'Connecting neural link...';
    if (state === 'listening') return 'Listening to you...';
    if (state === 'thinking') return 'Thinking...';
    if (state === 'interrupted') return 'I heard you! Go ahead...';
    if (state === 'speaking') {
      if (liveTranscript && liveTranscript.role === 'aira' && liveTranscript.text) {
        return liveTranscript.text.length > 55
          ? `${liveTranscript.text.slice(0, 52)}...`
          : liveTranscript.text;
      }
      return 'Talking with you... ♪';
    }
    return "Hey... I'm AIRA ♡";
  };

  // Expression list matching the user reference photo
  const expressionItems: { id: CharacterEmotion; label: string; icon: string }[] = [
    { id: 'happy', label: 'Happy', icon: '😊' },
    { id: 'wink', label: 'Wink', icon: '😉' },
    { id: 'surprised', label: 'Surprised', icon: '😲' },
    { id: 'thinking', label: 'Thinking', icon: '🤔' },
    { id: 'angry', label: 'Angry', icon: '😤' },
  ];

  return (
    <div
      id="aira-hologram-stage-container"
      ref={containerRef}
      className="relative w-full max-w-lg h-[540px] sm:h-[620px] mx-auto flex items-center justify-center select-none"
    >
      {/* Background Holographic Halo / Cyber Grid */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div
          className="w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] rounded-full blur-3xl opacity-20 transition-colors duration-700"
          style={{ backgroundColor: currentTheme.primary }}
        />
        {/* Subtle holographic grid lines */}
        <div className="absolute inset-x-8 inset-y-12 border border-cyan-500/10 rounded-3xl pointer-events-none" />
      </div>

      {/* Floating Hologram Speech Bubble ("Hey... I'm AIRA ♡") */}
      <motion.div
        id="aira-speech-bubble"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute top-8 sm:top-10 right-4 sm:right-8 z-30 max-w-[210px] sm:max-w-[240px] px-3.5 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl pointer-events-auto cursor-pointer"
        style={{
          backgroundColor: 'rgba(8, 14, 28, 0.82)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          boxShadow: `0 0 20px rgba(6, 182, 212, 0.25)`,
        }}
        onClick={() => {
          // Playful winking response when tapping speech bubble
          setActiveEmotionOverride('wink');
        }}
        title="Tap to tease AIRA"
      >
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-cyan-200">
          <span>{speechBubbleText()}</span>
          {(activeEmotionOverride === 'wink' || activeEmotionOverride === 'happy' || state === 'idle' || state === 'disconnected') && (
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 shrink-0 inline animate-pulse" />
          )}
        </div>
        {/* Small cyber pointer tail */}
        <div
          className="absolute -bottom-1.5 left-5 w-3 h-3 rotate-45 border-r border-b"
          style={{
            backgroundColor: 'rgba(8, 14, 28, 0.82)',
            borderColor: 'rgba(56, 189, 248, 0.4)',
          }}
        />
      </motion.div>

      {/* Left Quick Actions Dock (Voice, Memory, Settings) */}
      <div
        id="aira-quick-actions-dock"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 p-1.5 rounded-full backdrop-blur-xl border bg-slate-950/70 border-white/10 shadow-2xl"
      >
        {/* Mic toggle */}
        <button
          id="dock-mic-btn"
          type="button"
          onClick={onMuteToggle}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-cyan-400 hover:bg-cyan-500/20'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Memory Panel Trigger */}
        {onOpenMemory && (
          <button
            id="dock-memory-btn"
            type="button"
            onClick={onOpenMemory}
            className="p-2.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="AIRA Memory"
            aria-label="AIRA Memory"
          >
            <Brain className="w-4 h-4" />
          </button>
        )}

        {/* Settings Trigger */}
        {onOpenSettings && (
          <button
            id="dock-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        )}

        {/* Expression Switcher Toggle */}
        <button
          id="dock-expressions-btn"
          type="button"
          onClick={() => setShowExpressionPanel(!showExpressionPanel)}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            showExpressionPanel ? 'text-pink-400 bg-pink-500/20' : 'text-slate-400 hover:text-pink-300'
          }`}
          title="Dynamic Expressions"
          aria-label="Toggle Dynamic Expressions Panel"
        >
          <Smile className="w-4 h-4" />
        </button>
      </div>

      {/* Right Dynamic Expression Panel (From the User Reference Photo) */}
      <AnimatePresence>
        {showExpressionPanel && (
          <motion.div
            id="aira-dynamic-expression-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 p-2 rounded-2xl backdrop-blur-xl border bg-slate-950/75 border-cyan-500/30 shadow-2xl"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/80 px-1 mb-0.5">
              Expressions
            </span>

            {expressionItems.map((expr) => {
              const isCurrent = currentEmotion === expr.id;
              return (
                <button
                  key={expr.id}
                  type="button"
                  onClick={() => setActiveEmotionOverride(expr.id)}
                  className={`group relative flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500/30 text-white border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={`Trigger ${expr.label} expression`}
                >
                  <span className="text-base">{expr.icon}</span>
                  <span className="text-[11px] hidden sm:inline font-mono">{expr.label}</span>

                  {isCurrent && (
                    <motion.div
                      layoutId="active-expr-indicator"
                      className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Hologram WebGL Canvas */}
      <canvas
        id="aira-3d-hologram-canvas"
        ref={canvasRef}
        className="relative z-10 w-full h-full cursor-pointer touch-none"
        onClick={onActionClick}
        title={
          state === 'disconnected'
            ? 'Tap to awaken AIRA'
            : state === 'speaking'
            ? 'Tap to interrupt AIRA'
            : 'AIRA Hologram'
        }
      />

      {/* Bottom Main Voice Interaction Dock (Waveform + Glowing Circular Voice Button) */}
      <div className="absolute bottom-3 sm:bottom-6 inset-x-0 z-30 flex flex-col items-center">
        {/* Dual Horizontal Waveform flanking the main button */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full max-w-md px-4">
          {/* Left Waveform Bars */}
          <div className="flex-1 flex items-center justify-end gap-1 h-10">
            {leftWaveformBars.map((h, i) => (
              <div
                key={`left-${i}`}
                className="w-1 sm:w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: currentTheme.accent,
                  opacity: state === 'disconnected' ? 0.25 : 0.4 + (h / 100) * 0.6,
                  boxShadow:
                    state === 'speaking' || state === 'listening'
                      ? `0 0 8px ${currentTheme.glow}`
                      : 'none',
                }}
              />
            ))}
          </div>

          {/* Central Main Glowing Voice Button (4 States from Reference Photo) */}
          <div className="relative flex items-center justify-center">
            {/* Multi-layer pulsating cyber rings */}
            <motion.div
              animate={{
                scale: state === 'listening' || state === 'speaking' ? [1, 1.25, 1] : 1,
                opacity: state === 'speaking' ? [0.6, 0.9, 0.6] : state === 'listening' ? [0.4, 0.7, 0.4] : 0.2,
              }}
              transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut' }}
              className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full pointer-events-none"
              style={{
                border: `1.5px solid ${currentTheme.accent}`,
                boxShadow: `0 0 25px ${currentTheme.glow}`,
              }}
            />

            <motion.div
              animate={{
                rotate: state === 'connecting' ? 360 : 0,
              }}
              transition={{ repeat: state === 'connecting' ? Infinity : 0, duration: 3, ease: 'linear' }}
              className="absolute w-20 h-20 sm:w-22 sm:h-22 rounded-full pointer-events-none border border-dashed border-cyan-400/40"
            />

            {/* Core Circular Button */}
            <motion.button
              id="aira-main-voice-btn"
              type="button"
              onClick={onActionClick}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-2xl cursor-pointer focus:outline-none transition-all duration-300"
              style={{
                backgroundColor:
                  state === 'disconnected'
                    ? '#0f172a'
                    : state === 'speaking'
                    ? '#1e1b4b'
                    : '#082f49',
                border: `2px solid ${
                  state === 'disconnected'
                    ? 'rgba(255,255,255,0.2)'
                    : state === 'speaking'
                    ? '#c084fc'
                    : currentTheme.accent
                }`,
                boxShadow:
                  state !== 'disconnected'
                    ? `0 0 24px ${state === 'speaking' ? 'rgba(192,132,252,0.6)' : currentTheme.glow}`
                    : 'none',
              }}
              title={
                state === 'disconnected'
                  ? 'Tap to Talk'
                  : state === 'speaking'
                  ? 'Tap to Interrupt'
                  : 'Tap to Disconnect'
              }
            >
              <AnimatePresence mode="wait">
                {state === 'disconnected' && (
                  <motion.div
                    key="disconnected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Power className="w-6 h-6 text-slate-300" />
                  </motion.div>
                )}

                {state === 'connecting' && (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </motion.div>
                )}

                {state === 'listening' && (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Mic className="w-7 h-7 text-cyan-300 animate-pulse" />
                  </motion.div>
                )}

                {state === 'thinking' && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                  </motion.div>
                )}

                {state === 'speaking' && (
                  <motion.div
                    key="speaking"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Volume2 className="w-7 h-7 text-fuchsia-300 animate-pulse" />
                  </motion.div>
                )}

                {state === 'interrupted' && (
                  <motion.div
                    key="interrupted"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Mic className="w-7 h-7 text-amber-300 animate-bounce" />
                  </motion.div>
                )}

                {state === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Mic className="w-7 h-7 text-cyan-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Right Waveform Bars */}
          <div className="flex-1 flex items-center justify-start gap-1 h-10">
            {rightWaveformBars.map((h, i) => (
              <div
                key={`right-${i}`}
                className="w-1 sm:w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: currentTheme.accent,
                  opacity: state === 'disconnected' ? 0.25 : 0.4 + (h / 100) * 0.6,
                  boxShadow:
                    state === 'speaking' || state === 'listening'
                      ? `0 0 8px ${currentTheme.glow}`
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Action Caption Label */}
        <div className="mt-2 text-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wider">
            {state === 'disconnected'
              ? 'Tap to Talk'
              : state === 'speaking'
              ? 'Tap to Interrupt'
              : state === 'listening'
              ? 'AIRA Listening • Speak Naturally'
              : state === 'thinking'
              ? 'AIRA Thinking...'
              : 'Tap to Talk'}
          </p>
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">
            {state === 'disconnected' ? 'Hold for continuous' : 'Real-Time Audio Link'}
          </span>
        </div>
      </div>
    </div>
  );
};
