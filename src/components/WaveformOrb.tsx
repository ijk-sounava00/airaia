import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Power, Loader2, Volume2, Sparkles, Moon, Radio } from 'lucide-react';
import { AssistantState, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface WaveformOrbProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  volume: number;
  frequencyData: number[];
  isMuted: boolean;
  onActionClick: () => void;
}

export const WaveformOrb: React.FC<WaveformOrbProps> = ({
  state,
  auraTheme,
  volume,
  frequencyData,
  isMuted,
  onActionClick,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // Compute circular waveform bars from frequencyData (32 bins)
  const circularBars = useMemo(() => {
    const barsCount = 36;
    const bars = [];
    const radius = 135; // base radius

    for (let i = 0; i < barsCount; i++) {
      const angle = (i / barsCount) * 2 * Math.PI - Math.PI / 2;
      const freqIndex = i < 18 ? i : 36 - i;
      const freqVal = frequencyData[freqIndex % frequencyData.length] || 0;

      // Base height + reactive height based on state
      let barHeight = 8;
      if (state === 'speaking') {
        barHeight = 8 + freqVal * 45 + volume * 22;
      } else if (state === 'listening') {
        barHeight = 8 + freqVal * 34 + volume * 18;
      } else if (state === 'thinking') {
        barHeight = 8 + Math.sin(i * 0.6 + Date.now() / 400) * 7;
      } else if (state === 'interrupted') {
        barHeight = 12 + Math.sin(i * 0.8) * 4;
      } else if (state === 'idle') {
        barHeight = 8 + Math.sin(i * 0.35 + Date.now() / 1000) * 3.5;
      }

      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius + barHeight);
      const y2 = Math.sin(angle) * (radius + barHeight);

      const isActive = state === 'speaking' || state === 'listening';
      bars.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        opacity: isActive ? 0.35 + freqVal * 0.65 : state === 'idle' ? 0.25 : 0.15,
      });
    }

    return bars;
  }, [frequencyData, state, volume]);

  // Core scale reacts to volume
  const orbScale = state === 'speaking'
    ? 1 + volume * 0.3
    : state === 'listening'
    ? 1 + volume * 0.18
    : state === 'thinking'
    ? 1.05
    : state === 'interrupted'
    ? 0.98
    : state === 'connecting'
    ? 1.04
    : 1;

  // Pulse speed
  const pulseDuration =
    state === 'speaking' ? 1.2 :
    state === 'listening' ? 1.8 :
    state === 'thinking' ? 1.0 :
    state === 'interrupted' ? 0.6 :
    state === 'idle' ? 3.5 : 4;

  return (
    <div id="aira-waveform-container" className="relative flex flex-col items-center justify-center select-none">
      {/* Outer energy container */}
      <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">

        {/* Dynamic circular waveform SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="-180 -180 360 360"
        >
          <defs>
            <linearGradient id={`waveform-grad-${auraTheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={currentTheme.accent} stopOpacity="0.7" />
            </linearGradient>
            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render circular reactive frequency bars */}
          {circularBars.map((bar) => (
            <line
              key={bar.id}
              x1={bar.x1}
              y1={bar.y1}
              x2={bar.x2}
              y2={bar.y2}
              stroke={`url(#waveform-grad-${auraTheme})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity={bar.opacity}
              filter={state === 'speaking' || state === 'listening' ? 'url(#glow-filter)' : undefined}
            />
          ))}

          {/* Orbiting concentric ring guide */}
          <circle
            cx="0"
            cy="0"
            r="135"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </svg>

        {/* Outer orbital rotating ring */}
        <motion.div
          className="absolute w-[240px] h-[240px] sm:w-[270px] sm:h-[270px] rounded-full border border-dashed pointer-events-none"
          style={{ borderColor: currentTheme.border }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: state === 'connecting' ? 6 : 28,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Orbital spark node 1 */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg"
            style={{
              backgroundColor: currentTheme.accent,
              boxShadow: `0 0 10px ${currentTheme.glow}`,
            }}
          />
          {/* Orbital spark node 2 */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full opacity-60"
            style={{
              backgroundColor: currentTheme.primary,
              boxShadow: `0 0 6px ${currentTheme.glow}`,
            }}
          />
        </motion.div>

        {/* Inner reverse rotating ring with third orbital particle */}
        <motion.div
          className="absolute w-[210px] h-[210px] sm:w-[230px] sm:h-[230px] rounded-full border pointer-events-none"
          style={{
            borderColor: state === 'disconnected' ? 'rgba(255, 255, 255, 0.05)' : currentTheme.border,
            borderStyle: 'solid',
            borderWidth: '1px',
          }}
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: currentTheme.accent,
              boxShadow: `0 0 8px ${currentTheme.accent}`,
            }}
          />
        </motion.div>

        {/* Active Audio Wave Ripple when speaking or listening with high volume */}
        {volume > 0.04 && (
          <motion.div
            className="absolute w-[260px] h-[260px] sm:w-[290px] sm:h-[290px] rounded-full pointer-events-none border"
            style={{ borderColor: currentTheme.accent }}
            animate={{
              scale: [1, 1.25, 1.45],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Multi-layer pulsating liquid aura halo */}
        <motion.div
          className="absolute w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full pointer-events-none filter blur-xl transition-colors duration-700"
          style={{
            backgroundColor: currentTheme.primary,
            opacity: state === 'disconnected' ? 0.12 : state === 'speaking' ? 0.45 : 0.3,
          }}
          animate={{
            scale: [orbScale * 0.95, orbScale * 1.15, orbScale * 0.95],
          }}
          transition={{
            duration: pulseDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary inner aura */}
        <motion.div
          className="absolute w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] rounded-full pointer-events-none filter blur-md transition-colors duration-700"
          style={{
            backgroundColor: currentTheme.accent,
            opacity: state === 'disconnected' ? 0.08 : state === 'speaking' ? 0.5 : 0.35,
          }}
          animate={{
            scale: [orbScale * 1.05, orbScale * 0.95, orbScale * 1.05],
          }}
          transition={{
            duration: pulseDuration * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Central interactive Glassmorphism Button / Core */}
        <motion.button
          id="aira-core-action-button"
          type="button"
          onClick={onActionClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative z-10 w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-[#06080e]"
          style={{
            background: 'linear-gradient(145deg, rgba(22, 27, 40, 0.85), rgba(11, 14, 22, 0.95))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1.5px solid ${state === 'disconnected' ? 'rgba(255, 255, 255, 0.12)' : currentTheme.border}`,
            boxShadow: state === 'disconnected'
              ? '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
              : `0 16px 48px ${currentTheme.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.25)`,
          }}
          aria-label={
            state === 'disconnected'
              ? 'Wake AIRA voice assistant'
              : state === 'speaking'
              ? 'Interrupt AIRA'
              : 'Disconnect AIRA'
          }
        >
          {/* Subtle reflection highlight */}
          <div className="absolute top-1 left-3 right-3 h-[40%] rounded-t-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          {/* Central Animated Icon based on State */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white">
            <AnimatePresence mode="wait">
              {state === 'disconnected' && (
                <motion.div
                  key="power"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Power className="w-8 h-8 sm:w-9 sm:h-9 text-slate-300 drop-shadow-md" />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-slate-400">
                    Tap to Wake
                  </span>
                </motion.div>
              )}

              {state === 'connecting' && (
                <motion.div
                  key="connecting"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin" style={{ color: currentTheme.accent }} />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase" style={{ color: currentTheme.accent }}>
                    Connecting
                  </span>
                </motion.div>
              )}

              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" style={{ color: currentTheme.accent }} />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-slate-300">
                    {isMuted ? 'Muted' : 'Idle'}
                  </span>
                </motion.div>
              )}

              {state === 'listening' && (
                <motion.div
                  key="listening"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  {isMuted ? (
                    <MicOff className="w-8 h-8 sm:w-9 sm:h-9 text-rose-400 drop-shadow-md" />
                  ) : (
                    <Mic className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md animate-pulse" style={{ color: currentTheme.accent }} />
                  )}
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-slate-200">
                    {isMuted ? 'Muted' : 'Listening'}
                  </span>
                </motion.div>
              )}

              {state === 'thinking' && (
                <motion.div
                  key="thinking"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin" style={{ color: currentTheme.primary }} />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase" style={{ color: currentTheme.primary }}>
                    Thinking
                  </span>
                </motion.div>
              )}

              {state === 'speaking' && (
                <motion.div
                  key="speaking"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md animate-pulse" style={{ color: currentTheme.accent }} />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-slate-200">
                    Speaking
                  </span>
                </motion.div>
              )}

              {state === 'interrupted' && (
                <motion.div
                  key="interrupted"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.05, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 drop-shadow-md animate-bounce" />
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-amber-200">
                    Interrupted
                  </span>
                </motion.div>
              )}

              {state === 'ending' && (
                <motion.div
                  key="ending"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Moon className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-300 drop-shadow-md" />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-indigo-200">
                    Concluded
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      {/* State Status Descriptor Text below orb */}
      <motion.div
        id="aira-status-caption"
        className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5 bg-white/[0.03]"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              state === 'disconnected'
                ? '#64748b'
                : state === 'connecting'
                ? '#eab308'
                : state === 'idle'
                ? currentTheme.primary
                : state === 'thinking'
                ? '#a855f7'
                : state === 'speaking'
                ? currentTheme.accent
                : state === 'interrupted'
                ? '#f59e0b'
                : state === 'ending'
                ? '#818cf8'
                : currentTheme.primary,
            boxShadow: state !== 'disconnected' ? `0 0 10px ${currentTheme.primary}` : 'none',
          }}
        />
        <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-300">
          {state === 'disconnected' && 'AIRA is offline • Tap core to initiate'}
          {state === 'connecting' && 'Establishing neural audio link...'}
          {state === 'idle' && (isMuted ? 'Microphone muted • Tap to unmute' : 'Silent & listening • Speak whenever you like')}
          {state === 'listening' && (isMuted ? 'Microphone muted • Tap to unmute' : 'AIRA is listening to you...')}
          {state === 'thinking' && 'AIRA is thinking...'}
          {state === 'speaking' && 'AIRA is speaking • Tap core or speak to interrupt'}
          {state === 'interrupted' && 'Yielding to you • Listening...'}
          {state === 'ending' && 'Conversation concluded • Catch you later'}
        </span>
      </motion.div>
    </div>
  );
};
