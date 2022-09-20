import { createTheme } from '@mui/material'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    flat: true
    gradient: true
  }
}

const colorTheme = createTheme({
  palette: {
    mode: 'dark',
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
    action: {
      active: '#FE3477',
      hover: '#FE3477',
      hoverOpacity: 0.7,
      focus: '#FE3477',
      focusOpacity: 1,
      selected: '#FE3477',
      selectedOpacity: 1
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
    lineHeight: '150%',
    h3: {
      color: colorTheme.palette.text.secondary,
      fontWeight: 500,
      fontSize: '1.25rem'
    },
    h4: {
      color: colorTheme.palette.text.primary,
      fontWeight: 700,
      fontSize: '1rem'
    },
    button: {
      fontWeight: 600,
      fontSize: '0.938rem',
      lineHeight: '1.125rem',
      color: 'red'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxSizing: 'border-box',
          color: colorTheme.palette.primary.light,
          borderRadius: '0.5rem',
          padding: '0.75rem 1.25rem',
          textTransform: 'none',
          fontStyle: 'normal',
          fontWeight: 500,
          fontSize: '1rem',
          lineHeight: '1.188rem',
          height: '3.5rem',
          '&.Mui-disabled': {
            opacity: 0.5,
            color: '#F5F5FD'
          }
        }
      },
      variants: [
        {
          props: { variant: 'flat' },
          style: {
            background:
              'linear-gradient(92.29deg, rgba(254, 52, 119, 0.8) 0%, rgba(240, 1, 79, 0.8) 100%)',
            boxShadow: '0rem 0.063rem 0.125rem rgba(16, 24, 40, 0.05)'
          }
        },
        {
          props: { variant: 'gradient' },
          style: {
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.secondary.dark} 120.29%)`,
            border: `0.063rem solid ${colorTheme.palette.secondary.main}`
          }
        },
        /* {
          props: { variant: 'text' },
          style: {
            background: 'rgb(236,38,104, 0.2)',
            height: '0.938rem',
            color: colorTheme.palette.secondary.light,
            padding: '0.188rem 0rem',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            lineHeight: '0.938rem',
            '&:hover': {
              background: 'rgb(236,38,104, 0.4)'
            }
          }
        } */
      ]
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colorTheme.palette.text.primary
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#191B1F',
          borderRadius: '0.75rem',
          color: colorTheme.palette.primary.light
        }
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            background: colorTheme.palette.primary.main,
            border: '0.063rem solid #3A3A3C',
            borderRadius: '0.5rem'
          }
        }
      ]
    },
    /*     MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          lineHeight: '150%',
          color: colorTheme.palette.primary.light
        }
      }
    }, */
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: '160%',
          color: colorTheme.palette.primary.light,
        },
        icon: {
          color: '#FFFFFF'
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: '160%',
          color: colorTheme.palette.primary.light,
          opacity: 0.5,
        }
      }
    }
    /* MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: colorTheme.palette.action.hover,
            background: 'transparent'
          }
        }
      }
    } */
  }
})

export default theme
