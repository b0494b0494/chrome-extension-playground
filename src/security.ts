/**
 * セキュリティ関連のユーティリティ関数
 */

/**
 * XSS対策: テキストを安全にエスケープ
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 入力値の検証: API Key形式の検証
 */
export function validateApiKey(apiKey: string): boolean {
  // OpenAI API Keyは通常 "sk-" で始まり、51文字以上
  if (!apiKey || apiKey.trim().length < 20) {
    return false;
  }
  // 基本的な形式チェック
  return /^sk-[a-zA-Z0-9]{20,}$/.test(apiKey.trim());
}

/**
 * 入力値の検証: プロンプトの長さ制限
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  const maxLength = 10000; // プロンプトの最大長
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'プロンプトが空です' };
  }
  if (prompt.length > maxLength) {
    return { valid: false, error: `プロンプトが長すぎます（最大${maxLength}文字）` };
  }
  return { valid: true };
}

/**
 * 入力値の検証: モデル名の検証
 */
export function validateModel(model: string): boolean {
  const allowedModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
  return allowedModels.includes(model);
}

/**
 * エラーメッセージのサニタイズ: 機密情報を含まないようにする
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    // API Keyを含む可能性のある文字列をマスク
    return message.replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***');
  }
  return 'エラーが発生しました';
}

/**
 * URLの検証
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'api.openai.com';
  } catch {
    return false;
  }
}