import { ChatMode, ChatMessage, OpenAIMessage, Settings } from './types';
import { getEffectivePrompt } from './prompts';

export function buildMessages(mode: ChatMode, prompt: string, history: ChatMessage[], settings: Settings): OpenAIMessage[] {
  const systemPrompt = getEffectivePrompt(mode, settings);
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ];

  if (mode === 'rephrase') {
    messages.push({
      role: 'user',
      content: `[テキスト]\n${prompt}\n\n[再構成されたテキスト]`
    });
  } else if (mode === 'feedback') {
    const historyText = history.slice(-5).map(msg => 
      msg.role === 'user' ? `ユーザー: ${msg.content}` : `アシスタント: ${msg.content}`
    ).join('\n');
    
    messages.push({
      role: 'user',
      content: `面談のフィードバックを整理してください。以下の内容から、impression（全体的な感想）、attraction（魅力点）、concern（懸念点）、aspiration（志望度）、next_step（次のステップ）、other（その他）を抽出して構造化してください。

${historyText ? `[会話履歴]\n${historyText}\n\n` : ''}[今回のフィードバック]\n${prompt}`
    });
  } else {
    const historyMessages: OpenAIMessage[] = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    historyMessages.push({
      role: 'user',
      content: prompt
    });
    
    messages.push(...historyMessages);
  }

  return messages;
}