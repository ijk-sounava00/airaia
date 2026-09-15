export type AssistantState =
  | 'disconnected'
  | 'connecting'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'ending';

export type AuraTheme =
  | 'cyan'
  | 'violet'
  | 'emerald'
  | 'crimson'
  | 'solar'
  | 'sapphire'
  | 'sunset'
  | 'aurora'
  | 'amethyst'
  | 'obsidian'
  | 'gold'
  | 'vapor';

export interface AuraConfig {
  id: AuraTheme;
  name: string;
  hexCode: string;
  primary: string;
  glow: string;
  border: string;
  surface: string;
  accent: string;
  gradient: string;
  tag: string;
  soundHue?: string;
}

export type CoreVisualMode = 'quantum' | 'spectral' | 'matrix';

export type AIRAMood = 'balanced' | 'empathetic' | 'analytical' | 'playful' | 'zen' | 'cyber';

export type MemoryCategory =
  | 'identity'
  | 'preferences'
  | 'dislikes'
  | 'interests'
  | 'communication'
  | 'projects'
  | 'habits'
  | 'instructions'
  | 'other';

export interface Memory {
  id: string;
  userId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  source: 'explicit' | 'conversation' | 'inferred';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolNotification {
  id: string;
  name: string;
  title: string;
  detail?: string;
  timestamp: number;
  url?: string;
  actionType?: 'link' | 'timer' | 'aura' | 'memory' | 'info';
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface LiveTranscript {
  role: 'user' | 'aira';
  text: string;
  timestamp: number;
}

export type CharacterEmotion =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'happy'
  | 'wink'
  | 'surprised'
  | 'angry'
  | 'interrupted';

