# LLM Chat Assistant - Chrome拡張

シンプルなLLM（OpenAI API）を使用したChrome拡張機能です。

## 機能

- OpenAI APIを使用したチャット機能
- 設定からAPI Keyとモデルを選択可能
- モダンで使いやすいUI

## セットアップ方法

### 1. 必要なファイルを確認

以下のファイルが必要です：
- `manifest.json`
- `popup.html`
- `popup.css`
- `popup.js`
- `icon16.png`, `icon48.png`, `icon128.png` (アイコン画像)

### 2. アイコンの準備

アイコン画像を用意してください（PNG形式、16x16, 48x48, 128x128ピクセル）。

#### 方法1: HTMLファイルを使用（推奨）
1. `create_icons.html` をブラウザで開く
2. 各キャンバスを右クリック → 「名前を付けて画像を保存」
3. `icon16.png`, `icon48.png`, `icon128.png` として保存

#### 方法2: Pythonスクリプトを使用
```bash
pip install Pillow
python3 generate_icons.py
```

#### 方法3: ImageMagickを使用
```bash
convert -size 128x128 xc:purple -pointsize 72 -fill white -gravity center -annotate +0+0 "LLM" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

### 3. Chrome拡張機能として読み込む

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのフォルダを選択

### 4. API Keyの設定

1. 拡張機能のアイコンをクリック
2. 右上の⚙️ボタンをクリック
3. OpenAI API Keyを入力（`sk-...` から始まるキー）
4. 使用するモデルを選択（GPT-3.5 Turbo または GPT-4）
5. 「保存」ボタンをクリック

## OpenAI API Keyの取得方法

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成またはログイン
3. API Keysセクションに移動
4. 「Create new secret key」をクリック
5. 生成されたキーをコピー

## 使い方

1. 拡張機能のアイコンをクリック
2. テキストエリアにメッセージを入力
3. 「送信」ボタンをクリック、または Enterキーを押す
4. LLMからの応答が表示されます

## 注意事項

- API KeyはChromeのストレージに暗号化されずに保存されます
- API使用にはOpenAIの料金がかかります
- API Keyを他人に共有しないでください

## 開発

ファイルを編集した後は、`chrome://extensions/` ページで拡張機能の「更新」ボタンをクリックして変更を反映してください。

## ライセンス

MIT