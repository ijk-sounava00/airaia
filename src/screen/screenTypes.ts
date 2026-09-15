export type ScreenShareStatus =
  | 'idle'
  | 'starting'
  | 'sharing'
  | 'analyzing'
  | 'stopping'
  | 'error';

export interface ScreenShareState {
  status: ScreenShareStatus;
  isSharing: boolean;
  isAnalyzing: boolean;
  hasFrame: boolean;
  lastFrameAt: number | null;
  stream: MediaStream | null;
  error?: string;
  sourceLabel?: string;
}

export interface ScreenConfig {
  /** Maximum width to downscale screen frame before transmitting to Gemini (default 1024) */
  maxWidth: number;
  /** Maximum height to downscale screen frame (default 768) */
  maxHeight: number;
  /** JPEG image compression quality 0.0 - 1.0 (default 0.72) */
  imageQuality: number;
  /** Milliseconds between periodic sample checks (default 1200ms) */
  captureIntervalMs: number;
  /** Visual delta threshold (0.0 - 1.0) to trigger transmission (default 0.04) */
  changeThreshold: number;
  /** Maximum frames sent per second (default 1 FPS) */
  maxFps: number;
}

export const DEFAULT_SCREEN_CONFIG: ScreenConfig = {
  maxWidth: 1024,
  maxHeight: 768,
  imageQuality: 0.72,
  captureIntervalMs: 1200,
  changeThreshold: 0.04,
  maxFps: 1,
};

export interface ScreenFramePayload {
  data: string; // Base64 JPEG data without data:image/jpeg;base64, prefix
  mimeType: string; // 'image/jpeg'
  timestamp: number;
  width: number;
  height: number;
  isKeyframe?: boolean;
}
