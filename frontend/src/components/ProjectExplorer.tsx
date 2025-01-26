import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Input,
  Tooltip,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Button,
  Collapse,
  Flex,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react'
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPlus,
  FaTrash,
  FaTimes,
  FaCode,
  FaHistory,
  FaCheck,
  FaPencilAlt,
  FaUndo,
  FaEye,
  FaSearch,
  FaExchangeAlt,
  FaComment,
} from 'react-icons/fa'
import axios from 'axios'
import { ChatMessage, CodeChange } from '../types/chat'

interface FileNode {
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string
  path: string
}

interface ProjectExplorerProps {
  onFileSelect: (file: { path: string; content: string; language: string }) => void
  onClose: () => void
  chatHistory?: ChatMessage[]
}

const ProjectExplorer = ({ onFileSelect, onClose, chatHistory = [] }: ProjectExplorerProps) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState(0)
  const [selectedChange, setSelectedChange] = useState<CodeChange | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const { isOpen: isMessageOpen, onOpen: onMessageOpen, onClose: onMessageClose } = useDisclosure()
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [originalCode, setOriginalCode] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchFileTree()
  }, [])

  useEffect(() => {
    const fetchOriginalContent = async () => {
      if (selectedChange) {
        try {
          const response = await axios.get(`http://localhost:8000/files/${encodeURIComponent(selectedChange.filePath)}`)
          setOriginalCode(response.data.content)
        } catch (error) {
          console.error('Failed to fetch original content:', error)
          setOriginalCode('')
        }
      }
    }
    fetchOriginalContent()
  }, [selectedChange])

  const fetchFileTree = async () => {
    try {
      const response = await axios.get('http://localhost:8000/files')
      setFileTree(response.data.files)
    } catch (error) {
      console.error('Failed to fetch file tree:', error)
    }
  }

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'directory') {
      const newExpandedFolders = new Set(expandedFolders)
      if (expandedFolders.has(file.path)) {
        newExpandedFolders.delete(file.path)
      } else {
        newExpandedFolders.add(file.path)
      }
      setExpandedFolders(newExpandedFolders)
      return
    }

    setSelectedFile(file.path)
    try {
      const response = await axios.get(`http://localhost:8000/files/${encodeURIComponent(file.path)}`)
      const language = getLanguageFromFileName(file.name)
      onFileSelect({
        path: file.path,
        content: response.data.content,
        language,
      })
    } catch (error) {
      console.error('Failed to fetch file content:', error)
    }
  }

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'md':
      case 'mdx':
        return 'markdown'
      default:
        return 'plaintext'
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName) return

    try {
      await axios.post('http://localhost:8000/files', {
        path: newFileName,
        content: '',
      })
      setNewFileName('')
      setIsCreatingFile(false)
      fetchFileTree()
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  const handleDeleteFile = async (file: FileNode, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await axios.delete(`http://localhost:8000/files/${encodeURIComponent(file.path)}`)
      fetchFileTree()
      if (selectedFile === file.path) {
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const handleApplyChange = async (change: CodeChange) => {
    try {
      await axios.put(`http://localhost:8000/files/${encodeURIComponent(change.filePath)}`, {
        content: change.content,
      })
      
      // Update the file tree
      await fetchFileTree()
      
      // If this is the currently selected file, update its content
      if (selectedFile === change.filePath) {
        onFileSelect({
          path: change.filePath,
          content: change.content,
          language: getLanguageFromFileName(change.filePath),
        })
      }
      
      // Show success feedback
      toast({
        title: 'Changes Applied',
        description: `Successfully updated ${change.filePath}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      setSelectedChange(null)
      setShowPreview(false)
    } catch (error) {
      console.error('Failed to apply change:', error)
      toast({
        title: 'Error',
        description: 'Failed to apply changes. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleRevertChange = async (change: CodeChange) => {
    try {
      const response = await axios.get(`http://localhost:8000/files/${encodeURIComponent(change.filePath)}`)
      const originalContent = response.data.content
      
      await axios.put(`http://localhost:8000/files/${encodeURIComponent(change.filePath)}`, {
        content: originalContent,
      })
      
      // Update the file tree
      await fetchFileTree()
      
      // If this is the currently selected file, update its content
      if (selectedFile === change.filePath) {
        onFileSelect({
          path: change.filePath,
          content: originalContent,
          language: getLanguageFromFileName(change.filePath),
        })
      }
      
      // Show success feedback
      toast({
        title: 'Changes Reverted',
        description: `Successfully reverted ${change.filePath}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      setSelectedChange(null)
      setShowPreview(false)
    } catch (error) {
      console.error('Failed to revert change:', error)
      toast({
        title: 'Error',
        description: 'Failed to revert changes. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const filterFiles = (nodes: FileNode[]): FileNode[] => {
    return nodes.reduce<FileNode[]>((filtered, node) => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        filtered.push(node)
      } else if (node.type === 'directory' && node.children) {
        const filteredChildren = filterFiles(node.children)
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren })
        }
      }
      return filtered
    }, [])
  }

  const findMessageForChange = (change: CodeChange): ChatMessage | null => {
    return chatHistory.find(msg => 
      msg.codeChanges?.some(c => 
        c.filePath === change.filePath && 
        c.timestamp.getTime() === change.timestamp.getTime()
      )
    ) || null
  }

  const renderDiff = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const diff: JSX.Element[] = []

    let i = 0
    let j = 0

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        diff.push(
          <Text key={`same-${i}`} fontSize="sm" color="gray.400">
            {oldLines[i]}
          </Text>
        )
        i++
        j++
      } else {
        if (i < oldLines.length) {
          diff.push(
            <Text key={`removed-${i}`} fontSize="sm" color="red.400" bg="red.900" px={1}>
              - {oldLines[i]}
            </Text>
          )
          i++
        }
        if (j < newLines.length) {
          diff.push(
            <Text key={`added-${j}`} fontSize="sm" color="green.400" bg="green.900" px={1}>
              + {newLines[j]}
            </Text>
          )
          j++
        }
      }
    }

    return diff
  }

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => (
      <VStack key={node.path} align="stretch" ml={level * 4}>
        <HStack
          py={1}
          px={2}
          cursor="pointer"
          borderRadius="md"
          bg={selectedFile === node.path ? 'gray.700' : 'transparent'}
          _hover={{ bg: selectedFile === node.path ? 'gray.700' : 'gray.700' }}
          onClick={() => handleFileClick(node)}
        >
          <Icon
            as={node.type === 'directory' ? (expandedFolders.has(node.path) ? FaFolderOpen : FaFolder) : FaFile}
            color={node.type === 'directory' ? 'yellow.300' : 'blue.300'}
          />
          <Text flex={1} fontSize="sm">{node.name}</Text>
          {node.type === 'file' && (
            <IconButton
              aria-label="Delete file"
              icon={<FaTrash />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              opacity={0}
              _groupHover={{ opacity: 1 }}
              onClick={(e) => handleDeleteFile(node, e)}
            />
          )}
        </HStack>
        {node.type === 'directory' && expandedFolders.has(node.path) && node.children && (
          <Box>
            {renderFileTree(node.children, level + 1)}
          </Box>
        )}
      </VStack>
    ))
  }

  const renderCodeChanges = () => {
    const allChanges = chatHistory
      .filter(msg => msg.codeChanges && msg.codeChanges.length > 0)
      .flatMap(msg => msg.codeChanges || [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (allChanges.length === 0) {
      return (
        <Box p={4} textAlign="center" color="gray.500">
          <Text>No code changes yet</Text>
        </Box>
      )
    }

    return (
      <VStack align="stretch" spacing={2} p={2}>
        {allChanges.map((change, index) => (
          <Box key={index}>
            <Box
              p={2}
              borderRadius="md"
              bg="gray.700"
              cursor="pointer"
              onClick={() => {
                setSelectedChange(selectedChange?.filePath === change.filePath ? null : change)
                setShowPreview(true)
              }}
              _hover={{ bg: 'gray.600' }}
            >
              <HStack spacing={2} mb={1}>
                <Icon 
                  as={change.type === 'create' ? FaPlus : change.type === 'delete' ? FaTrash : FaPencilAlt}
                  color={change.type === 'create' ? 'green.300' : change.type === 'delete' ? 'red.300' : 'blue.300'}
                />
                <Text fontSize="sm" flex={1}>{change.filePath}</Text>
                <Badge
                  colorScheme={change.type === 'create' ? 'green' : change.type === 'delete' ? 'red' : 'blue'}
                  fontSize="xs"
                >
                  {change.type}
                </Badge>
                <Tooltip label="View Chat Message">
                  <IconButton
                    aria-label="View message"
                    icon={<FaComment />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      const message = findMessageForChange(change)
                      if (message) {
                        setSelectedMessage(message)
                        onMessageOpen()
                      }
                    }}
                  />
                </Tooltip>
              </HStack>
              <Text fontSize="xs" color="gray.400">
                {new Date(change.timestamp).toLocaleString()}
              </Text>
            </Box>
            <Collapse in={selectedChange?.filePath === change.filePath}>
              <Box 
                mt={2} 
                p={2} 
                bg="gray.800" 
                borderRadius="md"
                borderLeft="4px"
                borderColor="blue.400"
              >
                <HStack mb={2} justify="space-between">
                  <Text fontSize="sm" fontWeight="bold">Preview Changes</Text>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Toggle diff view"
                      icon={<FaExchangeAlt />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDiff(!showDiff)}
                    />
                    <IconButton
                      aria-label="Toggle preview"
                      icon={<FaEye />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview(!showPreview)}
                    />
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FaCheck />}
                      onClick={() => handleApplyChange(change)}
                      isDisabled={!change.content}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FaUndo />}
                      onClick={() => handleRevertChange(change)}
                      isDisabled={!change.content}
                    >
                      Revert
                    </Button>
                  </HStack>
                </HStack>
                {showPreview && (
                  <Box
                    maxH="300px"
                    overflowY="auto"
                    p={2}
                    bg="gray.900"
                    borderRadius="md"
                    fontFamily="monospace"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {showDiff ? (
                      renderDiff(originalCode, change.content)
                    ) : (
                      change.content
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        ))}
      </VStack>
    )
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <HStack p={4} justify="space-between" borderBottom="1px" borderColor="gray.700">
        <HStack>
          <Icon as={FaCode} color="blue.400" boxSize={5} />
          <Text fontWeight="bold" fontSize="lg">Project</Text>
        </HStack>
        <HStack spacing={2}>
          <Tooltip label="New File">
            <IconButton
              aria-label="New file"
              icon={<FaPlus />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={() => setIsCreatingFile(true)}
            />
          </Tooltip>
          <Tooltip label="Close Sidebar">
            <IconButton
              aria-label="Close sidebar"
              icon={<FaTimes />}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </Tooltip>
        </HStack>
      </HStack>

      <Box p={2}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="gray.700"
            border="none"
            _focus={{ ring: 1, ringColor: 'blue.500' }}
          />
        </InputGroup>
      </Box>

      <Tabs 
        isFitted 
        variant="enclosed" 
        onChange={setActiveTab} 
        index={activeTab}
        borderBottom="1px"
        borderColor="gray.700"
      >
        <TabList>
          <Tab 
            _selected={{ color: 'blue.400', borderColor: 'blue.400' }}
            _hover={{ bg: 'gray.700' }}
          >
            <Icon as={FaFolder} mr={2} />
            Files
          </Tab>
          <Tab 
            _selected={{ color: 'blue.400', borderColor: 'blue.400' }}
            _hover={{ bg: 'gray.700' }}
          >
            <Icon as={FaHistory} mr={2} />
            Changes
          </Tab>
        </TabList>
      </Tabs>

      <Box flex={1} overflowY="auto">
        {activeTab === 0 ? (
          <Box py={2}>
            {isCreatingFile && (
              <Box px={4} mb={2}>
                <Input
                  placeholder="filename.ext"
                  size="sm"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                  bg="gray.700"
                  border="none"
                  _focus={{ ring: 1, ringColor: 'blue.500' }}
                />
              </Box>
            )}
            <VStack align="stretch" spacing={0}>
              {renderFileTree(searchQuery ? filterFiles(fileTree) : fileTree)}
            </VStack>
          </Box>
        ) : (
          renderCodeChanges()
        )}
      </Box>

      <Modal isOpen={isMessageOpen} onClose={onMessageClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader>Chat Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.400">
                  {selectedMessage?.role === 'user' ? 'You' : 'Assistant'}
                </Text>
                <Box
                  mt={1}
                  p={3}
                  bg="gray.700"
                  borderRadius="md"
                  fontSize="sm"
                >
                  {selectedMessage?.content}
                </Box>
              </Box>
              <Text fontSize="xs" color="gray.500">
                {selectedMessage?.timestamp.toLocaleString()}
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ProjectExplorer 