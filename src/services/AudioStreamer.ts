/**
 * AudioStreamer
 * Captures microphone input, resamples to 16kHz PCM16, encodes to Base64,
 * and extracts real-time audio analysis data for the visualizer.
 */
export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isStreaming = false;
  private isMuted = false;

  private onAudioChunkCallback?: (base64PCM: string) => void;
  private onAnalysisCallback?: (volume: number, frequencies: Uint8Array) => void;
  private onSpeechStartCallback?: () => void;
  private onSpeechEndCallback?: (durationMs: number) => void;
  private animationFrameId: number | null = null;

  // VAD state variables
  private noiseFloor = 0.015;
  private consecutiveSpeechFrames = 0;
  private consecutiveSilenceFrames = 0;
  private isUserSpeaking = false;
  private speechStartTime = 0;

  // 16kHz audio chunk accumulator for smooth 100ms packet delivery
  private pcm16SampleBuffer: number[] = [];
  private readonly TARGET_CHUNK_SAMPLES = 1600; // 100ms at 16kHz

  async start(
    onAudioChunk: (base64PCM: string) => void,
    onAnalysis?: (volume: number, frequencies: Uint8Array) => void,
    onSpeechStart?: () => void,
    onSpeechEnd?: (durationMs: number) => void
  ): Promise<void> {
    if (this.isStreaming) return;

    this.onAudioChunkCallback = onAudioChunk;
    this.onAnalysisCallback = onAnalysis;
    this.onSpeechStartCallback = onSpeechStart;
    this.onSpeechEndCallback = onSpeechEnd;
    this.pcm16SampleBuffer = [];

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Use native AudioContext sample rate for maximum browser & hardware compatibility
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const sourceSampleRate = this.audioContext.sampleRate;
      const targetSampleRate = 16000;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analyser for real-time visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.75;
      this.sourceNode.connect(this.analyserNode);

      // Buffer size: 2048 samples (~42ms at 48kHz)
      const bufferSize = 2048;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isStreaming || this.isMuted) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Real-time Voice Activity Detection (VAD) for visual feedback
        let sumSquares = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sumSquares += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannelData.length);

        // Adaptive noise floor tracking
        if (rms < this.noiseFloor * 1.5) {
          this.noiseFloor = this.noiseFloor * 0.992 + rms * 0.008;
        } else {
          this.noiseFloor = this.noiseFloor * 0.999 + 0.012 * 0.001;
        }
        this.noiseFloor = Math.max(0.004, Math.min(0.04, this.noiseFloor));

        const speechThreshold = Math.max(0.015, this.noiseFloor * 1.6);

        if (rms > speechThreshold) {
          this.consecutiveSpeechFrames++;
          this.consecutiveSilenceFrames = 0;

          // Sustained speech over 2 frames (~80ms) triggers speech start
          if (this.consecutiveSpeechFrames >= 2 && !this.isUserSpeaking) {
            this.isUserSpeaking = true;
            this.speechStartTime = Date.now();
            if (this.onSpeechStartCallback) {
              this.onSpeechStartCallback();
            }
          }
        } else {
          this.consecutiveSpeechFrames = 0;
          if (this.isUserSpeaking) {
            this.consecutiveSilenceFrames++;
            // Natural human pause: ~10-12 frames (~450ms) signals user completed sentence
            if (this.consecutiveSilenceFrames >= 11) {
              this.isUserSpeaking = false;
              const duration = Date.now() - this.speechStartTime;
              if (this.onSpeechEndCallback) {
                this.onSpeechEndCallback(duration);
              }
            }
          }
        }

        // Deliver clean, unattenuated microphone audio to Gemini Live
        let resampled: Float32Array;
        if (sourceSampleRate === targetSampleRate) {
          resampled = inputChannelData;
        } else {
          resampled = this.resampleAudio(inputChannelData, sourceSampleRate, targetSampleRate);
        }

        // Accumulate samples into buffer to deliver stable ~100ms packets (1600 samples at 16kHz)
        for (let i = 0; i < resampled.length; i++) {
          this.pcm16SampleBuffer.push(resampled[i]);
        }

        while (this.pcm16SampleBuffer.length >= this.TARGET_CHUNK_SAMPLES) {
          const chunk = this.pcm16SampleBuffer.splice(0, this.TARGET_CHUNK_SAMPLES);
          const chunkArray = new Float32Array(chunk);
          const pcm16Buffer = this.floatTo16BitPCM(chunkArray);
          const base64 = this.arrayBufferToBase64(pcm16Buffer);

          if (this.onAudioChunkCallback) {
            this.onAudioChunkCallback(base64);
          }
        }
      };

      this.sourceNode.connect(this.processorNode);
      // Connect through a zero-gain node so ScriptProcessor stays active without any mic loopback to speakers
      const muteGain = this.audioContext.createGain();
      muteGain.gain.value = 0;
      this.processorNode.connect(muteGain);
      muteGain.connect(this.audioContext.destination);

      this.isStreaming = true;
      this.startAnalysisLoop();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  private startAnalysisLoop() {
    if (!this.analyserNode || !this.onAnalysisCallback) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const update = () => {
      if (!this.isStreaming || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedVolume = Math.min(1, average / 128);

      if (this.onAnalysisCallback) {
        this.onAnalysisCallback(this.isMuted ? 0 : normalizedVolume, dataArray);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  stop(): void {
    this.isStreaming = false;
    this.isUserSpeaking = false;
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.pcm16SampleBuffer = [];

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }
  }

  /**
   * Resamples float32 PCM from sourceSampleRate to targetSampleRate
   */
  private resampleAudio(
    audioData: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
  ): Float32Array {
    if (sourceSampleRate === targetSampleRate) return audioData;

    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const index = Math.floor(originalIndex);
      const nextIndex = Math.min(index + 1, audioData.length - 1);
      const weight = originalIndex - index;
      result[i] = audioData[index] * (1 - weight) + audioData[nextIndex] * weight;
    }

    return result;
  }

  /**
   * Converts Float32Array samples (-1.0 to 1.0) to 16-bit PCM little-endian ArrayBuffer
   */
  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      // Convert to 16-bit integer
      const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, int16, true); // true for little-endian
    }
    return buffer;
  }

  /**
   * Fast conversion of ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
