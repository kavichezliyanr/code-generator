# Best AI Code Generator

An AI-powered code generation tool that creates code based on natural language descriptions. Features a modern UI with a chat interface and project explorer.

## Features

- Natural language to code generation using AI models
- Real-time chat interface
- Project explorer for managing generated files
- Monaco code editor with syntax highlighting
- Support for multiple programming languages
- Integration with GPT models

## Setup

### Backend Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the backend server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter your code requirements in the chat interface
3. Select your preferred programming language and AI model
4. Click "Generate" to create code
5. Save generated code to files using the project explorer
6. View and manage your saved files in the project explorer

## Technologies Used

- Backend:
  - FastAPI
  - Python
  - LangChain
  - OpenAI GPT models

- Frontend:
  - React
  - TypeScript
  - Chakra UI
  - Monaco Editor
  - Vite

## License

MIT 