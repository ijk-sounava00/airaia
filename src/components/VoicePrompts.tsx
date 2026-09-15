import React, { useState } from 'react';
import { Sparkles, Terminal, Copy, Check } from 'lucide-react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface VoicePromptsProps {
  auraTheme: AuraTheme;
}

interface PromptCategory {
  category: string;
  prompts: string[];
}

const PROMPT_GROUPS: PromptCategory[] = [
  {
    category: 'Conversational',
    prompts: [
      '“Hey AIRA, how are you feeling today?”',
      '“What are you thinking about?”',
      '“Tell me something fascinating about the cosmos”',
    ],
  },
  {
    category: 'Memory & Identity',
    prompts: [
      '“Remember my name is Alex and I love sci-fi”',
      '“What do you remember about me?”',
      '“Forget my favorite food”',
    ],
  },
  {
    category: 'Themes & Visuals',
    prompts: [
      '“Change color code to Crimson”',
      '“Switch aura theme to Celestial Gold”',
      '“Set aura to Cyber Cyan”',
    ],
  },
  {
    category: 'Screen Vision',
    prompts: [
      '“AIRA, look at my screen — what do you see?”',
      '“Can you spot the bug or error in my code?”',
      '“Explain what this diagram or website is showing”',
    ],
  },
  {
    category: 'Tools & Utilities',
    prompts: [
      '“Set a 2-minute focus timer”',
      '“Open GitHub for me”',
      '“Shut up!” (Instant interrupt)',
    ],
  },
];

export const VoicePrompts: React.FC<VoicePromptsProps> = ({ auraTheme }) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    const cleanText = text.replace(/[“”"]/g, '');
    navigator.clipboard?.writeText(cleanText);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <footer
      id="aira-voice-prompts-bar"
      aria-label="Voice Command Matrix"
      className="w-full max-w-4xl mx-auto px-4 py-3 z-20"
    >
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono font-semibold uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
          <span>Voice Command Matrix</span>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center gap-1">
          {PROMPT_GROUPS.map((group, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                activeTab === idx
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                activeTab === idx
                  ? {
                      backgroundColor: currentTheme.surface,
                      color: currentTheme.accent,
                      border: `1px solid ${currentTheme.border}`,
                    }
                  : {}
              }
            >
              {group.category}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts for active tab */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-center">
        {PROMPT_GROUPS[activeTab].prompts.map((prompt, idx) => {
          const isCopied = copiedText === prompt;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCopy(prompt)}
              className="group px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 text-slate-300 hover:text-white text-xs tracking-wide transition-all select-none cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Click to copy prompt"
            >
              <span>{prompt}</span>
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
