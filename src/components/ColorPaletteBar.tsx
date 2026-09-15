import React from 'react';
import { motion } from 'motion/react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';
import { Palette, Sparkles } from 'lucide-react';

interface ColorPaletteBarProps {
  auraTheme: AuraTheme;
  onSelectTheme: (theme: AuraTheme) => void;
}

export const ColorPaletteBar: React.FC<ColorPaletteBarProps> = ({
  auraTheme,
  onSelectTheme,
}) => {
  const currentConfig = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const themeKeys = Object.keys(AURA_THEMES) as AuraTheme[];

  return (
    <nav
      id="aira-color-palette-bar"
      aria-label="Aura Color Codes"
      className="relative z-20 flex flex-col items-center justify-center gap-1.5 max-w-4xl mx-auto px-4 py-1.5"
    >
      <div
        className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl border bg-[#060a14]/90 shadow-2xl overflow-x-auto max-w-full transition-all duration-500"
        style={{ borderColor: currentConfig.border }}
      >
        {/* Active Theme Hex Label */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/10 shrink-0 text-slate-400">
          <Palette className="w-3.5 h-3.5" style={{ color: currentConfig.accent }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
            {currentConfig.name}
          </span>
          <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
            ({currentConfig.hexCode})
          </span>
        </div>

        {/* 12 Color Swatches */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {themeKeys.map((key) => {
            const config = AURA_THEMES[key];
            const isSelected = key === auraTheme;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectTheme(key)}
                className="relative group p-1 sm:p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer focus:outline-none"
                title={`${config.name} (${config.hexCode})`}
                aria-label={`Select ${config.name}`}
              >
                {/* Active Selection Glow Ring */}
                {isSelected && (
                  <motion.div
                    layoutId="active-aura-ring"
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: config.primary,
                      boxShadow: `0 0 14px ${config.glow}`,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}

                {/* Color Dot Swatch */}
                <div
                  className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 border border-white/20 ${
                    isSelected ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-120'
                  }`}
                  style={{
                    backgroundColor: config.primary,
                    boxShadow: isSelected ? `0 0 10px ${config.primary}` : 'none',
                  }}
                />

                {/* Hover Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap bg-black/95 border border-white/15 text-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl">
                  {config.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
