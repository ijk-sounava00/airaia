import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, CheckCircle, Palette, Timer, X } from 'lucide-react';
import { ToolNotification, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface ToolCardsProps {
  notifications: ToolNotification[];
  auraTheme: AuraTheme;
  onDismiss: (id: string) => void;
}

export const ToolCards: React.FC<ToolCardsProps> = ({
  notifications,
  auraTheme,
  onDismiss,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  if (notifications.length === 0) return null;

  return (
    <aside
      id="aira-tool-notifications"
      aria-label="Tool Notifications"
      className="fixed top-20 right-4 sm:right-6 z-40 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {notifications.map((notif, idx) => (
          <motion.div
            key={notif.id || `notif-${idx}`}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto p-3.5 rounded-2xl backdrop-blur-xl border bg-[#0b0f19]/90 shadow-2xl flex items-start justify-between gap-3 text-white transition-all"
            style={{ borderColor: currentTheme.border }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.border,
                  color: currentTheme.accent,
                }}
              >
                {notif.actionType === 'link' && <ExternalLink className="w-4 h-4" />}
                {notif.actionType === 'timer' && <Timer className="w-4 h-4" />}
                {notif.actionType === 'aura' && <Palette className="w-4 h-4" />}
                {!notif.actionType && <CheckCircle className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    AIRA Action
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                  {notif.title}
                </h4>
                {notif.detail && (
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {notif.detail}
                  </p>
                )}

                {notif.url && (
                  <div className="mt-2">
                    <a
                      href={notif.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors border border-white/10"
                    >
                      <span>Open in Browser</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
};
