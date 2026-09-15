import {
  ScreenShareState,
  ScreenShareStatus,
  ScreenConfig,
  ScreenFramePayload,
} from './screenTypes';
import { ScreenFrameCapture } from './ScreenFrameCapture';

export type ScreenStateListener = (state: ScreenShareState) => void;
export type ScreenFrameListener = (payload: ScreenFramePayload) => void;

export class ScreenShareManager {
  private stream: MediaStream | null = null;
  private frameCapture: ScreenFrameCapture | null = null;
  private status: ScreenShareStatus = 'idle';
  private hasFrame = false;
  private lastFrameAt: number | null = null;
  private error?: string;
  private isAnalyzing = false;
  private sourceLabel?: string;

  private stateListeners: Set<ScreenStateListener> = new Set();
  private frameListeners: Set<ScreenFrameListener> = new Set();
  private endedListeners: Set<() => void> = new Set();

  constructor(config?: Partial<ScreenConfig>) {
    this.frameCapture = new ScreenFrameCapture(config, {
      onFrame: (payload) => {
        this.hasFrame = true;
        this.lastFrameAt = payload.timestamp;
        this.notifyFrame(payload);
        this.notifyState();
      },
      onAnalyzing: (analyzing) => {
        this.isAnalyzing = analyzing;
        this.notifyState();
      },
    });
  }

  /**
   * Check if getDisplayMedia is supported by current browser and environment
   */
  public isSupported(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function'
    );
  }

  public isSharing(): boolean {
    return this.status === 'sharing' || this.status === 'analyzing';
  }

  public getStatus(): ScreenShareStatus {
    return this.status;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public getState(): ScreenShareState {
    return {
      status: this.status,
      isSharing: this.isSharing(),
      isAnalyzing: this.isAnalyzing,
      hasFrame: this.hasFrame,
      lastFrameAt: this.lastFrameAt,
      stream: this.stream,
      error: this.error,
      sourceLabel: this.sourceLabel,
    };
  }

  /**
   * Request screen capture permission and initialize streaming
   */
  public async start(): Promise<MediaStream> {
    if (!this.isSupported()) {
      const msg = 'Screen sharing is not supported by your current browser or device.';
      this.status = 'error';
      this.error = msg;
      this.notifyState();
      throw new Error(msg);
    }

    if (this.isSharing() && this.stream) {
      return this.stream;
    }

    this.status = 'starting';
    this.error = undefined;
    this.notifyState();

    try {
      // Browser screen selection dialog
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: { ideal: 5, max: 15 },
        } as MediaTrackConstraints,
        audio: false,
      });

      this.stream = stream;
      this.status = 'sharing';

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        this.sourceLabel = videoTrack.label || 'Screen Stream';

        // CRITICAL: Listen to native browser "Stop sharing" button / ribbon
        videoTrack.onended = () => {
          console.log('Screen capture track ended via native browser UI');
          this.handleTrackEnded();
        };
      }

      // Start frame capture pipeline
      if (this.frameCapture) {
        await this.frameCapture.start(stream);
      }

      this.notifyState();
      return stream;
    } catch (err: any) {
      this.status = 'idle';

      // Parse user-friendly error messages without raw stack traces
      let friendlyError = 'Could not start screen sharing.';
      if (err.name === 'NotAllowedError') {
        friendlyError = 'Screen sharing permission was cancelled or not granted.';
      } else if (err.name === 'NotFoundError') {
        friendlyError = 'No screen or window was selected to share.';
      } else if (err.name === 'NotReadableError') {
        friendlyError = 'Could not access the selected screen. It might be restricted or in use.';
      } else if (err.name === 'SecurityError') {
        friendlyError = 'Screen capture is restricted by browser security policies.';
      } else if (err.name === 'AbortError') {
        friendlyError = 'Screen sharing selection was aborted.';
      } else if (err.message) {
        friendlyError = err.message;
      }

      this.error = friendlyError;
      this.notifyState();
      throw new Error(friendlyError);
    }
  }

  /**
   * Stops screen sharing and releases MediaStream tracks
   */
  public stop(): void {
    if (this.status === 'idle' && !this.stream) return;

    this.status = 'stopping';
    this.notifyState();

    this.cleanupStream();

    if (this.frameCapture) {
      this.frameCapture.stop();
    }

    this.status = 'idle';
    this.hasFrame = false;
    this.lastFrameAt = null;
    this.isAnalyzing = false;
    this.sourceLabel = undefined;
    this.notifyState();
  }

  /**
   * Handler triggered when the user stops sharing via the browser's native banner
   */
  private handleTrackEnded(): void {
    this.cleanupStream();

    if (this.frameCapture) {
      this.frameCapture.stop();
    }

    this.status = 'idle';
    this.hasFrame = false;
    this.isAnalyzing = false;
    this.sourceLabel = undefined;
    this.notifyState();

    // Fire ended callbacks
    this.endedListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in onEnded callback:', e);
      }
    });
  }

  private cleanupStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }
  }

  /**
   * Triggers an immediate capture of the current screen frame
   */
  public async forceCapture(): Promise<ScreenFramePayload | null> {
    if (!this.frameCapture || !this.isSharing()) return null;
    return this.frameCapture.forceCaptureNow();
  }

  public getLatestPreviewUrl(): string | null {
    return this.frameCapture?.getLatestPreviewUrl() || null;
  }

  public subscribeState(listener: ScreenStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onFrame(listener: ScreenFrameListener): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  public onEnded(callback: () => void): () => void {
    this.endedListeners.add(callback);
    return () => {
      this.endedListeners.delete(callback);
    };
  }

  private notifyState(): void {
    const currentState = this.getState();
    this.stateListeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (e) {
        console.error('Error in screen state listener:', e);
      }
    });
  }

  private notifyFrame(payload: ScreenFramePayload): void {
    this.frameListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error('Error in screen frame listener:', e);
      }
    });
  }

  public dispose(): void {
    this.stop();
    if (this.frameCapture) {
      this.frameCapture.dispose();
      this.frameCapture = null;
    }
    this.stateListeners.clear();
    this.frameListeners.clear();
    this.endedListeners.clear();
  }
}
