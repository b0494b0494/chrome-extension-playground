import { Settings } from './types';

export async function loadSettings(): Promise<Settings> {
  return await chrome.storage.sync.get(['apiKey', 'model', 'mode']);
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(settings);
}