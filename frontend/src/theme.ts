import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  colors: {
    gray: {
      900: '#1a1b26',
      800: '#1f2937',
      700: '#374151',
      600: '#4b5563',
      500: '#6b7280',
      400: '#9ca3af',
      300: '#d1d5db',
      200: '#e5e7eb',
      100: '#f3f4f6',
      50: '#f9fafb',
    },
    blue: {
      500: '#3b82f6',
      400: '#60a5fa',
      300: '#93c5fd',
    },
    purple: {
      500: '#8b5cf6',
      400: '#a78bfa',
      300: '#c4b5fd',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
          _active: {
            bg: 'blue.700',
          },
        },
        ghost: {
          _hover: {
            bg: 'gray.700',
          },
        },
      },
    },
    IconButton: {
      baseStyle: {
        borderRadius: 'md',
      },
      variants: {
        ghost: {
          _hover: {
            bg: 'gray.700',
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'gray.700',
            _hover: {
              bg: 'gray.600',
            },
            _focus: {
              bg: 'gray.600',
              borderColor: 'blue.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Textarea: {
      variants: {
        filled: {
          bg: 'gray.700',
          _hover: {
            bg: 'gray.600',
          },
          _focus: {
            bg: 'gray.600',
            borderColor: 'blue.500',
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'gray.800',
          borderColor: 'gray.700',
          boxShadow: 'lg',
        },
        item: {
          bg: 'gray.800',
          _hover: {
            bg: 'gray.700',
          },
          _focus: {
            bg: 'gray.700',
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'gray.800',
          borderRadius: 'md',
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'gray.700',
        color: 'white',
        fontSize: 'sm',
      },
    },
    Badge: {
      variants: {
        subtle: {
          bg: 'blue.900',
          color: 'blue.200',
        },
      },
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  shadows: {
    outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  },
})

export default theme 