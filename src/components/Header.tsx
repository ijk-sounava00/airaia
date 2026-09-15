import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Palette,
  Info,
  Radio,
  Clock,
  Brain,
  Sliders,
  Zap,
  Check,
  Monitor,
} from 'lucide-react';
import { AssistantState, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';
import { ScreenShareState } from '../screen/screenTypes';

interface HeaderProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  isMuted: boolean;
  sessionStartTime: number | null;
  memoryCount?: number;
  screenShareState?: ScreenShareState;
  onScreenShareToggle?: () => void;
  onAuraSelect: (theme: AuraTheme) => void;
  onMuteToggle: () => void;
  onOpenInfo: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  auraTheme,
  isMuted,
  sessionStartTime,
  memoryCount = 0,
  screenShareState,
  onScreenShareToggle,
  onAuraSelect,
  onMuteToggle,
  onOpenInfo,
  onOpenMemory,
  onOpenSettings,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [sessionTimeStr, setSessionTimeStr] = useState<string>('00:00');

  // Format session time
  useEffect(() => {
    if (!sessionStartTime || state === 'disconnected') {
      setSessionTimeStr('00:00');
      return;
    }

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - sessionStartTime) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      setSessionTimeStr(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, state]);

  return (
    <header
      id="aira-header"
      className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between"
    >
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border shadow-lg overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: 'rgba(8, 12, 22, 0.85)',
            borderColor: currentTheme.border,
            boxShadow: `0 0 20px ${currentTheme.glow}`,
          }}
        >
          {/* Pulsing inner gradient flare */}
          <div
            className="absolute inset-0 opacity-30 filter blur-sm transition-colors duration-500"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <Radio
            className="w-5 h-5 relative z-10 transition-colors duration-500 animate-pulse"
            style={{ color: currentTheme.accent }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-white font-['Outfit']">
              AIRA <span className="text-xs font-mono font-medium opacity-60 text-slate-400">v2</span>
            </h1>
            <span
              className="text-[9px] sm:text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full border tracking-wider transition-colors duration-500 flex items-center gap-1"
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.accent,
                backgroundColor: currentTheme.surface,
              }}
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Live AI</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">
            Real-Time Quantum AI Companion
          </p>
        </div>
      </div>

      {/* Controls & Telemetry Dock */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Live Session Counter */}
        {state !== 'disconnected' && (
          <div
            id="aira-session-timer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-white/[0.04] text-xs font-mono text-slate-300 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{sessionTimeStr}</span>
          </div>
        )}

        {/* Screen Share Quick Indicator / Trigger */}
        {onScreenShareToggle && (
          <button
            id="aira-header-screen-btn"
            type="button"
            onClick={onScreenShareToggle}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full backdrop-blur-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
              screenShareState?.isSharing
                ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
            }`}
            title={
              screenShareState?.isSharing
                ? 'Screen sharing is active (Click to stop)'
                : 'Share Screen with AIRA'
            }
            aria-label={
              screenShareState?.isSharing
                ? 'Screen sharing active. Click to stop'
                : 'Share Screen'
            }
          >
            {screenShareState?.isSharing ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <Monitor className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline font-mono text-[11px] font-semibold text-cyan-200">
                  {screenShareState.isAnalyzing ? 'SCANNING' : 'SCREEN LIVE'}
                </span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Share</span>
              </>
            )}
          </button>
        )}

        {/* Memory Matrix Trigger */}
        <button
          id="aira-memory-btn"
          type="button"
          onClick={onOpenMemory}
          className="px-2.5 sm:px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title="AIRA's Memory Matrix"
          aria-label="Open Memory Matrix"
        >
          <Brain className="w-4 h-4" style={{ color: currentTheme.accent }} />
          <span className="hidden sm:inline">Memory</span>
          {memoryCount > 0 && (
            <span
              className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold"
              style={{
                backgroundColor: currentTheme.surface,
                color: currentTheme.accent,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              {memoryCount}
            </span>
          )}
        </button>

        {/* Mic Toggle (when connected) */}
        {state !== 'disconnected' && (
          <button
            id="aira-mute-toggle-btn"
            type="button"
            onClick={onMuteToggle}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic Active'}</span>
          </button>
        )}

        {/* 12-Color Aura Matrix Dropdown Trigger */}
        <div className="relative">
          <button
            id="aira-theme-picker-btn"
            type="button"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="12 Cyber Color Codes"
          >
            <Palette className="w-4 h-4" style={{ color: currentTheme.accent }} />
            <span className="hidden sm:inline">Palettes</span>
          </button>

          {/* Theme Dropdown Menu with all 12 Themes */}
          {showThemePicker && (
            <div
              id="aira-theme-dropdown"
              className="absolute right-0 mt-2 w-64 p-2.5 rounded-2xl backdrop-blur-2xl border border-white/15 bg-[#0a0f1d]/95 shadow-2xl z-50 flex flex-col gap-1 max-h-88 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                <span>12 Cyber Color Codes</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: currentTheme.accent }}>
                  {currentTheme.hexCode}
                </span>
              </div>
              {(Object.keys(AURA_THEMES) as AuraTheme[]).map((key) => {
                const theme = AURA_THEMES[key];
                const isSelected = key === auraTheme;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onAuraSelect(key);
                      setShowThemePicker(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="truncate">{theme.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{theme.tag}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" style={{ color: theme.accent }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Diagnostics & Settings Modal Trigger */}
        <button
          id="aira-settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full backdrop-blur-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm active:scale-95"
          title="Neural Diagnostics & Voice Settings"
          aria-label="Settings and Diagnostics"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Info & Specs Trigger */}
        <button
          id="aira-info-btn"
          type="button"
          onClick={onOpenInfo}
          className="p-2 rounded-full backdrop-blur-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm active:scale-95"
          title="About AIRA Intelligence"
          aria-label="About AIRA"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
