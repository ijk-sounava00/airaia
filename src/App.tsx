import React, { useState, useEffect } from 'react';
import { useAira } from './hooks/useAira';
import { BackgroundAura } from './components/BackgroundAura';
import { Header } from './components/Header';
import { CyberStage } from './components/core/CyberStage';
import { ColorPaletteBar } from './components/ColorPaletteBar';
import { MemoryPanel } from './components/MemoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ToolCards } from './components/ToolCards';
import { TimerWidget } from './components/TimerWidget';
import { Subtitles } from './components/Subtitles';
import { VoicePrompts } from './components/VoicePrompts';
import { InfoModal } from './components/InfoModal';
import { ScreenPreview } from './components/ScreenPreview';
import { AlertTriangle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { AURA_THEMES } from './data/auraThemes';
import { MemoryService } from './services/MemoryService';

export default function App() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [screenErrorDismissed, setScreenErrorDismissed] = useState(false);
  const [memoryCount, setMemoryCount] = useState<number>(() => MemoryService.getInstance().getMemories().length);

  const {
    state,
    auraTheme,
    isMuted,
    audioVolume,
    frequencyData,
    activeTimers,
    toolNotifications,
    liveTranscript,
    errorMessage,
    sessionStartTime,
    screenShareState,
    isScreenShareSupported,
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
  } = useAira();

  // Reset dismissed state if a new screen error occurs
  useEffect(() => {
    if (screenShareState.error) {
      setScreenErrorDismissed(false);
    }
  }, [screenShareState.error]);

  // Keep memory count in sync with storage
  useEffect(() => {
    return MemoryService.getInstance().subscribe((memories) => {
      setMemoryCount(memories.length);
    });
  }, []);

  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  const handleActionClick = () => {
    if (state === 'speaking') {
      // Instant barge-in interruption when tapping while speaking
      interrupt();
    } else {
      toggleConnection();
    }
  };

  return (
    <main
      id="aira-app-root"
      className="relative min-h-screen flex flex-col justify-between overflow-hidden text-slate-100 selection:bg-cyan-500/20 font-sans"
    >
      {/* Ambient background reactive aura */}
      <BackgroundAura
        auraTheme={auraTheme}
        volume={audioVolume}
        isSpeaking={state === 'speaking'}
      />

      {/* Top Navigation & Telemetry Bar */}
      <Header
        state={state}
        auraTheme={auraTheme}
        isMuted={isMuted}
        sessionStartTime={sessionStartTime}
        memoryCount={memoryCount}
        screenShareState={screenShareState}
        onScreenShareToggle={toggleScreenShare}
        onAuraSelect={setAuraTheme}
        onMuteToggle={toggleMute}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Floating Tool Action Cards & Notifications */}
      <ToolCards
        notifications={toolNotifications}
        auraTheme={auraTheme}
        onDismiss={dismissNotification}
      />

      {/* Floating Active Countdown Timers */}
      <TimerWidget
        timers={activeTimers}
        auraTheme={auraTheme}
        onDismiss={dismissTimer}
      />

      {/* Central Interactive Cyber Stage */}
      <section
        id="aira-central-stage"
        aria-label="Voice Interaction Stage"
        className="flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4 z-10 w-full"
      >
        {/* Connection Error notification banner if any */}
        {errorMessage && (
          <div
            id="aira-error-banner"
            role="alert"
            className="mb-4 px-4 py-2.5 rounded-2xl backdrop-blur-xl border border-rose-500/30 bg-rose-950/90 text-rose-200 text-xs sm:text-sm flex flex-wrap items-center gap-2.5 shadow-2xl max-w-lg animate-in fade-in zoom-in-95 duration-200"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1 min-w-[200px] leading-relaxed">{errorMessage}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {typeof window !== 'undefined' && window.self !== window.top && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900/80 border border-rose-500/30 text-rose-100 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                  title="Open AIRA in a standalone tab"
                >
                  <span>New tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={retryConnection}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                title="Retry real-time connection"
                aria-label="Retry connection"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={clearError}
                className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                title="Dismiss message"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Screen sharing permission/error banner if any */}
        {screenShareState.error && !screenErrorDismissed && (
          <div
            id="aira-screen-error-banner"
            role="alert"
            className="mb-4 px-4 py-2.5 rounded-2xl backdrop-blur-xl border border-amber-500/40 bg-amber-950/80 text-amber-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl max-w-md animate-in fade-in zoom-in-95 duration-200"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">{screenShareState.error}</span>
            <button
              type="button"
              onClick={() => setScreenErrorDismissed(true)}
              className="p-1 rounded-lg hover:bg-amber-900/50 text-amber-200 transition-colors cursor-pointer"
              title="Dismiss alert"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Next-Gen Cybernetic Voice Entity Stage */}
        <CyberStage
          state={state}
          auraTheme={auraTheme}
          volume={audioVolume}
          frequencyData={frequencyData}
          isMuted={isMuted}
          onActionClick={handleActionClick}
          onMuteToggle={toggleMute}
          onInterrupt={interrupt}
          liveTranscript={liveTranscript}
          screenShareState={screenShareState}
          isScreenShareSupported={isScreenShareSupported}
          onScreenShareToggle={toggleScreenShare}
          onForceInspect={forceInspectScreen}
        />
      </section>

      {/* Floating Live Screen Preview */}
      <ScreenPreview
        stream={screenShareState.stream}
        isSharing={screenShareState.isSharing}
        isAnalyzing={screenShareState.isAnalyzing}
        lastFrameAt={screenShareState.lastFrameAt}
        auraTheme={auraTheme}
        sourceLabel={screenShareState.sourceLabel}
        onStop={stopScreenShare}
        onForceInspect={forceInspectScreen}
      />

      {/* 12 Cybernetic Color Codes Palette Bar */}
      <ColorPaletteBar
        auraTheme={auraTheme}
        onSelectTheme={setAuraTheme}
      />

      {/* Minimalist Live Voice Caption */}
      <Subtitles transcript={liveTranscript} auraTheme={auraTheme} />

      {/* Bottom Voice Suggestions & Help Prompts */}
      <VoicePrompts auraTheme={auraTheme} />

      {/* Persistent Long-Term Memory Matrix Panel */}
      <MemoryPanel
        isOpen={isMemoryOpen}
        auraTheme={auraTheme}
        onClose={() => setIsMemoryOpen(false)}
      />

      {/* Neural Settings & Latency Diagnostics Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        state={state}
        auraTheme={auraTheme}
        audioVolume={audioVolume}
        onSelectTheme={setAuraTheme}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Capabilities & Specifications Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        auraTheme={auraTheme}
        onClose={() => setIsInfoOpen(false)}
      />
    </main>
  );
}
