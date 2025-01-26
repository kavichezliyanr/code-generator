import { Box } from '@chakra-ui/react'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  code: string
  selectedFile: string | null
}

const CodeEditor = ({ code, selectedFile }: CodeEditorProps) => {
  return (
    <Box h="full" borderWidth={1} borderRadius="lg" overflow="hidden">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={code}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          readOnly: true,
        }}
      />
    </Box>
  )
}

export default CodeEditor 