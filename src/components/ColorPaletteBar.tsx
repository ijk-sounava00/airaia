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
      aria-label="Color Themes"
      className="relative z-20 flex flex-col items-center justify-center gap-2 max-w-2xl mx-auto px-4 py-2"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 bg-[#090d18]/80 shadow-xl overflow-x-auto no-scrollbar max-w-full">
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0 text-slate-400">
          <Palette className="w-3.5 h-3.5" style={{ color: currentConfig.accent }} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
            {currentConfig.tag}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {themeKeys.map((key) => {
            const config = AURA_THEMES[key];
            const isSelected = key === auraTheme;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectTheme(key)}
                className="relative group p-1 sm:p-1.5 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40"
                title={`${config.name} (${config.hexCode})`}
                aria-label={`Select ${config.name} theme`}
              >
                {/* Active selection glowing halo */}
                {isSelected && (
                  <motion.div
                    layoutId="active-color-ring"
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: config.primary,
                      boxShadow: `0 0 12px ${config.glow}`,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}

                {/* Color Dot Swatch */}
                <div
                  className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-transform duration-200 ${
                    isSelected ? 'scale-110' : 'group-hover:scale-125 opacity-75 group-hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: config.primary,
                    boxShadow: isSelected ? `0 0 8px ${config.primary}` : 'none',
                  }}
                />

                {/* Hover Tooltip */}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap bg-black/90 border border-white/15 text-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-lg">
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
