import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, MicOff, Palette, Info, Radio, Clock, Brain, Sliders } from 'lucide-react';
import { AssistantState, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface HeaderProps {
  state: AssistantState;
  auraTheme: AuraTheme;
  isMuted: boolean;
  sessionStartTime: number | null;
  memoryCount?: number;
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
    <header id="aira-header" className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border shadow-lg overflow-hidden transition-colors duration-500"
          style={{
            backgroundColor: 'rgba(15, 20, 32, 0.75)',
            borderColor: currentTheme.border,
            boxShadow: `0 0 16px ${currentTheme.glow}`,
          }}
        >
          <div
            className="absolute inset-0 opacity-25 filter blur-sm transition-colors duration-500"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <Radio className="w-5 h-5 relative z-10 transition-colors duration-500 animate-pulse" style={{ color: currentTheme.accent }} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-white font-['Outfit']">
              AIRA
            </h1>
            <span
              className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border tracking-wider transition-colors duration-500"
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.accent,
                backgroundColor: currentTheme.surface,
              }}
            >
              Live Voice
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">
            Real-Time AI Companion
          </p>
        </div>
      </div>

      {/* Controls & Status Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Session Timer (when connected) */}
        {state !== 'disconnected' && (
          <div
            id="aira-session-timer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5 bg-white/[0.04] text-xs font-mono text-slate-300"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{sessionTimeStr}</span>
          </div>
        )}

        {/* Memory Panel Trigger */}
        <button
          id="aira-memory-btn"
          type="button"
          onClick={onOpenMemory}
          className="px-2.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
          title="AIRA's Memory"
          aria-label="Open AIRA Long-term Memory"
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

        {/* Microphone Mute Toggle (when connected) */}
        {state !== 'disconnected' && (
          <button
            id="aira-mute-toggle-btn"
            type="button"
            onClick={onMuteToggle}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isMuted
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic Active'}</span>
          </button>
        )}

        {/* Aura Theme Selector Trigger */}
        <div className="relative">
          <button
            id="aira-theme-picker-btn"
            type="button"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Customize Aura Theme"
          >
            <Palette className="w-4 h-4" style={{ color: currentTheme.accent }} />
            <span className="hidden sm:inline">Themes</span>
          </button>

          {/* Theme Dropdown */}
          {showThemePicker && (
            <div
              id="aira-theme-dropdown"
              className="absolute right-0 mt-2 w-56 p-2 rounded-2xl backdrop-blur-xl border border-white/15 bg-[#0c101c]/95 shadow-2xl z-50 flex flex-col gap-1 max-h-80 overflow-y-auto"
            >
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>10 Cyber Themes</span>
                <span className="text-[9px] font-mono" style={{ color: currentTheme.accent }}>
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
                        ? 'bg-white/15 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="truncate">{theme.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {theme.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Diagnostics & Settings Button */}
        <button
          id="aira-settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all cursor-pointer"
          title="Settings & Latency Diagnostics"
          aria-label="Settings and Diagnostics"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Info / Personality Modal Button */}
        <button
          id="aira-info-btn"
          type="button"
          onClick={onOpenInfo}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all cursor-pointer"
          title="About AIRA"
          aria-label="About AIRA"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

