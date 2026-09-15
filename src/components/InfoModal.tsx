import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Shield, Mic, Globe, Cpu, Radio } from 'lucide-react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface InfoModalProps {
  isOpen: boolean;
  auraTheme: AuraTheme;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  auraTheme,
  onClose,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="aira-info-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-lg p-6 rounded-3xl backdrop-blur-2xl border bg-[#080c18]/95 text-white shadow-2xl overflow-hidden"
          style={{ borderColor: currentTheme.border }}
        >
          {/* Top ambient glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full filter blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: currentTheme.primary }}
          />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.border,
                  color: currentTheme.accent,
                }}
              >
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Outfit'] tracking-wide flex items-center gap-2">
                  <span>AIRA Architecture</span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: currentTheme.surface, color: currentTheme.accent }}
                  >
                    v2.0
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time Neural Voice Companion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              <strong className="text-white">AIRA</strong> is a young, confident, witty, and charming female AI companion engineered for spontaneous, real-time live voice conversations with zero latency delay.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Mic className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Bidirectional Live Voice</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Direct PCM16 streaming over WebSockets via Gemini Live API. No text translation delays or robotic voice artifacts.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Zap className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Quantum Core v2</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Interactive gyroscopic 3D neural core with frequency-responsive rings, particle constellations, and sound reactive auras.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Globe className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Autonomous Tools</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Can trigger timers, shift aura color codes, store long-term memories in its matrix, and query local time.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Shield className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Instant Barge-In</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Simply speak to interrupt her or click the central core to yield instantly, exactly like chatting with a person.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine: gemini-3.1-flash-live</span>
              </div>
              <span className="font-mono text-cyan-300">16kHz &rarr; 24kHz PCM</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-black transition-all cursor-pointer shadow-lg"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 4px 16px ${currentTheme.glow}`,
              }}
            >
              Start Talking
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
