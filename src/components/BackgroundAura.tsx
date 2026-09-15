import React from 'react';
import { motion } from 'motion/react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface BackgroundAuraProps {
  auraTheme: AuraTheme;
  volume: number;
  isSpeaking: boolean;
}

export const BackgroundAura: React.FC<BackgroundAuraProps> = ({
  auraTheme,
  volume,
  isSpeaking,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  const glowScale = 1 + volume * 0.4;
  const glowOpacity = isSpeaking ? 0.35 + volume * 0.25 : 0.2 + volume * 0.15;

  return (
    <div id="aira-background-root" className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#06080e]">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-radial from-[#0d1322] via-[#080b12] to-[#040609]" />

      {/* Primary ambient light bloom */}
      <motion.div
        id="aira-ambient-bloom"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full filter blur-[120px] transition-colors duration-1000"
        style={{
          backgroundColor: currentTheme.primary,
          opacity: glowOpacity,
        }}
        animate={{
          scale: glowScale,
        }}
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 20,
        }}
      />

      {/* Secondary accent bloom */}
      <motion.div
        id="aira-accent-bloom"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full filter blur-[90px] transition-colors duration-1000"
        style={{
          backgroundColor: currentTheme.accent,
          opacity: glowOpacity * 0.7,
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle futuristic matrix grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Vignette border */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60" />
    </div>
  );
};
