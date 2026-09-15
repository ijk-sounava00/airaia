import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Shield, Mic, Globe, Cpu } from 'lucide-react';
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
      <div id="aira-info-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          className="relative w-full max-w-lg p-6 rounded-3xl backdrop-blur-2xl border bg-[#0b0f19]/95 text-white shadow-2xl overflow-hidden"
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
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Outfit'] tracking-wide">
                  Meet AIRA
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time Voice-to-Voice Companion
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
              <strong className="text-white">AIRA</strong> is a young, confident, witty, and charming female AI companion engineered for spontaneous, real-time live voice conversations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Mic className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Pure Voice-to-Voice</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Powered by Gemini Live API with direct PCM audio streaming. No text chat lag or robotic synthesis.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Zap className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Instant Interruption</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Speak naturally at any moment to cut in, just like a real human conversation.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Globe className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Live Function Calling</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Ask AIRA to open websites, launch countdown timers, adjust holographic auras, or check local time.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-xs">
                  <Shield className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                  <span>Sophisticated & Safe</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Playful and emotionally perceptive while maintaining a classy, respectful personality at all times.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine: gemini-3.1-flash-live-preview</span>
              </div>
              <span>Audio: 16kHz In / 24kHz Out</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-lg"
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
