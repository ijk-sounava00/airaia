import React from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  X,
  Zap,
  Activity,
  Sliders,
  Volume2,
  Shield,
  Palette,
  Radio,
  Cpu,
  Check,
} from 'lucide-react';
import { AuraTheme, AssistantState } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface SettingsPanelProps {
  isOpen: boolean;
  state: AssistantState;
  auraTheme: AuraTheme;
  audioVolume: number;
  onSelectTheme: (theme: AuraTheme) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  state,
  auraTheme,
  audioVolume,
  onSelectTheme,
  onClose,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const themeKeys = Object.keys(AURA_THEMES) as AuraTheme[];

  if (!isOpen) return null;

  return (
    <div
      id="aira-settings-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="AIRA Diagnostics & Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="aira-settings-panel"
        className="relative w-full max-w-xl flex flex-col rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden bg-[#090d18]/95"
        style={{
          borderColor: currentTheme.border,
          boxShadow: `0 24px 64px ${currentTheme.glow}`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <Sliders className="w-5 h-5" style={{ color: currentTheme.accent }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Engine Settings & Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Ultra-low latency configuration & neon telemetry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Live Performance & Latency Metrics */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Live Response Latency Engine
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Optimized (1024 chunks)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">AI Engine</span>
                <span className="text-xs font-mono font-bold text-white truncate block">
                  gemini-3.1-flash-live
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Audio Pipeline</span>
                <span className="text-xs font-mono font-bold text-cyan-300 block">
                  PCM16 16k &harr; 24k
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">Turn Interruption</span>
                <span className="text-xs font-mono font-bold text-emerald-300 block">
                  Instant Barge-in
                </span>
              </div>
            </div>
          </div>

          {/* Voice & Personality Config */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Vocal Persona & Speech
              </span>
              <span className="text-[10px] font-mono text-slate-400">Voice: Kore</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AIRA is configured as a warm, witty human conversational companion with zero robotic filler.
              When spoken to, she responds without delay and finishes speaking naturally.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">Audio volume meter:</span>
              <div className="flex-1 h-2 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, Math.round(audioVolume * 250))}%`,
                    backgroundColor: currentTheme.primary,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 10 Cyber-Futuristic Color Codes */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4" style={{ color: currentTheme.accent }} />
                10 Holographic Color Themes
              </span>
              <span className="text-[10px] font-mono" style={{ color: currentTheme.accent }}>
                Active: {currentTheme.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {themeKeys.map((key) => {
                const config = AURA_THEMES[key];
                const isSelected = key === auraTheme;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectTheme(key)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white/40 bg-white/10 text-white shadow-lg'
                        : 'border-white/5 bg-black/30 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full shadow-md flex items-center justify-center"
                      style={{ backgroundColor: config.primary }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {config.name}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">
                      {config.hexCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3.5 border-t bg-white/[0.02] flex items-center justify-end"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-semibold text-xs text-black cursor-pointer shadow-lg"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
