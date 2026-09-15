import React from 'react';
import { Sparkles } from 'lucide-react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface VoicePromptsProps {
  auraTheme: AuraTheme;
}

const SAMPLE_PROMPTS = [
  '“Hey AIRA, remember my name is Alex”',
  '“What do you remember about me?”',
  '“Change color code to Aurora”',
  '“Shut up!” (Instant silence)',
  '“Set a 5-minute timer”',
  '“Open YouTube for me”',
  '“What are you thinking about?”',
];

export const VoicePrompts: React.FC<VoicePromptsProps> = ({ auraTheme }) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  return (
    <footer id="aira-voice-prompts-bar" aria-label="Voice Suggestions" className="w-full max-w-4xl mx-auto px-4 py-4 z-20">
      <div className="flex items-center justify-center gap-1.5 mb-2 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
        <Sparkles className="w-3 h-3" style={{ color: currentTheme.accent }} />
        <span>Voice Suggestions</span>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap text-center">
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <div
            key={idx}
            className="px-3 py-1 rounded-full backdrop-blur-md border border-white/5 bg-white/[0.02] text-slate-300 text-xs tracking-wide transition-all select-none"
          >
            {prompt}
          </div>
        ))}
      </div>
    </footer>
  );
};
