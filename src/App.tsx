import React, { useState, useEffect } from 'react';
import { useAira } from './hooks/useAira';
import { BackgroundAura } from './components/BackgroundAura';
import { Header } from './components/Header';
import { HologramStage } from './components/hologram/HologramStage';
import { WaveformOrb } from './components/WaveformOrb';
import { ColorPaletteBar } from './components/ColorPaletteBar';
import { MemoryPanel } from './components/MemoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ToolCards } from './components/ToolCards';
import { TimerWidget } from './components/TimerWidget';
import { Subtitles } from './components/Subtitles';
import { VoicePrompts } from './components/VoicePrompts';
import { InfoModal } from './components/InfoModal';
import { AlertTriangle, RefreshCw, Sparkles, Disc } from 'lucide-react';
import { AURA_THEMES } from './data/auraThemes';
import { MemoryService } from './services/MemoryService';

export default function App() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'hologram' | 'orb'>('hologram');
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
    toggleConnection,
    interrupt,
    toggleMute,
    setAuraTheme,
    dismissNotification,
    dismissTimer,
  } = useAira();

  // Keep memory count in sync
  useEffect(() => {
    return MemoryService.getInstance().subscribe((memories) => {
      setMemoryCount(memories.length);
    });
  }, []);

  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  const handleOrbClick = () => {
    if (state === 'speaking') {
      // Instant interruption when tapping while speaking
      interrupt();
    } else {
      toggleConnection();
    }
  };

  return (
    <main id="aira-app-root" className="relative min-h-screen flex flex-col justify-between overflow-hidden text-slate-100 selection:bg-cyan-500/20">
      {/* Ambient background aura */}
      <BackgroundAura
        auraTheme={auraTheme}
        volume={audioVolume}
        isSpeaking={state === 'speaking'}
      />

      {/* Top Navigation Bar */}
      <Header
        state={state}
        auraTheme={auraTheme}
        isMuted={isMuted}
        sessionStartTime={sessionStartTime}
        memoryCount={memoryCount}
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

      {/* Floating Active Timers Widget */}
      <TimerWidget
        timers={activeTimers}
        auraTheme={auraTheme}
        onDismiss={dismissTimer}
      />

      {/* Central Interactive Voice Stage */}
      <section id="aira-central-stage" aria-label="Voice Interaction" className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 z-10">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div
            id="aira-error-banner"
            role="alert"
            className="mb-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl border border-rose-500/30 bg-rose-950/70 text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl max-w-md animate-in fade-in zoom-in-95 duration-200"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={toggleConnection}
              className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-200 transition-colors cursor-pointer"
              title="Retry connection"
              aria-label="Retry connection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Mode Toggle Pill (3D Hologram vs Energy Orb) */}
        <div className="mb-2 z-20 flex items-center gap-1 p-1 rounded-full backdrop-blur-md bg-slate-950/60 border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('hologram')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'hologram'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Hologram</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('orb')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'orb'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Energy Orb</span>
          </button>
        </div>

        {/* Central Visual Stage: 3D Holographic Anime Girl (Primary) or Energy Orb */}
        {viewMode === 'hologram' ? (
          <HologramStage
            state={state}
            auraTheme={auraTheme}
            volume={audioVolume}
            frequencyData={frequencyData}
            isMuted={isMuted}
            onActionClick={handleOrbClick}
            onMuteToggle={toggleMute}
          />
        ) : (
          <WaveformOrb
            state={state}
            auraTheme={auraTheme}
            volume={audioVolume}
            frequencyData={frequencyData}
            isMuted={isMuted}
            onActionClick={handleOrbClick}
          />
        )}
      </section>

      {/* Quick Interactive 10-Color Codes Palette Switcher */}
      <ColorPaletteBar
        auraTheme={auraTheme}
        onSelectTheme={setAuraTheme}
      />

      {/* Minimalist Live Voice Caption (Auto-fades) */}
      <Subtitles transcript={liveTranscript} auraTheme={auraTheme} />

      {/* Bottom Voice Suggestions & Help Prompts */}
      <VoicePrompts auraTheme={auraTheme} />

      {/* Persistent Long-Term Memory Panel */}
      <MemoryPanel
        isOpen={isMemoryOpen}
        auraTheme={auraTheme}
        onClose={() => setIsMemoryOpen(false)}
      />

      {/* Settings & Latency Diagnostics Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        state={state}
        auraTheme={auraTheme}
        audioVolume={audioVolume}
        onSelectTheme={setAuraTheme}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Information & Capabilities Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        auraTheme={auraTheme}
        onClose={() => setIsInfoOpen(false)}
      />
    </main>
  );
}
