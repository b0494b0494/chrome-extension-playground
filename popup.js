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
const normalModeBtn = document.getElementById('normalModeBtn');
const wallModeBtn = document.getElementById('wallModeBtn');
const rephraseBtn = document.getElementById('rephraseBtn');
const preInterviewBtn = document.getElementById('preInterviewBtn');
const feedbackBtn = document.getElementById('feedbackBtn');

// 会話履歴とモード
let conversationHistory = [];
let currentMode = 'normal';

// システムプロンプト
const SYSTEM_PROMPTS = {
  normal: 'あなたは親切で役立つアシスタントです。日本語で回答してください。',
  wall: `あなたは、ユーザーが自分の考えを整理するための「壁打ち」相手です。
あなたの唯一の仕事は、ユーザーの発言内容について、より深く考えるきっかけとなる質問を返すことです。

[ルール]
- あなた自身の意見やアドバイスは絶対に言わないでください。
- 必ず、ユーザーの発言を掘り下げる1つの短い質問で返してください。
- 質問は「なぜそう感じたのですか？」「具体的に言うとどういうことですか？」といった形式で、ユーザーの思考を促すものにしてください。`,
  rephrase: `あなたはプロの文章再構成専門家です。以下の指示と制約に従って、提供されたテキストを再構成してください。

### 指示
- 不要な繰り返しや冗長な表現を削除し、より簡潔で洗練された表現に修正してください。
- 箇条書きや段落分けなど、読みやすさを向上させるための構成要素を適切に適用してください。
- 元の意味やニュアンスを損なうことなく、より明確で論理的な文章構造に再配置してください。

### 制約・条件
- 応答は再構成された日本語のテキストのみにしてください。余計な記号、番号、翻訳、説明などは一切含めないでください。
- あなた自身の意見や感想は含めないでください。
- 元の文章の意図を正確に汲み取り、損なわないでください。`,
  preInterview: `あなたは面談前の不安を和らげ、準備をサポートするアシスタントです。

[役割]
- ユーザーの不安や緊張を理解し、共感すること
- 面談に向けた準備を整理する手助けをすること
- 質問を準備するサポートをすること

[ルール]
- 励ましの言葉を適度に使い、ユーザーの自信を高めること
- 具体的で実践的なアドバイスを提供すること
- 不安を軽減するための質問や準備すべきことを提案すること
- ユーザーの話を聞き、整理して返すこと`,
  feedback: `あなたは面談後のフィードバックを整理し、構造化する専門家です。

[役割]
面談のフィードバックを以下のカテゴリに分類・整理すること：
- impression（全体的な感想）
- attraction（魅力点・良い点）
- concern（懸念点・気になる点）
- aspiration（志望度：高め/普通/低め）
- next_step（次のステップ：次に進めたい/保留/辞退）
- other（その他）

[ルール]
- ユーザーが話した内容から、これらのカテゴリを自動的に抽出すること
- 各カテゴリに該当する内容を簡潔にまとめること
- 箇条書きや見やすい形式で整理すること
- 元の内容の意図を正確に反映すること`
};

