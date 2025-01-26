import { Box, Flex, useColorMode, ChakraProvider, ColorModeScript, Image, VStack, Text, HStack, Icon, Tooltip } from '@chakra-ui/react'
import ChatInterface from './components/ChatInterface'
import ProjectExplorer from './components/ProjectExplorer'
import { useState, useEffect } from 'react'
import theme from './theme'
import { ChatMessage } from './types/chat'
import { FaCode, FaGithub, FaRobot, FaBrain } from 'react-icons/fa'

interface EditorState {
  path: string
  content: string
  language: string
}

function AppContent() {
  const [currentFile, setCurrentFile] = useState<EditorState | null>(null)
  const [isExplorerOpen, setIsExplorerOpen] = useState(true)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const { colorMode, toggleColorMode } = useColorMode()

  useEffect(() => {
    // Ensure dark mode is enabled
    if (colorMode !== 'dark') {
      toggleColorMode()
    }
  }, [])

  const handleFileSelect = (file: { path: string; content: string; language: string }) => {
    setCurrentFile(file)
  }

  const handleCodeGenerate = (generatedCode: string) => {
    if (currentFile) {
      setCurrentFile({
        ...currentFile,
        content: generatedCode,
      })
    }
  }

  const handleChatHistoryUpdate = (history: ChatMessage[]) => {
    setChatHistory(history)
  }

  return (
    <Flex direction="column" h="100vh" bg="gray.900">
      {/* Header */}
      <Flex 
        w="100%" 
        h="48px" 
        bg="gray.800" 
        borderBottom="1px" 
        borderColor="gray.700"
        px={4}
        align="center"
        justify="space-between"
      >
        <HStack spacing={4}>
          <HStack spacing={2}>
            <Icon as={FaCode} color="blue.400" boxSize={6} />
            <Text fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
              AI Code Editor
            </Text>
          </HStack>
          <HStack 
            spacing={4} 
            ml={8} 
            color="gray.400" 
            fontSize="sm"
            display={{ base: 'none', md: 'flex' }}
          >
            <Tooltip label="Powered by GPT Models">
              <HStack spacing={1}>
                <Icon as={FaBrain} />
                <Text>AI Models</Text>
              </HStack>
            </Tooltip>
            <Tooltip label="Smart Code Assistant">
              <HStack spacing={1}>
                <Icon as={FaRobot} />
                <Text>Assistant</Text>
              </HStack>
            </Tooltip>
            <Tooltip label="View on GitHub">
              <HStack 
                spacing={1} 
                as="a" 
                href="https://github.com/kavichezliyanr/code-generator" 
                target="_blank"
                _hover={{ color: 'blue.400' }}
              >
                <Icon as={FaGithub} />
                <Text>GitHub</Text>
              </HStack>
            </Tooltip>
          </HStack>
        </HStack>
      </Flex>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Project Explorer */}
        {isExplorerOpen && (
          <Box 
            w="300px" 
            borderRight="1px" 
            borderColor="gray.700"
            bg="gray.800"
            flexShrink={0}
          >
            <ProjectExplorer 
              onFileSelect={handleFileSelect}
              onClose={() => setIsExplorerOpen(false)}
              chatHistory={chatHistory}
            />
          </Box>
        )}

        {/* Editor and Chat Interface */}
        <Box flex={1} maxW={isExplorerOpen ? "calc(100% - 300px)" : "100%"}>
          <ChatInterface 
            onCodeGenerate={handleCodeGenerate}
            currentFile={currentFile}
            onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
            isExplorerOpen={isExplorerOpen}
            onChatHistoryUpdate={handleChatHistoryUpdate}
          />
        </Box>
      </Flex>

      {/* Footer */}
      <Flex 
        h="24px" 
        bg="gray.800" 
        borderTop="1px" 
        borderColor="gray.700"
        px={4}
        align="center"
        justify="center"
        fontSize="xs"
        color="gray.500"
      >
        <Text>AI Code Editor • Built with ❤️ using React and ChatGPT</Text>
      </Flex>
    </Flex>
  )
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />
      <AppContent />
    </ChakraProvider>
  )
}

export default App
