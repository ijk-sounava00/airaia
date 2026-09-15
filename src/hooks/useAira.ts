import { useEffect, useRef, useState, useCallback } from 'react';
import { AssistantState, AuraTheme } from '../types';
import { AudioStreamer } from '../services/AudioStreamer';
import { AudioPlayer } from '../services/AudioPlayer';
import { ToolManager } from '../services/ToolManager';
import { LiveSession } from '../services/LiveSession';
import { StateManager, StateSnapshot } from '../services/StateManager';
import { soundEffects } from '../services/soundEffects';
import { ScreenShareManager } from '../screen/ScreenShareManager';
import { ScreenShareState } from '../screen/screenTypes';

export function useAira() {
  const stateManagerRef = useRef<StateManager | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const screenShareManagerRef = useRef<ScreenShareManager | null>(null);

  // Keep state manager in ref
  if (!stateManagerRef.current) {
    stateManagerRef.current = new StateManager();
  }

  // Keep screen share manager in ref
  if (!screenShareManagerRef.current) {
    screenShareManagerRef.current = new ScreenShareManager();
  }

  const [snapshot, setSnapshot] = useState<StateSnapshot>(() => stateManagerRef.current!.getSnapshot());
  const [screenShareState, setScreenShareState] = useState<ScreenShareState>(() =>
    screenShareManagerRef.current!.getState()
  );

  // Subscribe to screen share state and frame streaming
  useEffect(() => {
    const ssm = screenShareManagerRef.current!;

    const unsubState = ssm.subscribeState((newScreenState) => {
      setScreenShareState(newScreenState);
    });

    const unsubFrame = ssm.onFrame((payload) => {
      // Stream visual screen frame to Gemini Live API
      liveSessionRef.current?.sendScreenFrame(payload.data, payload.mimeType);
    });

    const unsubEnded = ssm.onEnded(() => {
      soundEffects.playScreenShareStop();
      liveSessionRef.current?.sendScreenStatus(false);
    });

    return () => {
      unsubState();
      unsubFrame();
      unsubEnded();
      ssm.dispose();
    };
  }, []);

  // Subscribe to state changes
  useEffect(() => {
    const sm = stateManagerRef.current!;
    const unsubscribe = sm.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize service singletons
  useEffect(() => {
    const sm = stateManagerRef.current!;

    // 1. Audio Streamer
    const streamer = new AudioStreamer();
    audioStreamerRef.current = streamer;

    // 2. Audio Player
    const player = new AudioPlayer({
      onSpeakingStart: () => {
        sm.setState('speaking');
      },
      onSpeakingEnd: () => {
        const currentState = sm.getSnapshot().state;
        if (currentState === 'speaking') {
          // Check if the dialogue indicated a natural conversation conclusion
          const lastText = sm.getSnapshot().liveTranscript?.text?.toLowerCase() || '';
          const isEnding =
            lastText.includes('good night') ||
            lastText.includes('see you later') ||
            lastText.includes('talk to you later') ||
            lastText.includes('sleep well') ||
            lastText.includes('catch you later');

          if (isEnding) {
            sm.setState('ending');
            setTimeout(() => {
              if (sm.getSnapshot().state === 'ending') {
                sm.setState('idle');
              }
            }, 3500);
          } else {
            // Natural silence: after speaking, remain idle and listen without nagging
            sm.setState('idle');
          }
        }
      },
      onAnalysis: (volume, frequencies) => {
        if (sm.getSnapshot().state === 'speaking') {
          sm.setAudioAnalysis(volume, frequencies);
        }
      },
    });
    audioPlayerRef.current = player;

    // 3. Tool Manager
    const tools = new ToolManager({
      onNotification: (notification) => {
        sm.addToolNotification(notification);
        soundEffects.playClick();
      },
      onTimerCreate: (duration, label) => {
        sm.addTimer(duration, label);
      },
      onAuraChange: (theme) => {
        sm.setAuraTheme(theme);
      },
    });
    toolManagerRef.current = tools;

    // 4. Live Session
    const session = new LiveSession(streamer, player, tools, {
      onStateChange: (newState: AssistantState) => {
        const prev = sm.getSnapshot().state;
        sm.setState(newState);
        if ((newState === 'idle' || newState === 'listening') && prev === 'connecting') {
          soundEffects.playWake();
          // If screen was already sharing, notify session of active vision
          if (screenShareManagerRef.current?.isSharing()) {
            session.sendScreenStatus(true);
            screenShareManagerRef.current.forceCapture();
          }
        }
      },
      onError: (err: string) => {
        sm.setError(err);
      },
      onTranscript: (role, text) => {
        sm.setTranscript(role, text);
        // When user asks a visual or screen-related query, immediately capture and send a fresh keyframe
        if (role === 'user' && screenShareManagerRef.current?.isSharing()) {
          const lower = text.toLowerCase();
          const screenKeywords = [
            'look',
            'screen',
            'see',
            'code',
            'error',
            'here',
            'read',
            'click',
            'page',
            'what is',
            'check this',
            'warning',
            'this button',
          ];
          if (screenKeywords.some((k) => lower.includes(k))) {
            screenShareManagerRef.current.forceCapture();
          }
        }
      },
      onMicAnalysis: (volume, frequencies) => {
        const curr = sm.getSnapshot().state;
        if (curr === 'listening' || curr === 'idle') {
          sm.setAudioAnalysis(volume, frequencies);
        }
      },
    });
    liveSessionRef.current = session;

    return () => {
      session.disconnect();
      streamer.stop();
      player.close();
      sm.destroy();
    };
  }, []);

  // Monitor timer completions to trigger sound cue
  useEffect(() => {
    snapshot.activeTimers.forEach((timer) => {
      if (!timer.isRunning && timer.remainingSeconds === 0) {
        soundEffects.playTimerDone();
      }
    });
  }, [snapshot.activeTimers]);

  const toggleConnection = useCallback(() => {
    const session = liveSessionRef.current;
    if (!session) return;

    soundEffects.playClick();
    stateManagerRef.current.setError(null);

    if (snapshot.state === 'disconnected') {
      audioPlayerRef.current?.unlockAudio();
      session.connect();
    } else {
      session.disconnect();
    }
  }, [snapshot.state]);

  const retryConnection = useCallback(() => {
    const session = liveSessionRef.current;
    if (!session) return;

    soundEffects.playClick();
    stateManagerRef.current.setError(null);
    audioPlayerRef.current?.unlockAudio();
    session.disconnect();
    setTimeout(() => {
      session.connect();
    }, 150);
  }, []);

  const clearError = useCallback(() => {
    stateManagerRef.current.setError(null);
  }, []);

  const interrupt = useCallback(() => {
    const session = liveSessionRef.current;
    if (session && snapshot.state === 'speaking') {
      soundEffects.playClick();
      session.userInterrupt();
    }
  }, [snapshot.state]);

  const toggleMute = useCallback(() => {
    const streamer = audioStreamerRef.current;
    const sm = stateManagerRef.current;
    if (!streamer || !sm) return;

    const nextMuted = !snapshot.isMuted;
    streamer.setMuted(nextMuted);
    sm.setMuted(nextMuted);
    soundEffects.playClick();
  }, [snapshot.isMuted]);

  const setAuraTheme = useCallback((theme: AuraTheme) => {
    soundEffects.playClick();
    stateManagerRef.current?.setAuraTheme(theme);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    stateManagerRef.current?.dismissNotification(id);
  }, []);

  const dismissTimer = useCallback((id: string) => {
    soundEffects.playClick();
    stateManagerRef.current?.dismissTimer(id);
  }, []);

  // Screen share controller functions
  const startScreenShare = useCallback(async () => {
    const ssm = screenShareManagerRef.current;
    if (!ssm) return;

    try {
      soundEffects.playClick();
      await ssm.start();
      soundEffects.playScreenShareStart();
      liveSessionRef.current?.sendScreenStatus(true);
    } catch (err: any) {
      console.warn('Screen share initiation error:', err?.message || err);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    const ssm = screenShareManagerRef.current;
    if (!ssm) return;

    soundEffects.playScreenShareStop();
    ssm.stop();
    liveSessionRef.current?.sendScreenStatus(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const ssm = screenShareManagerRef.current;
    if (!ssm) return;

    if (ssm.isSharing()) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [startScreenShare, stopScreenShare]);

  const forceInspectScreen = useCallback(async () => {
    const ssm = screenShareManagerRef.current;
    if (!ssm || !ssm.isSharing()) return;

    soundEffects.playClick();
    await ssm.forceCapture();
  }, []);

  const isScreenShareSupported = screenShareManagerRef.current?.isSupported() ?? false;

  return {
    ...snapshot,
    screenShareState,
    isScreenShareSupported,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    forceInspectScreen,
    toggleConnection,
    retryConnection,
    clearError,
    interrupt,
    toggleMute,
    setAuraTheme,
    dismissNotification,
    dismissTimer,
  };
}