// 設定の読み込み
async function loadSettings() {
  const result = await chrome.storage.sync.get(['apiKey', 'model', 'mode']);
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
  if (result.model) {
    modelSelect.value = result.model;
  }
  if (result.mode) {
    currentMode = result.mode;
    updateModeButtons();
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

// モードボタンの更新
function updateModeButtons() {
  normalModeBtn.classList.toggle('active', currentMode === 'normal');
  wallModeBtn.classList.toggle('active', currentMode === 'wall');
  rephraseBtn.classList.toggle('active', currentMode === 'rephrase');
  preInterviewBtn.classList.toggle('active', currentMode === 'preInterview');
  feedbackBtn.classList.toggle('active', currentMode === 'feedback');
  
  // プレースホルダーの更新
  if (currentMode === 'wall') {
    userInput.placeholder = '考えを整理したいことを話してください...';
  } else if (currentMode === 'rephrase') {
    userInput.placeholder = '再構成したい文章を入力してください...';
  } else if (currentMode === 'preInterview') {
    userInput.placeholder = '面談前の不安や準備したいことを話してください...';
  } else if (currentMode === 'feedback') {
    userInput.placeholder = '面談のフィードバックを話してください...';
  } else {
    userInput.placeholder = 'メッセージを入力してください...';
  }
  
  // モード変更時は会話履歴をクリア
  if (currentMode === 'rephrase') {
    // 再構成モードは会話履歴をクリア
    conversationHistory = [];
    messagesDiv.innerHTML = '';
  } else {
    conversationHistory = [];
    messagesDiv.innerHTML = '';
    if (currentMode === 'wall') {
      showMessage('カジュアル面談のフィードバックについて、壁打ちしましょう！何から話しますか？', 'assistant');
    } else if (currentMode === 'preInterview') {
      showMessage('面談前の準備をサポートします。どんな不安や準備したいことがありますか？', 'assistant');
    } else if (currentMode === 'feedback') {
      showMessage('面談のフィードバックを整理します。面談の内容を自由に話してください。複数回に分けて話してもOKです。', 'assistant');
    }
  }
}

// メッセージを表示
function showMessage(text, role = 'assistant') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  // 会話履歴に追加（再構成モード以外）
  if (currentMode !== 'rephrase' && role !== 'system') {
    conversationHistory.push({ role, content: text });
  }
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
  
  // メッセージの構築
  const messages = [{
    role: 'system',
    content: SYSTEM_PROMPTS[currentMode]
  }];
  
  if (currentMode === 'rephrase') {
    // 再構成モード: 単純なリクエスト
    messages.push({
      role: 'user',
      content: `[テキスト]\n${prompt}\n\n[再構成されたテキスト]`
    });
  } else if (currentMode === 'feedback') {
    // フィードバックモード: 構造化して整理
    const historyText = conversationHistory.slice(-5).map(msg => {
      return msg.role === 'user' ? `ユーザー: ${msg.content}` : `アシスタント: ${msg.content}`;
    }).join('\n');
    
    messages.push({
      role: 'user',
      content: `面談のフィードバックを整理してください。以下の内容から、impression（全体的な感想）、attraction（魅力点）、concern（懸念点）、aspiration（志望度）、next_step（次のステップ）、other（その他）を抽出して構造化してください。

${historyText ? `[会話履歴]\n${historyText}\n\n` : ''}[今回のフィードバック]\n${prompt}`
    });
  } else {
    // 通常モード・壁打ちモード: 会話履歴を含める
    // 会話履歴から最後の数メッセージを取得（コンテキスト長を考慮）
    const historyMessages = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // 現在のユーザーメッセージを追加
    historyMessages.push({
      role: 'user',
      content: prompt
    });
    
    messages.push(...historyMessages);
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: currentMode === 'rephrase' || currentMode === 'feedback' ? 1000 : 500,
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
  
  // ユーザーメッセージを表示（再構成モード以外）
  if (currentMode !== 'rephrase') {
    showMessage(prompt, 'user');
  }
  userInput.value = '';
  sendBtn.disabled = true;
  loadingDiv.classList.remove('hidden');
  
  try {
    const response = await callOpenAI(prompt);
    
    if (currentMode === 'rephrase') {
      // 再構成モード: 元のテキストと再構成後のテキストを両方表示
      showMessage(`元のテキスト:\n${prompt}`, 'user');
      showMessage(`再構成後:\n${response}`, 'assistant');
    } else {
      showMessage(response, 'assistant');
    }
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

// モード切り替え
normalModeBtn.addEventListener('click', () => {
  currentMode = 'normal';
  chrome.storage.sync.set({ mode: currentMode });
  updateModeButtons();
});

wallModeBtn.addEventListener('click', () => {
  currentMode = 'wall';
  chrome.storage.sync.set({ mode: currentMode });
  updateModeButtons();
});

rephraseBtn.addEventListener('click', () => {
  currentMode = 'rephrase';
  chrome.storage.sync.set({ mode: currentMode });
  updateModeButtons();
});

preInterviewBtn.addEventListener('click', () => {
  currentMode = 'preInterview';
  chrome.storage.sync.set({ mode: currentMode });
  updateModeButtons();
});

feedbackBtn.addEventListener('click', () => {
  currentMode = 'feedback';
  chrome.storage.sync.set({ mode: currentMode });
  updateModeButtons();
});

// 初期化
loadSettings();
updateModeButtons();
userInput.focus();