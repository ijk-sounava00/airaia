import { Memory, MemoryCategory } from '../types';

const STORAGE_KEY = 'aira_persistent_memories_v1';
const USER_ID_KEY = 'aira_user_id_v1';

export class MemoryService {
  private static instance: MemoryService;
  private memories: Memory[] = [];
  private listeners: Array<(memories: Memory[]) => void> = [];
  private userId: string;

  private constructor() {
    this.userId = this.getOrCreateUserId();
    this.loadFromStorage();
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  private getOrCreateUserId(): string {
    try {
      let uid = localStorage.getItem(USER_ID_KEY);
      if (!uid) {
        uid = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(USER_ID_KEY, uid);
      }
      return uid;
    } catch {
      return 'default-user';
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.memories = JSON.parse(raw);
      } else {
        // Initial default seeds
        this.memories = [
          {
            id: 'seed-1',
            userId: this.userId,
            category: 'communication',
            key: 'response_style',
            value: 'Warm, witty, natural conversational style without robotic clichés',
            confidence: 1.0,
            source: 'explicit',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'seed-2',
            userId: this.userId,
            category: 'preferences',
            key: 'conciseness',
            value: 'Prefers crisp 1-2 sentence spoken answers rather than long essays',
            confidence: 0.95,
            source: 'explicit',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('Could not load memories from localStorage:', err);
      this.memories = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
      this.notify();
      // Asynchronously sync to backend API
      this.syncToBackend();
    } catch (err) {
      console.warn('Could not save memories to storage:', err);
    }
  }

  private async syncToBackend(): Promise<void> {
    try {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          memories: this.memories,
        }),
      });
    } catch {
      // Backend sync is progressive enhancement
    }
  }

  public getMemories(): Memory[] {
    return [...this.memories];
  }

  public getUserId(): string {
    return this.userId;
  }

  public saveMemory(
    category: MemoryCategory,
    key: string,
    value: string,
    source: 'explicit' | 'conversation' | 'inferred' = 'explicit',
    confidence = 1.0
  ): Memory {
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    const existingIndex = this.memories.findIndex(
      (m) => m.key.toLowerCase() === cleanKey || m.key.toLowerCase() === key.toLowerCase()
    );

    const now = new Date().toISOString();
    let updatedMemory: Memory;

    if (existingIndex >= 0) {
      updatedMemory = {
        ...this.memories[existingIndex],
        category,
        key: cleanKey,
        value: value.trim(),
        source,
        confidence,
        updatedAt: now,
        lastUsedAt: now,
      };
      this.memories[existingIndex] = updatedMemory;
    } else {
      updatedMemory = {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: this.userId,
        category,
        key: cleanKey,
        value: value.trim(),
        confidence,
        source,
        createdAt: now,
        updatedAt: now,
      };
      this.memories.unshift(updatedMemory);
    }

    this.saveToStorage();
    return updatedMemory;
  }

  public removeMemory(idOrKey: string): boolean {
    const prevLen = this.memories.length;
    this.memories = this.memories.filter(
      (m) => m.id !== idOrKey && m.key.toLowerCase() !== idOrKey.toLowerCase()
    );
    if (this.memories.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public clearAllMemories(): void {
    this.memories = [];
    this.saveToStorage();
  }

  public subscribe(listener: (memories: Memory[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getMemories());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.getMemories());
    }
  }

  /**
   * Generates a context block formatted for AIRA's prompt
   */
  public formatForSystemPrompt(): string {
    if (this.memories.length === 0) {
      return 'No stored user memories yet.';
    }

    const lines: string[] = ['STORED USER MEMORIES & CONFIRMED FACTS:'];
    for (const mem of this.memories) {
      lines.push(`- [${mem.category.toUpperCase()}] ${mem.key}: "${mem.value}" (confidence: ${mem.confidence})`);
    }
    return lines.join('\n');
  }
}
