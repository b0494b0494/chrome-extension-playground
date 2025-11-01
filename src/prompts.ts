import { ChatMode, Settings } from './types';
import { SYSTEM_PROMPTS } from './constants';

export async function loadCustomPrompts(): Promise<Record<ChatMode, string | undefined>> {
  const result = await chrome.storage.sync.get(['customPrompts']);
  return result.customPrompts || {};
}

export async function saveCustomPrompt(mode: ChatMode, prompt: string): Promise<void> {
  const customPrompts = await loadCustomPrompts();
  customPrompts[mode] = prompt;
  await chrome.storage.sync.set({ customPrompts });
}

export async function resetCustomPrompt(mode: ChatMode): Promise<void> {
  const customPrompts = await loadCustomPrompts();
  delete customPrompts[mode];
  await chrome.storage.sync.set({ customPrompts });
}

export function getEffectivePrompt(mode: ChatMode, settings: Settings): string {
  if (settings.customPrompts && settings.customPrompts[mode]) {
    return settings.customPrompts[mode];
  }
  return SYSTEM_PROMPTS[mode];
}