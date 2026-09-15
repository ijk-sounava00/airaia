import { ToolCall, ToolNotification, AuraTheme, MemoryCategory } from '../types';
import { MemoryService } from './MemoryService';

export type ToolHandler = (args: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;

/**
 * ToolManager
 * Handles execution of browser actions and function calls from Gemini Live API,
 * manages active tool notifications, and supports dynamic tool registration.
 */
let globalNotificationCounter = 0;
const createUniqueNotificationId = (prefix: string): string => {
  globalNotificationCounter += 1;
  return `${prefix}-${Date.now()}-${globalNotificationCounter}-${Math.random().toString(36).slice(2, 8)}`;
};

export class ToolManager {
  private handlers: Map<string, ToolHandler> = new Map();
  private onNotificationCallback?: (notification: ToolNotification) => void;
  private onTimerCreateCallback?: (durationSeconds: number, label?: string) => void;
  private onAuraChangeCallback?: (theme: AuraTheme) => void;

  constructor(options?: {
    onNotification?: (notification: ToolNotification) => void;
    onTimerCreate?: (durationSeconds: number, label?: string) => void;
    onAuraChange?: (theme: AuraTheme) => void;
  }) {
    if (options?.onNotification) this.onNotificationCallback = options.onNotification;
    if (options?.onTimerCreate) this.onTimerCreateCallback = options.onTimerCreate;
    if (options?.onAuraChange) this.onAuraChangeCallback = options.onAuraChange;

    this.registerDefaultTools();
  }

  /**
   * Registers default built-in tools
   */
  private registerDefaultTools() {
    // 1. openWebsite
    this.registerTool('openWebsite', async (args) => {
      let rawUrl = String(args.url || '').trim();
      if (!rawUrl) {
        return { status: 'error', message: 'No URL provided' };
      }

      // Ensure protocol
      let fullUrl = rawUrl;
      if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = `https://${fullUrl}`;
      }

      const title = args.title || this.extractDomain(fullUrl);

      // Attempt to open link safely
      let opened = false;
      try {
        const win = window.open(fullUrl, '_blank', 'noopener,noreferrer');
        if (win) {
          opened = true;
        }
      } catch (e) {
        console.warn('Browser prevented direct window.open (common in iframe):', e);
      }

      const notification: ToolNotification = {
        id: createUniqueNotificationId('tool'),
        name: 'openWebsite',
        title: `Opened ${title}`,
        detail: fullUrl,
        url: fullUrl,
        timestamp: Date.now(),
        actionType: 'link',
      };

      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      return {
        status: 'success',
        openedUrl: fullUrl,
        title,
        browserWindowOpened: opened,
      };
    });

    // 2. setTimer
    this.registerTool('setTimer', async (args) => {
      const durationSeconds = Number(args.durationSeconds) || 60;
      const label = args.label || 'Timer';

      if (this.onTimerCreateCallback) {
        this.onTimerCreateCallback(durationSeconds, label);
      }

      const notification: ToolNotification = {
        id: createUniqueNotificationId('timer'),
        name: 'setTimer',
        title: `Timer Set: ${Math.round(durationSeconds)}s`,
        detail: label,
        timestamp: Date.now(),
        actionType: 'timer',
      };

      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      return {
        status: 'success',
        durationSeconds,
        label,
        message: `Active countdown timer set for ${durationSeconds} seconds`,
      };
    });

    // 3. changeAuraColor
    this.registerTool('changeAuraColor', async (args) => {
      const rawTheme = String(args.theme || '').toLowerCase();
      const validThemes: AuraTheme[] = [
        'cyan', 'violet', 'emerald', 'rose', 'amber',
        'sapphire', 'sunset', 'aurora', 'amethyst', 'obsidian'
      ];
      let theme: AuraTheme = 'cyan';
      if (validThemes.includes(rawTheme as AuraTheme)) {
        theme = rawTheme as AuraTheme;
      }

      if (this.onAuraChangeCallback) {
        this.onAuraChangeCallback(theme);
      }

      const notification: ToolNotification = {
        id: createUniqueNotificationId('aura'),
        name: 'changeAuraColor',
        title: `Aura Color Shift`,
        detail: `New Color: ${theme.toUpperCase()}`,
        timestamp: Date.now(),
        actionType: 'aura',
      };

      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      return {
        status: 'success',
        theme,
        message: `Holographic aura updated to ${theme}`,
      };
    });

    // 4. saveMemory
    this.registerTool('saveMemory', async (args) => {
      const category = (args.category || 'preferences') as MemoryCategory;
      const key = String(args.key || 'note');
      const value = String(args.value || '');

      const mem = MemoryService.getInstance().saveMemory(
        category,
        key,
        value,
        'conversation',
        0.95
      );

      const notification: ToolNotification = {
        id: createUniqueNotificationId('memory'),
        name: 'saveMemory',
        title: 'Memory Stored',
        detail: `${key}: "${value}"`,
        timestamp: Date.now(),
        actionType: 'memory',
      };

      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      return {
        status: 'success',
        key: mem.key,
        value: mem.value,
        category: mem.category,
        message: `Saved into memory: ${key} = ${value}`,
      };
    });

    // 5. forgetMemory
    this.registerTool('forgetMemory', async (args) => {
      const key = String(args.key || '');
      const removed = MemoryService.getInstance().removeMemory(key);

      const notification: ToolNotification = {
        id: createUniqueNotificationId('forget'),
        name: 'forgetMemory',
        title: removed ? 'Memory Forgotten' : 'Memory Not Found',
        detail: `Key: ${key}`,
        timestamp: Date.now(),
        actionType: 'memory',
      };

      if (this.onNotificationCallback) {
        this.onNotificationCallback(notification);
      }

      return {
        status: removed ? 'success' : 'not_found',
        removed,
        message: removed ? `I have removed "${key}" from memory.` : `Could not find any memory for "${key}".`,
      };
    });

    // 6. getMemories
    this.registerTool('getMemories', async () => {
      const memories = MemoryService.getInstance().getMemories();
      return {
        status: 'success',
        count: memories.length,
        memories: memories.map((m) => ({
          category: m.category,
          key: m.key,
          value: m.value,
        })),
      };
    });

    // 7. getCurrentTime
    this.registerTool('getCurrentTime', async () => {
      const now = new Date();
      return {
        status: 'success',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    });
  }

  /**
   * Register a custom tool for future extension
   */
  registerTool(name: string, handler: ToolHandler): void {
    this.handlers.set(name, handler);
  }

  /**
   * Executes a tool call and returns the structured result for Live API
   */
  async execute(toolCall: ToolCall): Promise<Record<string, any>> {
    const handler = this.handlers.get(toolCall.name);
    if (!handler) {
      console.warn(`No handler registered for tool: ${toolCall.name}`);
      return {
        status: 'error',
        message: `Tool ${toolCall.name} not implemented on client`,
      };
    }

    try {
      const result = await handler(toolCall.args);
      return result || { status: 'success' };
    } catch (err: any) {
      console.error(`Error executing tool ${toolCall.name}:`, err);
      return {
        status: 'error',
        message: err?.message || 'Tool execution failed',
      };
    }
  }

  private extractDomain(urlStr: string): string {
    try {
      const url = new URL(urlStr);
      return url.hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  }
}
