export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  codeChanges?: CodeChange[]
}

export interface CodeChange {
  filePath: string
  content: string
  language: string
  type: 'create' | 'update' | 'delete'
  timestamp: Date
} 