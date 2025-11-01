# LLM Chat Assistant - Chrome Extension

A Chrome extension for chatting with OpenAI API. Supports interview preparation, feedback organization, and schedule management.

## Features

- 🤖 Chat with GPT-3.5/GPT-4
- 🎯 6 modes: Normal, Wall, Rephrase, Pre-Interview, Feedback, Calendar
- 🔧 Customizable prompts for each mode
- 📅 Visual calendar for schedule management
- 🔐 Security measures implemented

## Quick Setup

1. **Build TypeScript**
   ```bash
   npm install
   npm run build
   ```

2. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

3. **Set API Key**
   - Click extension icon → ⚙️ button
   - Enter your OpenAI API Key
   - Select model and save

4. **Create icons** (optional)
   - Open `create_icons.html` in browser
   - Right-click each canvas and save as `icon16.png`, `icon48.png`, `icon128.png`

## Usage

- **Normal/Wall/Rephrase/Pre-Interview/Feedback**: Type message and send
- **Calendar**: Click date to select, double-click to add event

## Modes

- 💬 **Normal**: General chat
- 🧱 **Wall**: Get thought-provoking questions instead of advice
- ✍️ **Rephrase**: Refine and restructure text
- 😰 **Pre-Interview**: Prepare for interviews
- 📝 **Feedback**: Organize interview feedback into categories
- 📅 **Calendar**: Manage schedules visually

## Development

```bash
npm run build    # Build TypeScript
npm run watch    # Watch mode for development
```

## Security

- XSS protection via `textContent`
- Input validation
- Error message sanitization
- CSP configured

## License

MIT