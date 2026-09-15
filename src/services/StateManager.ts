import { AssistantState, AuraTheme, ToolNotification, ActiveTimer, LiveTranscript } from '../types';

export interface StateSnapshot {
  state: AssistantState;
  auraTheme: AuraTheme;
  isMuted: boolean;
  audioVolume: number;
  frequencyData: number[];
  activeTimers: ActiveTimer[];
  toolNotifications: ToolNotification[];
  liveTranscript: LiveTranscript | null;
  errorMessage: string | null;
  sessionStartTime: number | null;
}

type StateListener = (snapshot: StateSnapshot) => void;

/**
 * StateManager
 * Centralized state controller for AIRA's state machine, visual themes,
 * live timers, tool notifications, and audio analysis levels.
 */
export class StateManager {
  private listeners: Set<StateListener> = new Set();

  private snapshot: StateSnapshot = {
    state: 'disconnected',
    auraTheme: (localStorage.getItem('aira_aura_theme') as AuraTheme) || 'cyan',
    isMuted: false,
    audioVolume: 0,
    frequencyData: new Array(32).fill(0),
    activeTimers: [],
    toolNotifications: [],
    liveTranscript: null,
    errorMessage: null,
    sessionStartTime: null,
  };

  private timerInterval: number | null = null;

  constructor() {
    this.startTimerTicker();
  }

  getSnapshot(): StateSnapshot {
    return this.snapshot;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }

  setState(state: AssistantState): void {
    let sessionStartTime = this.snapshot.sessionStartTime;
    if ((state === 'idle' || state === 'listening') && this.snapshot.state === 'connecting') {
      sessionStartTime = Date.now();
    } else if (state === 'disconnected') {
      sessionStartTime = null;
    }

    this.snapshot = {
      ...this.snapshot,
      state,
      sessionStartTime,
      errorMessage: state === 'disconnected' ? this.snapshot.errorMessage : null,
    };
    this.emit();
  }

  setAuraTheme(auraTheme: AuraTheme): void {
    try {
      localStorage.setItem('aira_aura_theme', auraTheme);
    } catch {
      // ignore
    }
    this.snapshot = { ...this.snapshot, auraTheme };
    this.emit();
  }

  setMuted(isMuted: boolean): void {
    this.snapshot = { ...this.snapshot, isMuted };
    this.emit();
  }

  setAudioAnalysis(volume: number, frequencies: Uint8Array): void {
    const bins: number[] = [];
    const step = Math.max(1, Math.floor(frequencies.length / 32));
    for (let i = 0; i < 32; i++) {
      const idx = Math.min(i * step, frequencies.length - 1);
      bins.push(frequencies[idx] / 255);
    }

    this.snapshot = {
      ...this.snapshot,
      audioVolume: volume,
      frequencyData: bins,
    };
    this.emit();
  }

  setTranscript(role: 'user' | 'aira', text: string): void {
    this.snapshot = {
      ...this.snapshot,
      liveTranscript: {
        role,
        text,
        timestamp: Date.now(),
      },
    };
    this.emit();
  }

  setError(errorMessage: string | null): void {
    this.snapshot = { ...this.snapshot, errorMessage };
    this.emit();
  }

  addToolNotification(notification: ToolNotification): void {
    // Deduplicate by ID and keep max 3 notifications
    const existingFiltered = this.snapshot.toolNotifications.filter((n) => n.id !== notification.id);
    const next = [notification, ...existingFiltered.slice(0, 2)];
    this.snapshot = { ...this.snapshot, toolNotifications: next };
    this.emit();

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      this.dismissNotification(notification.id);
    }, 7000);
  }

  dismissNotification(id: string): void {
    this.snapshot = {
      ...this.snapshot,
      toolNotifications: this.snapshot.toolNotifications.filter((n) => n.id !== id),
    };
    this.emit();
  }

  addTimer(durationSeconds: number, label = 'Timer'): void {
    const id = `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newTimer: ActiveTimer = {
      id,
      label,
      totalSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
    };

    this.snapshot = {
      ...this.snapshot,
      activeTimers: [...this.snapshot.activeTimers.filter((t) => t.id !== id), newTimer],
    };
    this.emit();
  }

  dismissTimer(id: string): void {
    this.snapshot = {
      ...this.snapshot,
      activeTimers: this.snapshot.activeTimers.filter((t) => t.id !== id),
    };
    this.emit();
  }

  private startTimerTicker() {
    if (typeof window === 'undefined') return;

    this.timerInterval = window.setInterval(() => {
      if (this.snapshot.activeTimers.length === 0) return;

      let changed = false;
      const updated = this.snapshot.activeTimers.map((timer) => {
        if (!timer.isRunning) return timer;
        if (timer.remainingSeconds <= 1) {
          changed = true;
          return {
            ...timer,
            remainingSeconds: 0,
            isRunning: false,
          };
        }
        changed = true;
        return {
          ...timer,
          remainingSeconds: timer.remainingSeconds - 1,
        };
      });

      if (changed) {
        this.snapshot = {
          ...this.snapshot,
          activeTimers: updated,
        };
        this.emit();
      }
    }, 1000);
  }

  destroy(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.listeners.clear();
  }
}
