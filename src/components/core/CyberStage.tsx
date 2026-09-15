import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Disc,
  Activity,
  Mic,
  MicOff,
  Power,
  Volume2,
  Square,
  Zap,
  Smile,
  Flame,
  Brain,
  Monitor,
  Scan,
  Eye,
} from 'lucide-react';
import { AssistantState, AuraTheme, CoreVisualMode, AIRAMood } from '../../types';
import { AURA_THEMES } from '../../data/auraThemes';
import { QuantumCore } from './QuantumCore';
import { CyberMatrixVisualizer } from './CyberMatrixVisualizer';
import { WaveformOrb } from '../WaveformOrb';
import { ScreenShareState } from '../../screen/screenTypes';

interface CyberStageProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  volume: number;
  frequencyData: number[];
  isMuted: boolean;
  onActionClick: () => void;
  onMuteToggle?: () => void;
  onInterrupt?: () => void;
  liveTranscript?: { role: 'user' | 'aira'; text: string; timestamp: number } | null;
  // Screen Share Props
  screenShareState?: ScreenShareState;
  isScreenShareSupported?: boolean;
  onScreenShareToggle?: () => void;
  onForceInspect?: () => void;
}

export const CyberStage: React.FC<CyberStageProps> = ({
  state,
  auraTheme,
  volume,
  frequencyData,
  isMuted,
  onActionClick,
  onMuteToggle,
  onInterrupt,
  liveTranscript,
  screenShareState,
  isScreenShareSupported = true,
  onScreenShareToggle,
  onForceInspect,
}) => {
  const [visualMode, setVisualMode] = useState<CoreVisualMode>('quantum');
  const [activeMood, setActiveMood] = useState<AIRAMood>('balanced');
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // Compute live visualizer bar values (16 bars)
  const visualizerBars = React.useMemo(() => {
    const barsCount = 16;
    const bars = [];
    for (let i = 0; i < barsCount; i++) {
      const freqVal = frequencyData[i * 2] || 0;
      let heightPct = 12;
      if (state === 'speaking') {
        heightPct = Math.min(100, 16 + freqVal * 80 + volume * 50);
      } else if (state === 'listening') {
        heightPct = Math.min(100, 14 + freqVal * 60 + volume * 40);
      } else if (state === 'thinking') {
        heightPct = 14 + Math.sin(i * 0.5 + Date.now() / 250) * 12;
      } else if (state === 'idle') {
        heightPct = 10 + Math.sin(i * 0.4 + Date.now() / 900) * 8;
      }
      bars.push(Math.max(8, heightPct));
    }
    return bars;
  }, [frequencyData, state, volume]);

  return (
    <div
      id="aira-cyber-stage"
      className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 select-none"
    >
      {/* Visualizer Mode Switcher HUD */}
      <div
        id="aira-mode-switcher-dock"
        className="mb-3 z-20 flex items-center gap-1.5 p-1 rounded-full backdrop-blur-xl bg-[#080d1a]/85 border shadow-lg transition-colors duration-500"
        style={{ borderColor: currentTheme.border }}
      >
        <button
          type="button"
          onClick={() => setVisualMode('quantum')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            visualMode === 'quantum'
              ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          style={
            visualMode === 'quantum'
              ? {
                  backgroundColor: currentTheme.surface,
                  color: currentTheme.accent,
                  border: `1px solid ${currentTheme.border}`,
                }
              : {}
          }
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quantum 3D</span>
        </button>

        <button
          type="button"
          onClick={() => setVisualMode('spectral')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            visualMode === 'spectral'
              ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          style={
            visualMode === 'spectral'
              ? {
                  backgroundColor: currentTheme.surface,
                  color: currentTheme.accent,
                  border: `1px solid ${currentTheme.border}`,
                }
              : {}
          }
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Spectral Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setVisualMode('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            visualMode === 'matrix'
              ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          style={
            visualMode === 'matrix'
              ? {
                  backgroundColor: currentTheme.surface,
                  color: currentTheme.accent,
                  border: `1px solid ${currentTheme.border}`,
                }
              : {}
          }
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Plasma Orb</span>
        </button>
      </div>

      {/* Main Visual Core Entity */}
      <div className="relative flex items-center justify-center my-2">
        {/* Holographic Screen Vision Scanning Ring & HUD Overlay */}
        {screenShareState?.isSharing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {/* Outer Rotating Futuristic HUD Ring */}
            <motion.div
              className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-dashed opacity-40"
              style={{
                borderColor: currentTheme.accent,
                boxShadow: `0 0 20px ${currentTheme.glow}`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />

            {/* Sweep Scan Beam when analyzing */}
            {screenShareState.isAnalyzing && (
              <motion.div
                className="absolute w-64 sm:w-72 h-0.5 rounded-full"
                style={{
                  backgroundColor: currentTheme.accent,
                  boxShadow: `0 0 15px ${currentTheme.primary}`,
                }}
                animate={{ y: [-110, 110, -110] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Screen Vision Active Badge pinned above core */}
            <div
              className="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1.5 backdrop-blur-md border shadow-lg z-20"
              style={{
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
                color: currentTheme.accent,
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
              </span>
              <span>{screenShareState.isAnalyzing ? 'ANALYZING SCREEN' : 'SCREEN VISION ACTIVE'}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {visualMode === 'quantum' && (
            <motion.div
              key="quantum"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <QuantumCore
                state={state}
                auraTheme={auraTheme}
                volume={volume}
                frequencyData={frequencyData}
                isMuted={isMuted}
                onActionClick={onActionClick}
              />
            </motion.div>
          )}

          {visualMode === 'spectral' && (
            <motion.div
              key="spectral"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <CyberMatrixVisualizer
                state={state}
                auraTheme={auraTheme}
                volume={volume}
                frequencyData={frequencyData}
                isMuted={isMuted}
                onActionClick={onActionClick}
              />
            </motion.div>
          )}

          {visualMode === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <WaveformOrb
                state={state}
                auraTheme={auraTheme}
                volume={volume}
                frequencyData={frequencyData}
                isMuted={isMuted}
                onActionClick={onActionClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Equalizer Bar Band (Horizontal Sound Spectrum) */}
      <div
        id="aira-equalizer-band"
        className="mt-2 flex items-center justify-center gap-1 px-4 py-2 rounded-2xl backdrop-blur-md bg-white/[0.02] border border-white/5"
      >
        <span className="text-[10px] font-mono text-slate-500 mr-1 hidden sm:inline">24kHz</span>
        {visualizerBars.map((height, idx) => (
          <div
            key={idx}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height: `${Math.round(height * 0.28)}px`,
              backgroundColor: state === 'disconnected' ? '#334155' : currentTheme.primary,
              opacity: state === 'disconnected' ? 0.3 : 0.5 + (height / 100) * 0.5,
              boxShadow: state !== 'disconnected' && height > 35 ? `0 0 8px ${currentTheme.glow}` : 'none',
            }}
          />
        ))}
        <span className="text-[10px] font-mono text-slate-500 ml-1 hidden sm:inline">LIVE</span>
      </div>

      {/* State Status Banner Text */}
      <motion.div
        id="aira-status-caption"
        className="mt-4 flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border bg-[#0a0f1d]/85 shadow-lg"
        style={{ borderColor: currentTheme.border }}
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor:
              state === 'disconnected'
                ? '#64748b'
                : state === 'connecting'
                ? '#f59e0b'
                : state === 'idle'
                ? currentTheme.accent
                : state === 'thinking'
                ? '#a855f7'
                : state === 'speaking'
                ? currentTheme.primary
                : state === 'interrupted'
                ? '#ff0055'
                : currentTheme.accent,
            boxShadow: state !== 'disconnected' ? `0 0 10px ${currentTheme.glow}` : 'none',
          }}
        />
        <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-200">
          {screenShareState?.isSharing ? (
            screenShareState.isAnalyzing ? (
              <span className="text-cyan-300 font-semibold animate-pulse">
                Analyzing your screen • Processing visual elements & text...
              </span>
            ) : (
              <span>
                Screen Vision Active • AIRA is observing your screen as you talk
              </span>
            )
          ) : (
            <>
              {state === 'disconnected' && 'AIRA Core Offline • Click the core or use button below to initiate'}
              {state === 'connecting' && 'Establishing neural audio link to Gemini Live...'}
              {state === 'idle' && (isMuted ? 'Mic is muted • Unmute to converse' : 'Ready & listening • Speak naturally')}
              {state === 'listening' && (isMuted ? 'Mic is muted • Unmute to talk' : 'Listening to your voice...')}
              {state === 'thinking' && 'Processing thoughts...'}
              {state === 'speaking' && 'AIRA is speaking • Tap core or say "quiet" to interrupt'}
              {state === 'interrupted' && 'Yielded • Listening to you...'}
              {state === 'ending' && 'Session winding down...'}
            </>
          )}
        </p>
      </motion.div>

      {/* Direct Tactile Control Dock (Wake/Sleep, Mute, Interrupt, Share Screen) */}
      <div id="aira-tactile-dock" className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
        {/* Connection Toggle */}
        <button
          type="button"
          onClick={onActionClick}
          className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          style={{
            backgroundColor: state === 'disconnected' ? currentTheme.surface : 'rgba(255, 255, 255, 0.06)',
            borderColor: state === 'disconnected' ? currentTheme.border : 'rgba(255, 255, 255, 0.15)',
            borderWidth: '1px',
            color: state === 'disconnected' ? currentTheme.accent : '#f1f5f9',
          }}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{state === 'disconnected' ? 'Wake AIRA' : 'Disconnect'}</span>
        </button>

        {/* Futuristic Screen Share Button */}
        {onScreenShareToggle && (
          <button
            id="aira-screen-share-btn"
            type="button"
            onClick={onScreenShareToggle}
            disabled={
              !isScreenShareSupported ||
              screenShareState?.status === 'starting' ||
              screenShareState?.status === 'stopping'
            }
            aria-label={
              screenShareState?.isSharing
                ? 'Stop sharing screen'
                : 'Share your screen with AIRA'
            }
            title={
              !isScreenShareSupported
                ? 'Screen share not supported in this browser'
                : screenShareState?.isSharing
                ? 'Click to stop sharing screen'
                : 'Share screen with AIRA'
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 select-none ${
              screenShareState?.isSharing
                ? 'border shadow-lg animate-pulse'
                : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
            } ${!isScreenShareSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={
              screenShareState?.isSharing
                ? {
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.accent,
                    color: currentTheme.accent,
                    boxShadow: `0 0 18px ${currentTheme.glow}`,
                  }
                : undefined
            }
          >
            {screenShareState?.status === 'starting' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Starting...</span>
              </>
            ) : screenShareState?.status === 'stopping' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Stopping...</span>
              </>
            ) : screenShareState?.isSharing ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <Monitor className="w-3.5 h-3.5" />
                <span>Sharing Screen</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Screen</span>
              </>
            )}
          </button>
        )}

        {/* Quick Screen Inspect Button (when sharing is active) */}
        {screenShareState?.isSharing && onForceInspect && (
          <button
            type="button"
            onClick={onForceInspect}
            title="Force immediate screen analysis frame"
            aria-label="Analyze screen frame now"
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        )}

        {/* Mic Toggle (when connected) */}
        {state !== 'disconnected' && onMuteToggle && (
          <button
            type="button"
            onClick={onMuteToggle}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
              isMuted
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>
        )}

        {/* Interrupt Button (when AIRA is speaking) */}
        {state === 'speaking' && onInterrupt && (
          <button
            type="button"
            onClick={onInterrupt}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer shadow-md active:scale-95 animate-pulse"
          >
            <Square className="w-3 h-3 fill-amber-300" />
            <span>Interrupt</span>
          </button>
        )}
      </div>
    </div>
  );
};
