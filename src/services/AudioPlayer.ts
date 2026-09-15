/**
 * AudioPlayer
 * Receives 24kHz PCM16 audio chunks from Gemini Live, schedules gapless playback
 * using Web Audio API, handles instantaneous interruptions, and provides real-time
 * frequency analysis for the visualizer.
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private checkPlayingTimer: number | null = null;
  private animationFrameId: number | null = null;

  private onSpeakingStart?: () => void;
  private onSpeakingEnd?: () => void;
  private onAnalysis?: (volume: number, frequencies: Uint8Array) => void;

  constructor(options?: {
    onSpeakingStart?: () => void;
    onSpeakingEnd?: () => void;
    onAnalysis?: (volume: number, frequencies: Uint8Array) => void;
  }) {
    if (options?.onSpeakingStart) this.onSpeakingStart = options.onSpeakingStart;
    if (options?.onSpeakingEnd) this.onSpeakingEnd = options.onSpeakingEnd;
    if (options?.onAnalysis) this.onAnalysis = options.onAnalysis;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Unlock Web Audio API during user gesture (e.g. clicking Connect / Orb)
   */
  async unlockAudio(): Promise<void> {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play 1-frame silent burst to fully activate hardware audio output pipeline
      const silentBuf = ctx.createBuffer(1, 1, 24000);
      const source = ctx.createBufferSource();
      source.buffer = silentBuf;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.warn('AudioPlayer unlockAudio warning:', e);
    }
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Allow browser to run at native hardware sample rate (usually 44100 or 48000 Hz)
      // to eliminate OS buffer queuing latency. createBuffer(1, length, 24000) handles 24kHz natively.
      this.audioContext = new AudioCtx();

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.75;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

      this.startAnalysisLoop();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    return this.audioContext;
  }

  /**
   * Queues and schedules a base64 encoded 24kHz PCM16 audio chunk
   */
  queueAudioChunk(base64PCM: string): void {
    const ctx = this.initAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Ensure gain is always at full volume
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
    }

    const float32Array = this.base64PCM16ToFloat32(base64PCM);
    if (float32Array.length === 0) return;

    // Create 1-channel buffer at 24000 Hz
    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    if (this.gainNode) {
      source.connect(this.gainNode);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    // Ultra-low latency scheduling with 6ms anti-jitter cushion
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.006;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    this.activeSources.push(source);

    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onSpeakingStart) {
        this.onSpeakingStart();
      }
    }

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      this.scheduleCheckIfDone();
    };
  }

  private scheduleCheckIfDone() {
    if (this.checkPlayingTimer !== null) {
      window.clearTimeout(this.checkPlayingTimer);
    }

    this.checkPlayingTimer = window.setTimeout(() => {
      if (!this.audioContext) return;
      if (this.activeSources.length === 0 && this.audioContext.currentTime >= this.nextStartTime - 0.05) {
        if (this.isPlaying) {
          this.isPlaying = false;
          if (this.onSpeakingEnd) {
            this.onSpeakingEnd();
          }
        }
      }
    }, 80);
  }

  /**
   * Interrupts current audio playback immediately: stops all sources and flushes queue
   */
  interrupt(): void {
    if (this.checkPlayingTimer !== null) {
      window.clearTimeout(this.checkPlayingTimer);
      this.checkPlayingTimer = null;
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // source may already be stopped
      }
    }
    this.activeSources = [];

    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
      } catch {
        // ignore
      }
    }

    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.onSpeakingEnd) {
        this.onSpeakingEnd();
      }
    }
  }

  private startAnalysisLoop() {
    if (!this.analyserNode || !this.onAnalysis) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const update = () => {
      if (!this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedVolume = Math.min(1, average / 128);

      if (this.onAnalysis) {
        this.onAnalysis(this.isPlaying ? normalizedVolume : 0, dataArray);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  setVolume(val: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  close(): void {
    this.interrupt();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.checkPlayingTimer !== null) {
      clearTimeout(this.checkPlayingTimer);
      this.checkPlayingTimer = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  /**
   * Decodes Base64 PCM16 Little-Endian into Float32Array [-1.0, 1.0]
   */
  private base64PCM16ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const dataView = new DataView(bytes.buffer);
    const sampleCount = Math.floor(bytes.byteLength / 2);
    const float32 = new Float32Array(sampleCount);

    for (let i = 0; i < sampleCount; i++) {
      const int16 = dataView.getInt16(i * 2, true); // true for little-endian
      float32[i] = int16 / 32768.0;
    }

    return float32;
  }
}
