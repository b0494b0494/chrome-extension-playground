export type ChatMode = 'normal' | 'wall' | 'rephrase' | 'preInterview' | 'feedback' | 'calendar';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Settings {
  apiKey?: string;
  model?: string;
  mode?: ChatMode;
  customPrompts?: Partial<Record<ChatMode, string>>;
}

export interface ModeConfig {
  id: ChatMode;
  label: string;
  emoji: string;
  placeholder: string;
  initialMessage?: string;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  status: 'draft' | 'confirmed';
  createdAt: string;
}