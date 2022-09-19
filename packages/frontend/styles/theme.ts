import { createTheme } from '@mui/material'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    flat: true
    gradient: true
  }
}

let colorTheme = createTheme({
  palette: {
    primary: {
      light: '#E2E8F0',
      main: '#222429',
      dark: '#191B1F'
    },
    secondary: {
      light: '#EC2668',
      main: '#FE3477',
      dark: '#F0014F'
    },
    text: {
      primary: '#E8E8E8',
      secondary: '#E2E8F0',
      disabled: '#787883'
    },
    success: {
      main: '#50FE34'
    },
    warning: {
      main: '#F5AC37'
    }
  }
})

const theme = createTheme(colorTheme, {
  typography: {
    fontFamily: 'Inter',
    lineHeight: '150%',
    h3: {
      color: colorTheme.palette.text.secondary,
      fontWeight: 500,
      fontSize: '20px'
    },
    h4: {
      color: colorTheme.palette.text.primary,
      fontWeight: 700,
      fontSize: '16px'
    },
    button: {
      fontWeight: 600,
      fontSize: '15px',
      lineHeight: '18px',
      color: 'red'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxSizing: 'border-box',
          color: colorTheme.palette.primary.light,
          borderRadius: '8px',
          padding: '12px 20px',
          textTransform: 'none',
          fontStyle: 'normal',
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '19px'
        },
        disabled: {
          opacity: 0.5
        }
      },
      variants: [
        {
          props: { variant: 'flat' },
          style: {
            background:
              'linear-gradient(92.29deg, rgba(254, 52, 119, 0.8) 0%, rgba(240, 1, 79, 0.8) 100%)',
            boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)'
          }
        },
        {
          props: { variant: 'gradient' },
          style: {
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.secondary.dark} 120.29%)`,
            border: `1px solid ${colorTheme.palette.secondary.main}`
          }
        }
      ]
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colorTheme.palette.text.primary,
          fontSize: '2px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#191B1F',
          borderRadius: '12px',
          color: colorTheme.palette.primary.light
        }
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            background: colorTheme.palette.primary.main,
            border: '1px solid #3A3A3C',
            borderRadius: '8px'
          }
        }
      ]
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '20px',
          lineHeight: '150%',
          color: colorTheme.palette.primary.light
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderWidth: 0,
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '150%',
          color: colorTheme.palette.primary.light
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '150%',
          color: colorTheme.palette.primary.light,
          opacity: 0.5
        }
      }
    }
  }
})

export default theme
