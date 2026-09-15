import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Bell, X, Check } from 'lucide-react';
import { ActiveTimer, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface TimerWidgetProps {
  timers: ActiveTimer[];
  auraTheme: AuraTheme;
  onDismiss: (id: string) => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  timers,
  auraTheme,
  onDismiss,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  if (timers.length === 0) return null;

  return (
    <aside
      id="aira-active-timers"
      aria-label="Active Timers"
      className="fixed bottom-24 left-4 sm:left-6 z-40 flex flex-col gap-2.5 max-w-xs w-full pointer-events-none"
    >
      <AnimatePresence>
        {timers.map((timer, idx) => {
          const isDone = timer.remainingSeconds === 0;
          const mins = Math.floor(timer.remainingSeconds / 60);
          const secs = timer.remainingSeconds % 60;
          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          const progressPercent = Math.max(
            0,
            Math.min(100, (timer.remainingSeconds / Math.max(1, timer.totalSeconds)) * 100)
          );

          return (
            <motion.div
              key={timer.id || `timer-${idx}`}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto p-3.5 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center justify-between gap-3 text-white transition-all ${
                isDone
                  ? 'bg-amber-500/20 border-amber-400/50 shadow-amber-500/20 animate-pulse'
                  : 'bg-[#0b0f19]/90 border-white/10'
              }`}
              style={{ borderColor: isDone ? '#f59e0b' : currentTheme.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: isDone ? 'rgba(245, 158, 11, 0.2)' : currentTheme.surface,
                    borderColor: isDone ? '#f59e0b' : currentTheme.border,
                    color: isDone ? '#fbbf24' : currentTheme.accent,
                  }}
                >
                  {isDone ? <Bell className="w-5 h-5 animate-bounce" /> : <Timer className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono tracking-wider">
                      {timeStr}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Done!
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">
                    {timer.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDismiss(timer.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss timer"
                  aria-label="Dismiss timer"
                >
                  {isDone ? <Check className="w-4 h-4 text-amber-300" /> : <X className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
};
