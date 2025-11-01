import { ChatMode, ChatMessage, Settings } from './types';
import { MODE_CONFIGS, SYSTEM_PROMPTS } from './constants';
import { buildMessages } from './utils';
import { callOpenAI } from './api';
import { loadSettings, saveSettings } from './storage';
import { CalendarUI } from './calendar-ui';
import { loadCustomPrompts, saveCustomPrompt, resetCustomPrompt } from './prompts';
import { validateApiKey, validatePrompt, validateModel, sanitizeErrorMessage } from './security';

// DOM要素
const elements = {
  messagesDiv: document.getElementById('messages')!,
  calendarContainer: document.getElementById('calendarContainer')!,
  userInput: document.getElementById('userInput') as HTMLTextAreaElement,
  sendBtn: document.getElementById('sendBtn')!,
  loadingDiv: document.getElementById('loading')!,
  settingsBtn: document.getElementById('settingsBtn')!,
  settingsPanel: document.getElementById('settingsPanel')!,
  apiKeyInput: document.getElementById('apiKey') as HTMLInputElement,
  modelSelect: document.getElementById('model') as HTMLSelectElement,
  saveSettingsBtn: document.getElementById('saveSettings')!,
  apiSettings: document.getElementById('apiSettings')!,
  promptsSettings: document.getElementById('promptsSettings')!,
  promptModeSelect: document.getElementById('promptModeSelect') as HTMLSelectElement,
  customPrompt: document.getElementById('customPrompt') as HTMLTextAreaElement,
  savePromptBtn: document.getElementById('savePromptBtn')!,
  resetPromptBtn: document.getElementById('resetPromptBtn')!
} as const;

// カレンダーUI
let calendarUI: CalendarUI | null = null;

// 状態管理
let conversationHistory: ChatMessage[] = [];
let currentMode: ChatMode = 'normal';
let currentSettings: Settings = {};

// モードボタンの取得（動的）
function getModeButtons(): Record<ChatMode, HTMLButtonElement | null> {
  const buttons: Partial<Record<ChatMode, HTMLButtonElement>> = {};
  MODE_CONFIGS.forEach(config => {
    // HTMLのボタンIDパターンに合わせる
    const idMap: Record<ChatMode, string> = {
      normal: 'normalModeBtn',
      wall: 'wallModeBtn',
      rephrase: 'rephraseBtn',
      preInterview: 'preInterviewBtn',
      feedback: 'feedbackBtn',
      calendar: 'calendarBtn'
    };
    const btn = document.getElementById(idMap[config.id]);
    if (btn) {
      buttons[config.id] = btn as HTMLButtonElement;
    }
  });
  return buttons as Record<ChatMode, HTMLButtonElement | null>;
}

// メッセージ表示（XSS対策済み）
function showMessage(text: string, role: 'user' | 'assistant' | 'system' = 'assistant'): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  // textContentを使用してXSSを防止（HTMLタグは自動的にエスケープされる）
  messageDiv.textContent = text;
  elements.messagesDiv.appendChild(messageDiv);
  elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
  
  if (currentMode !== 'rephrase' && role !== 'system') {
    // 履歴にも安全な形式で保存
    conversationHistory.push({ role, content: text });
  }
}

// エラー表示（機密情報をマスク）
function showError(error: unknown): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  // 機密情報（API Keyなど）を含む可能性のあるエラーメッセージをサニタイズ
  const safeMessage = sanitizeErrorMessage(error);
  errorDiv.textContent = `エラー: ${safeMessage}`;
  elements.messagesDiv.appendChild(errorDiv);
  elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
}

// モードボタンの更新
async function updateModeButtons(): Promise<void> {
  const modeButtons = getModeButtons();
  const config = MODE_CONFIGS.find(c => c.id === currentMode);
  
  MODE_CONFIGS.forEach(modeConfig => {
    const btn = modeButtons[modeConfig.id];
    if (btn) {
      btn.classList.toggle('active', modeConfig.id === currentMode);
    }
  });
  
  if (config) {
    elements.userInput.placeholder = config.placeholder;
  }
  
  // カレンダーモードの表示切り替え
  if (currentMode === 'calendar') {
    elements.messagesDiv.classList.add('hidden');
    elements.calendarContainer.classList.remove('hidden');
    if (!calendarUI) {
      calendarUI = new CalendarUI(elements.calendarContainer);
      await calendarUI.init();
    } else {
      await calendarUI.refresh();
    }
  } else {
    elements.messagesDiv.classList.remove('hidden');
    elements.calendarContainer.classList.add('hidden');
  }
  
  // モード変更時の初期化
  if (currentMode !== 'calendar') {
    conversationHistory = [];
    elements.messagesDiv.innerHTML = '';
    
    if (config?.initialMessage && currentMode !== 'rephrase') {
      showMessage(config.initialMessage, 'assistant');
    }
  }
}

// 設定の読み込み
async function loadAppSettings(): Promise<void> {
  currentSettings = await loadSettings();
  if (currentSettings.apiKey) {
    elements.apiKeyInput.value = currentSettings.apiKey;
  }
  if (currentSettings.model) {
    elements.modelSelect.value = currentSettings.model;
  }
  if (currentSettings.mode) {
    currentMode = currentSettings.mode;
    await updateModeButtons();
  }
  
  // プロンプトの読み込み
  await loadPromptForMode(currentMode);
}

