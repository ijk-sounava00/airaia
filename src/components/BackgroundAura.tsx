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

  const glowScale = 1 + volume * 0.45;
  const glowOpacity = isSpeaking ? 0.38 + volume * 0.28 : 0.22 + volume * 0.18;

  return (
    <div
      id="aira-background-root"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#04060c]"
    >
      {/* Deep Cyber Radial Gradient */}
      <div className="absolute inset-0 bg-radial from-[#090f1d] via-[#050811] to-[#020408]" />

      {/* Primary Ambient Light Bloom */}
      <motion.div
        id="aira-ambient-bloom-primary"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] md:w-[780px] md:h-[780px] rounded-full filter blur-[130px] transition-colors duration-1000"
        style={{
          backgroundColor: currentTheme.primary,
          opacity: glowOpacity,
        }}
        animate={{
          scale: glowScale,
        }}
        transition={{
          type: 'spring',
          stiffness: 70,
          damping: 22,
        }}
      />

      {/* Secondary Accent Light Bloom */}
      <motion.div
        id="aira-accent-bloom-secondary"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] md:w-[500px] md:h-[500px] rounded-full filter blur-[100px] transition-colors duration-1000"
        style={{
          backgroundColor: currentTheme.accent,
          opacity: glowOpacity * 0.65,
        }}
        animate={{
          scale: [1, 1.18, 1],
          rotate: [0, 120, 240, 360],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Tertiary Deep Orbit Light */}
      <motion.div
        className="absolute bottom-10 right-1/4 w-[320px] h-[320px] rounded-full filter blur-[110px] transition-colors duration-1000"
        style={{
          backgroundColor: currentTheme.primary,
          opacity: glowOpacity * 0.35,
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Futuristic Cyber Circuit Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.6) 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Vignette Shadow Frame */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/75" />
    </div>
  );
};
