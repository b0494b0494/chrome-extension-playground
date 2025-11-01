// DOM要素の取得
const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loadingDiv = document.getElementById('loading');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('model');
const saveSettingsBtn = document.getElementById('saveSettings');

// 設定の読み込み
async function loadSettings() {
  const result = await chrome.storage.sync.get(['apiKey', 'model']);
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
  if (result.model) {
    modelSelect.value = result.model;
  }
}

// 設定の保存
async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;
  
  if (!apiKey) {
    alert('API Keyを入力してください');
    return;
  }
  
  await chrome.storage.sync.set({ apiKey, model });
  settingsPanel.classList.add('hidden');
  showMessage('設定を保存しました', 'system');
}

// メッセージを表示
function showMessage(text, role = 'assistant') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// エラーメッセージを表示
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = `エラー: ${message}`;
  messagesDiv.appendChild(errorDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// OpenAI APIを呼び出し
async function callOpenAI(prompt) {
  const result = await chrome.storage.sync.get(['apiKey', 'model']);
  const apiKey = result.apiKey;
  const model = result.model || 'gpt-3.5-turbo';
  
  if (!apiKey) {
    throw new Error('API Keyが設定されていません。設定からAPI Keyを入力してください。');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'あなたは親切で役立つアシスタントです。日本語で回答してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API呼び出しに失敗しました');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// メッセージ送信
async function sendMessage() {
  const prompt = userInput.value.trim();
  if (!prompt) return;
  
  // ユーザーメッセージを表示
  showMessage(prompt, 'user');
  userInput.value = '';
  sendBtn.disabled = true;
  loadingDiv.classList.remove('hidden');
  
  try {
    const response = await callOpenAI(prompt);
    showMessage(response, 'assistant');
  } catch (error) {
    showError(error.message);
  } finally {
    loadingDiv.classList.add('hidden');
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// イベントリスナー
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

saveSettingsBtn.addEventListener('click', saveSettings);

// 初期化
loadSettings();
userInput.focus();