import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Select as ChakraSelect,
  IconButton,
  Tooltip,
  Textarea,
  Icon,
  Flex,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from '@chakra-ui/react'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { 
  FaPlay, 
  FaCopy, 
  FaUndo, 
  FaBars,
  FaPaperPlane,
  FaCode,
  FaEye,
  FaCog,
  FaRobot,
  FaRegLightbulb,
  FaRegKeyboard,
  FaPlus,
  FaTrash,
  FaPencilAlt,
} from 'react-icons/fa'
import MDXPreview from './MDXPreview'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessage, CodeChange } from '../types/chat'

interface Model {
  id: string
  name: string
  provider: string
}

interface EditorState {
  path: string
  content: string
  language: string
}

interface ChatInterfaceProps {
  onCodeGenerate: (code: string) => void
  currentFile: EditorState | null
  onToggleExplorer: () => void
  isExplorerOpen: boolean
  onChatHistoryUpdate?: (history: ChatMessage[]) => void
  onFileSelect: (file: { path: string; content: string; language: string }) => void
}

const ChatInterface = ({ onCodeGenerate, currentFile, onToggleExplorer, isExplorerOpen, onChatHistoryUpdate, onFileSelect }: ChatInterfaceProps) => {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [modelId, setModelId] = useState('gpt-3.5-turbo')
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [code, setCode] = useState('')
  const [originalCode, setOriginalCode] = useState('')
  const editorRef = useRef(null)
  const toast = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content)
      setOriginalCode(currentFile.content)
      setLanguage(currentFile.language)
    }
  }, [currentFile])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('http://localhost:8000/models')
        setModels(response.data.models)
      } catch (error) {
        console.error('Failed to fetch models:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch available models',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
    fetchModels()
  }, [])

  useEffect(() => {
    onChatHistoryUpdate?.(chatHistory)
  }, [chatHistory, onChatHistoryUpdate])

  const addChatMessage = (role: 'user' | 'assistant', content: string, codeChanges?: CodeChange[]) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      codeChanges
    }
    setChatHistory(prev => [...prev, newMessage])
  }

  const extractCodeFromMDX = (mdxContent: string): string => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
    const matches = mdxContent.match(codeBlockRegex)
    if (matches && matches.length > 0) {
      // Remove the markdown code block syntax and return the code
      return matches[0].replace(/```[\w]*\n/, '').replace(/```$/, '')
    }
    return mdxContent
  }

  const handleSubmit = async () => {
    if (!prompt) return

    setIsLoading(true)
    addChatMessage('user', prompt)

    try {
      const response = await axios.post('http://localhost:8000/generate-code', {
        prompt,
        model_id: modelId,
        language,
        file_path: currentFile?.path,
      })

      const generatedCode = extractCodeFromMDX(response.data.code)
      setCode(generatedCode)
      setOriginalCode(generatedCode)
      onCodeGenerate(generatedCode)
      setPrompt('')

      const codeChanges: CodeChange[] = []

      if (currentFile) {
        try {
          await axios.put(`http://localhost:8000/files/${encodeURIComponent(currentFile.path)}`, {
            content: generatedCode,
          })
          codeChanges.push({
            filePath: currentFile.path,
            content: generatedCode,
            language: currentFile.language,
            type: 'update',
            timestamp: new Date()
          })
          toast({
            title: 'Success',
            description: 'File updated successfully',
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
        } catch (error) {
          console.error('Failed to update file:', error)
          toast({
            title: 'Error',
            description: 'Failed to update file',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      }

      addChatMessage('assistant', response.data.code, codeChanges)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate code. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditorChange = async (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
      if (currentFile) {
        try {
          await axios.put(`http://localhost:8000/files/${encodeURIComponent(currentFile.path)}`, {
            content: value,
          })
        } catch (error) {
          console.error('Failed to update file:', error)
        }
      }
    }
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column" position="relative">
      {/* Header */}
      <Flex 
        p={4} 
        borderBottom="1px" 
        borderColor="gray.700" 
        bg="gray.800"
        justify="space-between"
        align="center"
      >
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle sidebar"
            icon={<FaBars />}
            variant="ghost"
            onClick={onToggleExplorer}
            color="gray.400"
            _hover={{ color: 'blue.400' }}
          />
          <HStack spacing={2}>
            <Icon as={FaCode} color="blue.400" />
            <Text fontSize="md" fontWeight="medium" color="gray.300">
              {currentFile ? currentFile.path : 'New Chat'}
            </Text>
            {currentFile && (
              <Badge colorScheme="blue" variant="subtle">
                {currentFile.language}
              </Badge>
            )}
          </HStack>
        </HStack>
        <HStack spacing={4}>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="AI Model Settings"
              icon={<FaCog />}
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'blue.400' }}
            />
            <MenuList bg="gray.800" borderColor="gray.700">
              <Box px={4} py={2}>
                <Text fontSize="sm" color="gray.400" mb={2}>AI Model</Text>
                <ChakraSelect 
                  value={modelId} 
                  onChange={(e) => setModelId(e.target.value)}
                  size="sm"
                  bg="gray.700"
                  borderColor="gray.600"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </ChakraSelect>
              </Box>
              <Divider borderColor="gray.700" />
              <MenuItem 
                icon={<FaRegLightbulb />} 
                command="⌘P"
                bg="gray.800"
                _hover={{ bg: 'gray.700' }}
              >
                Quick Suggestions
              </MenuItem>
              <MenuItem 
                icon={<FaRegKeyboard />} 
                command="⌘K"
                bg="gray.800"
                _hover={{ bg: 'gray.700' }}
              >
                Keyboard Shortcuts
              </MenuItem>
            </MenuList>
          </Menu>
          <Tooltip label={showPreview ? "Show Editor" : "Show Preview"}>
            <IconButton
              aria-label="Toggle preview"
              icon={showPreview ? <FaCode /> : <FaEye />}
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'blue.400' }}
              onClick={() => setShowPreview(!showPreview)}
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Editor Panel */}
        <Box 
          flex={1} 
          overflow="auto" 
          position="relative"
          borderRight="1px"
          borderColor="gray.700"
        >
          {code ? (
            <Box position="relative" height="calc(100vh - 180px)" m={4}>
              <HStack 
                position="absolute" 
                top={2} 
                right={2} 
                zIndex={1}
                bg="gray.800"
                p={2}
                borderRadius="md"
                spacing={2}
                boxShadow="md"
              >
                <Tooltip label="Copy Code">
                  <IconButton
                    aria-label="Copy code"
                    icon={<FaCopy />}
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: 'blue.400' }}
                    onClick={() => {
                      navigator.clipboard.writeText(code)
                      toast({
                        title: 'Copied!',
                        status: 'success',
                        duration: 2000,
                      })
                    }}
                  />
                </Tooltip>
                <Tooltip label="Reset Changes">
                  <IconButton
                    aria-label="Reset changes"
                    icon={<FaUndo />}
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: 'blue.400' }}
                    isDisabled={code === originalCode}
                    onClick={() => setCode(originalCode)}
                  />
                </Tooltip>
              </HStack>
              {showPreview ? (
                <MDXPreview content={code} />
              ) : (
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                  }}
                  onChange={handleEditorChange}
                />
              )}
            </Box>
          ) : (
            <Flex 
              height="100%" 
              align="center" 
              justify="center" 
              direction="column"
              color="gray.500"
              p={8}
            >
              <Icon as={FaCode} fontSize="6xl" mb={4} />
              <Text fontSize="lg" mb={2}>No File Selected</Text>
              <Text fontSize="sm" textAlign="center" maxW="md">
                Select a file from the project explorer or start a conversation with the AI assistant to generate code.
              </Text>
            </Flex>
          )}
        </Box>

        {/* Chat Panel - Always Visible */}
        <Box 
          w="400px" 
          bg="gray.800"
          display="flex"
          flexDirection="column"
        >
          {/* Chat Header */}
          <Flex 
            p={4} 
            borderBottom="1px" 
            borderColor="gray.700"
            align="center"
            justify="space-between"
          >
            <HStack>
              <Icon as={FaRobot} color="blue.400" />
              <Text fontWeight="medium" color="gray.300">AI Assistant</Text>
            </HStack>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="AI Model Settings"
                icon={<FaCog />}
                variant="ghost"
                size="sm"
                color="gray.400"
                _hover={{ color: 'blue.400' }}
              />
              <MenuList bg="gray.800" borderColor="gray.700">
                <Box px={4} py={2}>
                  <Text fontSize="sm" color="gray.400" mb={2}>AI Model</Text>
                  <ChakraSelect 
                    value={modelId} 
                    onChange={(e) => setModelId(e.target.value)}
                    size="sm"
                    bg="gray.700"
                    borderColor="gray.600"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </ChakraSelect>
                </Box>
              </MenuList>
            </Menu>
          </Flex>

          {/* Chat Messages */}
          <Box flex={1} overflowY="auto" p={4}>
            {chatHistory.length === 0 ? (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                py={8}
                color="gray.500"
              >
                <Icon as={FaRobot} fontSize="3xl" mb={4} />
                <Text fontSize="sm">No messages yet</Text>
                <Text fontSize="xs" mt={2} textAlign="center">
                  Start a conversation with the AI assistant
                </Text>
              </Flex>
            ) : (
              <VStack align="stretch" spacing={4}>
                {chatHistory.map((message) => (
                  <Box
                    key={message.id}
                    bg={message.role === 'assistant' ? 'gray.700' : 'blue.500'}
                    p={3}
                    borderRadius="md"
                    position="relative"
                  >
                    <HStack spacing={2} mb={1}>
                      <Icon 
                        as={message.role === 'assistant' ? FaRobot : FaRegKeyboard} 
                        color={message.role === 'assistant' ? 'blue.300' : 'white'}
                        fontSize="xs"
                      />
                      <Text fontSize="xs" color={message.role === 'assistant' ? 'gray.300' : 'white'}>
                        {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                      </Text>
                      <Text fontSize="xs" color={message.role === 'assistant' ? 'gray.400' : 'whiteAlpha.700'} ml="auto">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={message.role === 'assistant' ? 'gray.100' : 'white'}>
                      {message.content.includes('```') ? (
                        <Box>
                          <Text mb={2}>Generated code:</Text>
                          <Box
                            bg="gray.800"
                            p={2}
                            borderRadius="md"
                            fontSize="xs"
                            fontFamily="monospace"
                          >
                            {message.content.replace(/```[\w]*\n|```/g, '')}
                          </Box>
                        </Box>
                      ) : (
                        message.content
                      )}
                    </Text>
                    {message.codeChanges && message.codeChanges.length > 0 && (
                      <VStack align="stretch" mt={2} spacing={1}>
                        {message.codeChanges.map((change, index) => (
                          <HStack 
                            key={index}
                            fontSize="xs"
                            color="gray.400"
                            bg="gray.800"
                            p={1}
                            borderRadius="sm"
                            cursor="pointer"
                            _hover={{ bg: 'gray.600' }}
                            onClick={() => {
                              // Handle clicking on a code change
                              if (currentFile?.path !== change.filePath) {
                                onFileSelect({
                                  path: change.filePath,
                                  content: change.content,
                                  language: change.language,
                                })
                              }
                            }}
                          >
                            <Icon 
                              as={change.type === 'create' ? FaPlus : change.type === 'delete' ? FaTrash : FaPencilAlt}
                              color={change.type === 'create' ? 'green.300' : change.type === 'delete' ? 'red.300' : 'blue.300'}
                            />
                            <Text flex={1} isTruncated>{change.filePath}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Chat Input */}
          <Box 
            p={4} 
            borderTop="1px" 
            borderColor="gray.700"
            bg="gray.900"
            position="sticky"
            bottom={0}
            width="100%"
            boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
          >
            <VStack spacing={3}>
              <HStack width="100%" spacing={2}>
                <Text fontSize="sm" color="gray.400">Current Model:</Text>
                <ChakraSelect 
                  value={modelId} 
                  onChange={(e) => setModelId(e.target.value)}
                  size="sm"
                  width="auto"
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'blue.400' }}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </ChakraSelect>
              </HStack>
              <HStack width="100%" spacing={2}>
                <Box flex={1} position="relative">
                  <Textarea
                    placeholder="Type your prompt here... (e.g., 'Create a React component for a login form')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    bg="gray.700"
                    border="2px"
                    borderColor="gray.600"
                    _hover={{ borderColor: 'gray.500' }}
                    _focus={{ borderColor: 'blue.400', ring: 0 }}
                    rows={2}
                    resize="none"
                    maxH="200px"
                    overflow="auto"
                    fontSize="md"
                    pl={4}
                    pr={10}
                    py={3}
                    borderRadius="lg"
                    spellCheck="false"
                    sx={{
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        bg: 'gray.800',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bg: 'gray.600',
                        borderRadius: '8px',
                      },
                    }}
                  />
                  <Icon
                    as={FaRobot}
                    position="absolute"
                    right={3}
                    bottom={3}
                    color="blue.400"
                    fontSize="lg"
                  />
                </Box>
                <VStack spacing={2}>
                  <Tooltip label="Send Message (Enter)" placement="left">
                    <IconButton
                      aria-label="Send"
                      icon={<FaPaperPlane />}
                      colorScheme="blue"
                      isLoading={isLoading}
                      onClick={handleSubmit}
                      isDisabled={!prompt.trim()}
                      size="lg"
                      fontSize="xl"
                      borderRadius="lg"
                      height="100%"
                    />
                  </Tooltip>
                </VStack>
              </HStack>
              <HStack width="100%" justify="space-between" px={1}>
                <Text fontSize="xs" color="gray.500">
                  Press Enter to send, Shift + Enter for new line
                </Text>
                {currentFile && (
                  <Text fontSize="xs" color="gray.500">
                    Current file: {currentFile.path}
                  </Text>
                )}
              </HStack>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}

export default ChatInterface 