# AI Code Editor Project

This is a modern code editor with AI-powered code generation capabilities. The project supports multiple AI models:

- OpenAI GPT-3.5 Turbo
- Mistral AI (Tiny, Small, Medium)
- HuggingFace Models (StarCoder, Code Llama, StarCoder Plus)

## Features

- 🤖 AI-powered code generation
- 📝 MDX preview support
- 🌗 Dark mode interface
- 📁 File explorer
- 💻 Monaco editor integration
- 🔄 Real-time file updates

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── ProjectExplorer.tsx
│   │   └── MDXPreview.tsx
│   ├── App.tsx
│   └── main.tsx
├── workspace/
│   └── README.md
└── package.json
``` 