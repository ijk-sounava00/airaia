import { AssistantState, ToolCall } from '../types';
import { AudioStreamer } from './AudioStreamer';
import { AudioPlayer } from './AudioPlayer';
import { ToolManager } from './ToolManager';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onError: (error: string) => void;
  onTranscript?: (role: 'user' | 'aira', text: string) => void;
  onMicAnalysis?: (volume: number, frequencies: Uint8Array) => void;
  onOutputAnalysis?: (volume: number, frequencies: Uint8Array) => void;
}

/**
 * LiveSession
 * Maintains real-time bidirectional WebSocket connection to the Gemini Live server,
 * streams microphone PCM audio, triggers AudioPlayer, and routes ToolManager actions.
 */
export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private audioPlayer: AudioPlayer;
  private toolManager: ToolManager;
  private callbacks: LiveSessionCallbacks;

  private currentState: AssistantState = 'disconnected';
  private intentionalClose = false;
  private retryCount = 0;
  private reconnectTimeout: number | null = null;
  private thinkingTimer: number | null = null;
  private interruptTimer: number | null = null;

  constructor(
    audioStreamer: AudioStreamer,
    audioPlayer: AudioPlayer,
    toolManager: ToolManager,
    callbacks: LiveSessionCallbacks
  ) {
    this.audioStreamer = audioStreamer;
    this.audioPlayer = audioPlayer;
    this.toolManager = toolManager;
    this.callbacks = callbacks;
  }

  getState(): AssistantState {
    return this.currentState;
  }

  private setState(state: AssistantState) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.callbacks.onStateChange(state);
    }
  }

  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.intentionalClose = false;
    this.setState('connecting');

    // Pre-activate Web Audio API context
    this.audioPlayer.unlockAudio().catch(() => {});

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.retryCount = 0;
        console.log('WebSocket connected to /live');
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            this.retryCount = 0;
            console.log('AIRA Live Session Ready:', msg.model);
            // Enter idle state waiting silently for user speech
            this.setState('idle');

            // Start microphone streaming with VAD
            await this.startMicrophoneStream();
          } else if (msg.type === 'audio' && msg.data) {
            // Receive 24kHz response audio from AIRA
            if (this.thinkingTimer !== null) {
              clearTimeout(this.thinkingTimer);
              this.thinkingTimer = null;
            }
            this.setState('speaking');
            this.audioPlayer.queueAudioChunk(msg.data);
          } else if (msg.type === 'interrupted') {
            console.log('Interruption detected by Gemini Live');
            this.audioPlayer.interrupt();
            this.setState('interrupted');
            if (this.interruptTimer) clearTimeout(this.interruptTimer);
            this.interruptTimer = window.setTimeout(() => {
              if (this.currentState === 'interrupted') {
                this.setState('listening');
              }
            }, 300);
          } else if (msg.type === 'turn_complete') {
            // Turn completed by Gemini Live
            if (this.thinkingTimer !== null) {
              clearTimeout(this.thinkingTimer);
              this.thinkingTimer = null;
            }
            if (!this.audioPlayer.getIsPlaying() && this.currentState !== 'speaking') {
              this.setState('idle');
            }
          } else if (msg.type === 'output_transcription' && msg.text) {
            if (this.callbacks.onTranscript) {
              this.callbacks.onTranscript('aira', msg.text);
            }
          } else if (msg.type === 'input_transcription' && msg.text) {
            if (this.callbacks.onTranscript) {
              this.callbacks.onTranscript('user', msg.text);
            }
          } else if (msg.type === 'tool_call' && msg.calls) {
            console.log('AIRA received tool call from server:', msg.calls);
            const toolResponses = [];
            for (const call of msg.calls as ToolCall[]) {
              // Execute browser action
              const response = await this.toolManager.execute(call);
              toolResponses.push({
                id: call.id,
                name: call.name,
                response: response || { status: 'ok' },
              });
            }
            // Send complete batch response back to server
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'tool_responses',
                responses: toolResponses,
              }));
            }
          } else if (msg.type === 'error') {
            console.warn('Server error notice:', msg.message);
            this.callbacks.onError(msg.message || 'Error occurred in Live session');
            this.disconnect();
          } else if (msg.type === 'session_closed') {
            if (!this.intentionalClose) {
              this.disconnect();
            }
          }
        } catch (err) {
          console.warn('Error handling WebSocket message:', err);
        }
      };

      let hasHandledFailure = false;
      const handleFailure = (_reason: string, _e?: any) => {
        if (hasHandledFailure || this.intentionalClose) return;
        hasHandledFailure = true;

        if (this.retryCount < 3) {
          this.retryCount++;
          console.info(`AIRA Live connection reconnecting (attempt ${this.retryCount}/3)...`);
          if (this.ws) {
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
          }
          this.reconnectTimeout = window.setTimeout(() => {
            this.connect();
          }, 800);
          return;
        }

        const inIframe = typeof window !== 'undefined' && window.self !== window.top;
        const msg = inIframe
          ? 'Real-time connection blip in iframe sandbox. Please tap Retry or Open in new tab.'
          : 'Could not establish real-time link with AIRA. Please tap Retry.';
        this.callbacks.onError(msg);
        this.disconnect();
      };

      this.ws.onerror = (e) => {
        handleFailure('error', e);
      };

      this.ws.onclose = (e) => {
        handleFailure('close', e);
      };

    } catch (err: any) {
      console.warn('Failed to initiate live session:', err?.message || err);
      this.callbacks.onError(err?.message || 'Failed to connect');
      this.disconnect();
    }
  }

  private async startMicrophoneStream() {
    try {
      await this.audioStreamer.start(
        // Audio chunk handler
        (base64Chunk) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'audio',
              data: base64Chunk,
            }));
          }
        },
        // Real-time mic volume/frequencies
        (volume, frequencies) => {
          if (this.callbacks.onMicAnalysis) {
            this.callbacks.onMicAnalysis(volume, frequencies);
          }
        },
        // Speech onset (User started speaking)
        () => {
          if (this.currentState === 'speaking') {
            // Immediate interruption: stop AIRA audio, cancel queued playback, notify server
            this.audioPlayer.interrupt();
            this.setState('interrupted');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'interrupt' }));
            }
            if (this.interruptTimer) clearTimeout(this.interruptTimer);
            this.interruptTimer = window.setTimeout(() => {
              if (this.currentState === 'interrupted') {
                this.setState('listening');
              }
            }, 250);
          } else if (this.currentState === 'idle' || this.currentState === 'ending') {
            this.setState('listening');
          }
        },
        // Speech end (User finished thought or paused)
        (_durationMs) => {
          if (this.currentState === 'listening') {
            // Switch to thinking state while AIRA synthesizes voice response
            this.setState('thinking');
            if (this.thinkingTimer) clearTimeout(this.thinkingTimer);
            // Extended safety timer: revert to idle only if no audio is generated after 8s
            this.thinkingTimer = window.setTimeout(() => {
              if (this.currentState === 'thinking' && !this.audioPlayer.getIsPlaying()) {
                this.setState('idle');
              }
            }, 8000);
          }
        }
      );
    } catch (err: any) {
      console.error('Microphone stream error:', err);
      this.callbacks.onError(err?.message || 'Microphone access denied or unavailable');
      this.disconnect();
    }
  }

  /**
   * Disconnects the session cleanly
   */
  disconnect(): void {
    this.intentionalClose = true;
    this.retryCount = 0;

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.thinkingTimer !== null) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }
    if (this.interruptTimer !== null) {
      clearTimeout(this.interruptTimer);
      this.interruptTimer = null;
    }

    this.audioStreamer.stop();
    this.audioPlayer.interrupt();
    this.audioPlayer.close();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * User manual interrupt (e.g. tapping center orb while speaking)
   */
  userInterrupt(): void {
    this.audioPlayer.interrupt();
    this.setState('interrupted');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
    if (this.interruptTimer) clearTimeout(this.interruptTimer);
    this.interruptTimer = window.setTimeout(() => {
      if (this.currentState === 'interrupted') {
        this.setState('listening');
      }
    }, 250);
  }

  /**
   * Transmits a captured screen frame into the Gemini Live session
   */
  sendScreenFrame(base64Data: string, mimeType = 'image/jpeg'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'screen_frame',
            data: base64Data,
            mimeType,
          })
        );
      } catch (err) {
        console.warn('Failed to dispatch screen frame over WebSocket:', err);
      }
    }
  }

  /**
   * Notifies Gemini Live whether screen sharing is currently active
   */
  sendScreenStatus(active: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'screen_status',
            active,
          })
        );
      } catch (err) {
        console.warn('Failed to dispatch screen status over WebSocket:', err);
      }
    }
  }
}
