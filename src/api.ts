import { ChatMode, Settings, OpenAIMessage } from './types';
import { API_CONFIG } from './constants';

export async function callOpenAI(
  mode: ChatMode,
  messages: OpenAIMessage[],
  settings: Settings
): Promise<string> {
  const apiKey = settings.apiKey;
  const model = settings.model || API_CONFIG.defaultModel;
  
  if (!apiKey) {
    throw new Error('API Keyが設定されていません。設定からAPI Keyを入力してください。');
  }
  
  const response = await fetch(API_CONFIG.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: API_CONFIG.maxTokens[mode],
      temperature: API_CONFIG.temperature
    })
  });
  
  if (!response.ok) {
    let errorMessage = 'API呼び出しに失敗しました';
    try {
      const error = await response.json();
      errorMessage = error.error?.message || errorMessage;
    } catch {
      // JSON解析に失敗した場合
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // レスポンスの検証
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('APIレスポンスの形式が正しくありません');
  }
  
  return data.choices[0].message.content;
}