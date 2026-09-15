import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { AssistantState, AuraTheme } from '../../types';
import { AURA_THEMES } from '../../data/auraThemes';

interface CyberMatrixVisualizerProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  volume: number;
  frequencyData: number[];
  isMuted: boolean;
  onActionClick: () => void;
}

export const CyberMatrixVisualizer: React.FC<CyberMatrixVisualizerProps> = ({
  state,
  auraTheme,
  volume,
  frequencyData,
  isMuted,
  onActionClick,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // 48 circular equalizer nodes
  const nodes = useMemo(() => {
    const count = 48;
    const baseRadius = 130;
    const result = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const freqIndex = i < 24 ? i : 48 - i;
      const freqVal = frequencyData[freqIndex % frequencyData.length] || 0;

      let len = 10;
      if (state === 'speaking') {
        len = 10 + freqVal * 55 + volume * 30;
      } else if (state === 'listening') {
        len = 10 + freqVal * 40 + volume * 25;
      } else if (state === 'thinking') {
        len = 12 + Math.sin(i * 0.5 + Date.now() / 300) * 8;
      } else if (state === 'idle') {
        len = 10 + Math.sin(i * 0.35 + Date.now() / 1200) * 4;
      }

      const x1 = Math.cos(angle) * baseRadius;
      const y1 = Math.sin(angle) * baseRadius;
      const x2 = Math.cos(angle) * (baseRadius + len);
      const y2 = Math.sin(angle) * (baseRadius + len);

      result.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        opacity: state === 'speaking' || state === 'listening' ? 0.35 + freqVal * 0.65 : 0.25,
      });
    }

    return result;
  }, [frequencyData, state, volume]);

  return (
    <div
      id="aira-cyber-matrix-container"
      className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center select-none"
    >
      {/* SVG Circular Frequency Spectrum */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        viewBox="-190 -190 380 380"
      >
        <defs>
          <linearGradient id={`matrix-grad-${auraTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={currentTheme.accent} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer dotted radar circle */}
        <circle
          cx="0"
          cy="0"
          r="165"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="0"
          cy="0"
          r="130"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* Equalizer lines */}
        {nodes.map((node) => (
          <line
            key={node.id}
            x1={node.x1}
            y1={node.y1}
            x2={node.x2}
            y2={node.y2}
            stroke={`url(#matrix-grad-${auraTheme})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity={node.opacity}
          />
        ))}
      </svg>

      {/* Rotating Cyber Decagon Ring */}
      <motion.div
        className="absolute w-[270px] h-[270px] rounded-full border border-dashed pointer-events-none"
        style={{ borderColor: currentTheme.border }}
        animate={{ rotate: 360 }}
        transition={{
          duration: state === 'thinking' ? 8 : state === 'speaking' ? 14 : 32,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-lg"
          style={{ backgroundColor: currentTheme.accent, boxShadow: `0 0 10px ${currentTheme.glow}` }}
        />
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: currentTheme.primary }}
        />
      </motion.div>

      {/* Core Center Button */}
      <button
        id="aira-matrix-core-trigger"
        type="button"
        onClick={onActionClick}
        className="relative z-10 w-[114px] h-[114px] sm:w-[130px] sm:h-[130px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 group focus:outline-none"
      >
        <div
          className="absolute inset-0 rounded-full border transition-all duration-500 backdrop-blur-md"
          style={{
            borderColor: state === 'disconnected' ? 'rgba(255, 255, 255, 0.12)' : currentTheme.border,
            background: 'radial-gradient(circle at 35% 35%, rgba(20, 25, 38, 0.75) 0%, rgba(8, 10, 18, 0.95) 100%)',
            boxShadow: `0 12px 36px ${currentTheme.glow}`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase" style={{ color: currentTheme.accent }}>
            {state === 'disconnected' && 'INITIATE'}
            {state === 'connecting' && 'CONNECTING'}
            {state === 'idle' && (isMuted ? 'MUTED' : 'READY')}
            {state === 'listening' && (isMuted ? 'MUTED' : 'LISTENING')}
            {state === 'thinking' && 'PROCESSING'}
            {state === 'speaking' && 'OUTPUTTING'}
            {state === 'interrupted' && 'PAUSED'}
            {state === 'ending' && 'RESTING'}
          </span>
          <span className="text-[9px] text-slate-400 font-sans tracking-wide mt-0.5">
            {state === 'disconnected' ? 'Tap to Wake' : state === 'speaking' ? 'Tap to Interrupt' : 'Spectral v2'}
          </span>
        </div>
      </button>
    </div>
  );
};