// プロンプトの読み込み
async function loadPromptForMode(mode: ChatMode): Promise<void> {
  elements.promptModeSelect.value = mode;
  const customPrompts = await loadCustomPrompts();
  if (customPrompts[mode]) {
    elements.customPrompt.value = customPrompts[mode] || '';
  } else {
    elements.customPrompt.value = SYSTEM_PROMPTS[mode];
  }
}

// 設定の保存（入力値検証付き）
async function saveAppSettings(): Promise<void> {
  const apiKey = elements.apiKeyInput.value.trim();
  const model = elements.modelSelect.value;
  
  if (!apiKey) {
    alert('API Keyを入力してください');
    return;
  }
  
  // API Keyの形式検証
  if (!validateApiKey(apiKey)) {
    alert('API Keyの形式が正しくありません。正しいOpenAI API Keyを入力してください。');
    return;
  }
  
  // モデル名の検証
  if (!validateModel(model)) {
    alert('無効なモデル名です');
    return;
  }
  
  await saveSettings({ apiKey, model });
  elements.settingsPanel.classList.add('hidden');
  showMessage('設定を保存しました', 'system');
  currentSettings = { ...currentSettings, apiKey, model };
  await loadAppSettings();
}

// プロンプトの保存（入力値検証付き）
async function saveCustomPromptForMode(): Promise<void> {
  const mode = elements.promptModeSelect.value as ChatMode;
  const prompt = elements.customPrompt.value.trim();
  
  // プロンプトの検証
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    alert(validation.error || 'プロンプトが無効です');
    return;
  }
  
  await saveCustomPrompt(mode, prompt);
  if (!currentSettings.customPrompts) {
    currentSettings.customPrompts = {} as Partial<Record<ChatMode, string>>;
  }
  currentSettings.customPrompts[mode] = prompt;
  
  showMessage(`${MODE_CONFIGS.find(c => c.id === mode)?.label}モードのプロンプトを保存しました`, 'system');
}

// プロンプトをデフォルトに戻す
async function resetPromptToDefault(): Promise<void> {
  const mode = elements.promptModeSelect.value as ChatMode;
  await resetCustomPrompt(mode);
  elements.customPrompt.value = SYSTEM_PROMPTS[mode];
  
  if (currentSettings.customPrompts) {
    delete currentSettings.customPrompts[mode];
  }
  
  showMessage(`${MODE_CONFIGS.find(c => c.id === mode)?.label}モードのプロンプトをデフォルトに戻しました`, 'system');
}

// メッセージ送信
async function sendMessage(): Promise<void> {
  const prompt = elements.userInput.value.trim();
  if (!prompt) return;
  
  if (currentMode !== 'rephrase') {
    showMessage(prompt, 'user');
  }
  elements.userInput.value = '';
  elements.sendBtn.setAttribute('disabled', 'true');
  elements.loadingDiv.classList.remove('hidden');
  
  try {
    const messages = buildMessages(currentMode, prompt, conversationHistory, currentSettings);
    const response = await callOpenAI(currentMode, messages, currentSettings);
    
    if (currentMode === 'rephrase') {
      showMessage(`元のテキスト:\n${prompt}`, 'user');
      showMessage(`再構成後:\n${response}`, 'assistant');
    } else {
      showMessage(response, 'assistant');
    }
  } catch (error) {
    showError(error);
  } finally {
    elements.loadingDiv.classList.add('hidden');
    elements.sendBtn.removeAttribute('disabled');
    elements.userInput.focus();
  }
}

// モード切り替え
async function switchMode(mode: ChatMode): Promise<void> {
  currentMode = mode;
  saveSettings({ mode });
  await updateModeButtons();
}

// イベントリスナーの設定
function setupEventListeners(): void {
  elements.sendBtn.addEventListener('click', sendMessage);
  
  elements.userInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsPanel.classList.toggle('hidden');
  });
  
  elements.saveSettingsBtn.addEventListener('click', saveAppSettings);
  
  // 設定タブの切り替え
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tabName = target.dataset.tab;
      
      // タブのアクティブ状態を更新
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      target.classList.add('active');
      
      // コンテンツの表示を切り替え
      elements.apiSettings.classList.toggle('hidden', tabName !== 'api');
      elements.promptsSettings.classList.toggle('hidden', tabName !== 'prompts');
    });
  });
  
  // プロンプトモード選択の変更
  elements.promptModeSelect.addEventListener('change', async () => {
    const mode = elements.promptModeSelect.value as ChatMode;
    await loadPromptForMode(mode);
  });
  
  // プロンプト保存・リセットボタン
  elements.savePromptBtn.addEventListener('click', saveCustomPromptForMode);
  elements.resetPromptBtn.addEventListener('click', resetPromptToDefault);
  
  // モードボタンのイベントリスナー（一括設定）
  const idMap: Record<ChatMode, string> = {
    normal: 'normalModeBtn',
    wall: 'wallModeBtn',
    rephrase: 'rephraseBtn',
    preInterview: 'preInterviewBtn',
    feedback: 'feedbackBtn',
    calendar: 'calendarBtn'
  };
  
  MODE_CONFIGS.forEach(config => {
    const btn = document.getElementById(idMap[config.id]);
    if (btn) {
      btn.addEventListener('click', () => switchMode(config.id));
    }
  });
}

// 初期化
async function init(): Promise<void> {
  await loadAppSettings();
  await updateModeButtons();
  setupEventListeners();
  if (currentMode !== 'calendar') {
    elements.userInput.focus();
  }
}

// 起動
init();