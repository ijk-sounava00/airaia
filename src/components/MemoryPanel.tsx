import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  X,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  ShieldCheck,
  Search,
  MessageSquare,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import { Memory, MemoryCategory, AuraTheme } from '../types';
import { MemoryService } from '../services/MemoryService';
import { AURA_THEMES } from '../data/auraThemes';

interface MemoryPanelProps {
  isOpen: boolean;
  auraTheme: AuraTheme;
  onClose: () => void;
}

const CATEGORIES: { id: MemoryCategory; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'interests', label: 'Interests' },
  { id: 'communication', label: 'Communication' },
  { id: 'habits', label: 'Habits' },
  { id: 'projects', label: 'Projects' },
  { id: 'dislikes', label: 'Dislikes' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'other', label: 'Other' },
];

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  isOpen,
  auraTheme,
  onClose,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const memoryService = MemoryService.getInstance();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preferences');

  useEffect(() => {
    return memoryService.subscribe((updated) => {
      setMemories(updated);
    });
  }, [memoryService]);

  if (!isOpen) return null;

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = activeCategory === 'all' || mem.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      mem.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    memoryService.saveMemory(newCategory, newKey, newValue, 'explicit', 1.0);
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    memoryService.removeMemory(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all memories from AIRA? This cannot be undone.')) {
      memoryService.clearAllMemories();
    }
  };

  return (
    <div
      id="aira-memory-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="AIRA Long-Term Memory"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="aira-memory-panel"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden bg-[#090d18]/95"
        style={{
          borderColor: currentTheme.border,
          boxShadow: `0 24px 64px ${currentTheme.glow}`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: currentTheme.surface,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <Brain className="w-5 h-5" style={{ color: currentTheme.accent }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  AIRA Long-Term Memory
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
                  style={{
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.border,
                    color: currentTheme.accent,
                  }}
                >
                  {memories.length} Stored
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent facts & preferences remembered across sessions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close memory drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Tip Banner */}
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: currentTheme.accent }} />
          <span>
            Say <span className="font-semibold text-white">&quot;Remember my name is Rahul&quot;</span> or{' '}
            <span className="font-semibold text-white">&quot;What do you remember about me?&quot;</span> to speak with her memory directly!
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              style={{
                backgroundColor: currentTheme.primary,
                borderColor: currentTheme.accent,
                color: '#000',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>

            {memories.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Clear all memories"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            All ({memories.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = memories.filter((m) => m.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Add Memory Form (Expandable) */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddMemory}
              className="px-6 py-3 bg-white/[0.03] border-b border-white/10 flex flex-col gap-2.5 overflow-hidden"
            >
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5" style={{ color: currentTheme.accent }} />
                <span>Store New Personal Fact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="px-3 py-1.5 rounded-xl bg-[#0e1320] border border-white/10 text-xs text-slate-200 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Key (e.g. name, favorite_band)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-200 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value / Detail"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-black cursor-pointer"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Save Fact
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 max-h-[50vh]">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
              <Brain className="w-8 h-8 opacity-40" />
              <p className="text-sm">No memories found in this category.</p>
              <p className="text-xs text-slate-600">
                Talk to AIRA or click &quot;Add Memory&quot; to teach her things about you.
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 group"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: currentTheme.surface,
                        borderColor: currentTheme.border,
                        color: currentTheme.accent,
                      }}
                    >
                      {mem.category}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {mem.key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {Math.round(mem.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 break-words leading-relaxed">
                    {mem.value}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Source: {mem.source} • {new Date(mem.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer shrink-0"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t bg-white/[0.02] flex items-center justify-between text-xs text-slate-400"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local storage + real-time neural sync</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
