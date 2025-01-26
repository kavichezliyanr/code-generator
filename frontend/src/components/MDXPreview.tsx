import { Box, useColorModeValue } from '@chakra-ui/react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MDXPreviewProps {
  content: string
}

interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

const MDXPreview = ({ content }: MDXPreviewProps) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'gray.100')

  return (
    <Box
      p={6}
      bg={bgColor}
      color={textColor}
      borderRadius="md"
      overflow="auto"
      height="100%"
      sx={{
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-of-type': { mb: 0 },
        '& p': { mb: 4 },
        '& h1': { fontSize: '2xl', fontWeight: 'bold', mb: 4 },
        '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 3 },
        '& h3': { fontSize: 'lg', fontWeight: 'bold', mb: 2 },
        '& pre': { my: 4 },
        '& code': {
          px: 1,
          bg: 'gray.700',
          color: 'blue.300',
          borderRadius: 'sm',
          fontSize: '0.875em',
        },
        '& pre code': {
          p: 0,
          bg: 'transparent',
          color: 'inherit',
        },
      }}
    >
      <ReactMarkdown
        components={{
          code: ({ node, inline, className, children, ...props }: CodeProps) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  background: '#1E1E1E',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  )
}

export default MDXPreview 