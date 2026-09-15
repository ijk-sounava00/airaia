import { ScreenConfig, DEFAULT_SCREEN_CONFIG, ScreenFramePayload } from './screenTypes';
import { ScreenChangeDetector } from './ScreenChangeDetector';

export class ScreenFrameCapture {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private changeDetector: ScreenChangeDetector;
  private config: ScreenConfig;
  private timer: number | null = null;
  private isCapturing = false;
  private lastTransmittedAt = 0;
  private latestPreviewUrl: string | null = null;

  private onFrameCallback: ((payload: ScreenFramePayload) => void) | null = null;
  private onAnalyzingCallback: ((isAnalyzing: boolean) => void) | null = null;

  constructor(
    config: Partial<ScreenConfig> = {},
    callbacks?: {
      onFrame?: (payload: ScreenFramePayload) => void;
      onAnalyzing?: (isAnalyzing: boolean) => void;
    }
  ) {
    this.config = { ...DEFAULT_SCREEN_CONFIG, ...config };
    this.changeDetector = new ScreenChangeDetector(this.config.changeThreshold);
    if (callbacks?.onFrame) this.onFrameCallback = callbacks.onFrame;
    if (callbacks?.onAnalyzing) this.onAnalyzingCallback = callbacks.onAnalyzing;
  }

  public async start(stream: MediaStream): Promise<void> {
    this.stop();
    this.stream = stream;

    // Create hidden offscreen video element
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    this.video = video;

    // Create offscreen canvas for frame scaling and base64 export
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Wait for video stream to load dimensions and start playback
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Continue even if event timed out
      }, 3500);

      video.onloadedmetadata = async () => {
        clearTimeout(timeout);
        try {
          await video.play();
          resolve();
        } catch (playErr) {
          console.warn('Screen video autoplay warning:', playErr);
          resolve();
        }
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        reject(new Error('Failed to load screen video track: ' + e));
      };
    });

    this.isCapturing = true;
    this.changeDetector.reset();

    // Transmit initial keyframe immediately with high priority
    await this.captureFrame(true);

    // Schedule regular interval sampling with change detection
    this.timer = window.setInterval(() => {
      if (!this.isCapturing) return;
      this.samplePeriodic();
    }, this.config.captureIntervalMs);
  }

  /**
   * Periodic sample handler: checks whether screen changed before uploading
   */
  private async samplePeriodic(): Promise<void> {
    if (!this.video || !this.isCapturing || this.video.readyState < 2) return;

    // Enforce max FPS throttle
    const now = Date.now();
    const minElapsed = 1000 / this.config.maxFps;
    if (now - this.lastTransmittedAt < minElapsed) return;

    // Check if visual contents changed
    const changed = this.changeDetector.hasChanged(this.video);
    if (changed) {
      await this.captureFrame(false);
    }
  }

  /**
   * Force captures an immediate frame (e.g. when user explicitly asks "look at my screen" or "what is this")
   */
  public async forceCaptureNow(): Promise<ScreenFramePayload | null> {
    if (!this.video || this.video.readyState < 2) return null;
    return this.captureFrame(true);
  }

  /**
   * Extracts and downscales current frame from video, converts to JPEG base64, and dispatches payload
   */
  private async captureFrame(isKeyframe = false): Promise<ScreenFramePayload | null> {
    if (!this.video || !this.canvas || !this.ctx) return null;

    const vWidth = this.video.videoWidth || 1280;
    const vHeight = this.video.videoHeight || 720;

    if (vWidth === 0 || vHeight === 0) return null;

    // Compute target dimensions preserving aspect ratio
    let targetWidth = vWidth;
    let targetHeight = vHeight;

    if (targetWidth > this.config.maxWidth || targetHeight > this.config.maxHeight) {
      const ratio = Math.min(
        this.config.maxWidth / targetWidth,
        this.config.maxHeight / targetHeight
      );
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Draw frame onto canvas
    this.ctx.drawImage(this.video, 0, 0, targetWidth, targetHeight);

    // Notify analyzing indicator
    if (this.onAnalyzingCallback) {
      this.onAnalyzingCallback(true);
    }

    try {
      const dataUrl = this.canvas.toDataURL('image/jpeg', this.config.imageQuality);
      this.latestPreviewUrl = dataUrl;

      // Extract raw base64 string
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;

      const payload: ScreenFramePayload = {
        data: base64Data,
        mimeType: 'image/jpeg',
        timestamp: Date.now(),
        width: targetWidth,
        height: targetHeight,
        isKeyframe,
      };

      this.lastTransmittedAt = Date.now();

      if (this.onFrameCallback) {
        this.onFrameCallback(payload);
      }

      return payload;
    } catch (err) {
      console.error('Failed to capture canvas frame:', err);
      return null;
    } finally {
      // Clear analyzing indicator after brief pulse
      setTimeout(() => {
        if (this.onAnalyzingCallback) {
          this.onAnalyzingCallback(false);
        }
      }, 400);
    }
  }

  public getLatestPreviewUrl(): string | null {
    return this.latestPreviewUrl;
  }

  public stop(): void {
    this.isCapturing = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }

    this.latestPreviewUrl = null;
    this.changeDetector.reset();
  }

  public dispose(): void {
    this.stop();
    this.changeDetector.dispose();
    this.onFrameCallback = null;
    this.onAnalyzingCallback = null;
    this.canvas = null;
    this.ctx = null;
  }
}
