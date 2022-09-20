import React from 'react'
import { Button, CircularProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'

import { colorTheme } from '../styles/theme'

export default function Theming () {
  return (
    <>
      <Typography variant='h2'>Buttons</Typography>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Button variant='primary' sx={{width: '23em'}}>Primary flat</Button>
        <Button variant='primary' sx={{width: '23em'}} startIcon={<CircularProgress size={15} />}>
          Primary flat Loading
        </Button>
        <Button variant='primary' sx={{width: '23em'}} disabled>
          Primary flat disabled
        </Button>
      </div>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Button variant='secondary' sx={{width: '23em'}}>Secondary</Button>
      </div>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Button variant='secondary2' sx={{width: '23em'}}>Secondary 2</Button>
        <Button variant='secondary2' sx={{width: '23em'}} startIcon={<CircularProgress size={15} />}>
          Secondary 2 Loading
        </Button>
      </div>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Button variant='ghost' sx={{width: '23em'}}>Ghost</Button>
        <Button variant='ghost' sx={{width: '23em'}} startIcon={<CircularProgress size={15} />}>
          Ghost Loading
        </Button>
        <Button variant='ghost' sx={{width: '23em'}} disabled>
          Ghost disabled
        </Button>
      </div>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Button variant='gradient' sx={{width: '23em'}}>Gradient</Button>
        <Button variant='gradient' sx={{width: '23em'}} startIcon={<CircularProgress size={15} />}>
          Gradient Loading
        </Button>
        <Button variant='gradient' sx={{width: '23em'}} disabled>
          Gradient disabled
        </Button>
      </div>
      <br />
      <br />

      <Typography variant='h2'>Typography</Typography>
      <br />
      <br />

      <Typography variant='h4'>Headings</Typography>
      <br />
      <br />
      <Typography variant='display1'>Welcome to Fuji - Display 1</Typography>
      <br />
      <Typography variant='display2'>Welcome to Fuji - Display 2</Typography>
      <br />
      <Typography variant='h1'>Welcome to Fuji - Title 1</Typography>
      <br />
      <Typography variant='h2'>Welcome to Fuji - Title 2</Typography>
      <br />
      <Typography variant='h3'>Welcome to Fuji - Title 4</Typography>
      <br />
      <Typography variant='h4'>Welcome to Fuji - Title 4</Typography>
      <br />
      <Typography variant='h5'>Welcome to Fuji - Title 5</Typography>
      <br />
      <Typography variant='h6'>Welcome to Fuji - Title 6</Typography>
      <br />
      <br />
      <Typography variant='h4'>Body</Typography>
      <br />
      <br />
      <Typography variant='body'>Welcome to Fuji - Body</Typography>
      <br />
      <Typography variant='small'>Welcome to Fuji - Small</Typography>
      <br />
      <Typography variant='xsmall'>Welcome to Fuji - xSmall</Typography>
      <br />
      <br />
      <Typography variant='h4'>Labels</Typography>
      <br />
      <br />
      <Typography variant='label'>Welcome to Fuji - Label</Typography>
      <br />
      <br />

      <Typography variant='h2'>Colors</Typography>
      <br />
      <br />
      <Typography variant='h4'>Primary</Typography>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'primary.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Brand
        </Box>
        <Box
          sx={{
            background: `linear-gradient(92.29deg, ${colorTheme.palette.primary.light} 0%, ${colorTheme.palette.primary.dark} 100%)`,
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Gradient 1
        </Box>

        <Box
          sx={{
            background: `linear-gradient(287.45deg,  ${colorTheme.palette.primary.contrastText} 0%,  ${colorTheme.palette.primary.dark} 100%)`,
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Gradient 2
        </Box>
      </div>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'text.primary',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Main text
        </Box>
        <Box
          sx={{
            backgroundColor: 'text.secondary',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Sub text
        </Box>
        <Box
          sx={{
            backgroundColor: 'info.dark',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Sub text 2
        </Box>
        <Box
          sx={{
            backgroundColor: 'info.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Description text
        </Box>
        <Box
          sx={{
            backgroundColor: 'text.disabled',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Inactive text
        </Box>
      </div>
      <br />
      <br />
      <Typography variant='h4'>Secondary // Backgrounds</Typography>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'secondary.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Grey
        </Box>
        <Box
          sx={{
            backgroundColor: 'secondary.dark',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Dark Grey
        </Box>
        <Box
          sx={{
            backgroundColor: 'secondary.contrastText',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Black
        </Box>
        <Box
          sx={{
            backgroundColor: 'secondary.light',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'white',
            padding: '1rem'
          }}
        >
          Grey Border
        </Box>
      </div>
      <br />
      <br />
      <Typography variant='h4'>Status</Typography>
      <br />
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'success.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Success
        </Box>
        <Box
          sx={{
            backgroundColor: 'error.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Fail
        </Box>
        <Box
          sx={{
            backgroundColor: 'warning.main',
            width: 150,
            height: 100,
            borderRadius: '1rem',
            color: 'black',
            padding: '1rem'
          }}
        >
          Borrow interest
        </Box>
      </div>
    </>
  )
}
