import { createTheme } from '@mui/material'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true
    secondary: true
    secondary2: true
    ghost: true
    gradient: true
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    currency: true
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    display1: true
    display2: true
    body: true
    body2: true
    small: true
    smallDark: true
    xsmall: true
    label: true
    regularH4: true
  }
}

const colorTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F6145E',
      light: '#FE3477',
      dark: '#F0014F',
      contrastText: 'rgba(254, 52, 119, 0)'
    },
    secondary: {
      main: '#2D2F35',
      light: '#3B404A',
      dark: '#222429',
      contrastText: '#191B1F'
    },
    text: {
      primary: '#E8E8E8',
      secondary: '#E2E8F0',
      disabled: '#6C7182'
    },
    info: {
      main: '#C3C5CB',
      dark: '#787883'
    },
    success: {
      main: '#42FF00'
    },
    warning: {
      main: '#F5AC37'
    },
    error: {
      main: '#FD4040'
    },
    background: {
      paper: 'black',
      default: '#2D2F35'
    }
  }
})

const theme = createTheme(colorTheme, {
  typography: {
    letterSpacing: '0%',
    display1: {
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: '120%'
    },
    display2: {
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: '120%'
    },
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: '120%'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: '150%'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: '150%'
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: '150%'
    },
    regularH4: {
      display: 'block',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: '120%'
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      lineHeight: '150%'
    },
    h6: {
      fontWeight: 400,
      fontSize: '1.125rem',
      lineHeight: '160%'
    },
    body: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '160%'
    },
    body2: {
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: '160%'
    },
    small: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: '160%'
    },
    smallDark: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: '160%',
      color: colorTheme.palette.info.dark
    },
    xsmall: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: '160%'
    },
    label: {
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: '100%',
      letterSpacing: '2%'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxSizing: 'border-box',
          borderRadius: '0.5rem',
          '&.Mui-disabled': {
            opacity: 0.5,
            color: colorTheme.palette.text.secondary
          },
          '&:hover': {
            opacity: 0.9,
            borderColor: colorTheme.palette.primary
          }
        }
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            background:
              'linear-gradient(92.29deg, rgba(254, 52, 119, 0.8) 0%, rgba(240, 1, 79, 0.8) 100%)',
            boxShadow: '0rem 0.063rem 0.125rem rgba(16, 24, 40, 0.05)'
          }
        },
        {
          props: { variant: 'secondary' },
          style: {
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`
          }
        },
        {
          props: { variant: 'secondary2' },
          style: {
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
            color: colorTheme.palette.primary.main,
            '&:hover': {
              borderColor: colorTheme.palette.primary.main
            }
          }
        },
        {
          props: { variant: 'ghost' },
          style: {
            background: 'transparent'
          }
        },
        {
          props: { variant: 'gradient' },
          style: {
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.primary.dark} 120.29%)`,
            border: `0.063rem solid ${colorTheme.palette.primary.light}`
          }
        }
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
          background: colorTheme.palette.secondary.contrastText,
          borderRadius: '0.75rem',
          gap: '2rem',
          //padding: '1.5rem 2rem 2rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          //color: colorTheme.palette.primary.light
          ':last-child': {
            paddingBottom: 0
          }
        }
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            boxSizing: 'border-box',
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
            flexDirection: 'column',
            borderRadius: '0.5rem',
            padding: '1rem',
            gap: '1.5rem',
            flex: 'none',
            order: 1,
            flexGrow: 0
          }
        },
        {
          props: { variant: 'currency' },
          style: {
            borderRadius: '0.5rem',
            backgroundColor: colorTheme.palette.secondary.dark,
            padding: '1rem',
            display: 'block',
            width: '100%',
            marginBottom: '1rem'
          }
        }
      ]
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: '160%',
          color: colorTheme.palette.text.secondary
        }
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            background: colorTheme.palette.secondary.dark,
            borderRadius: '6.25rem',
            height: '2.25rem',
            padding: '0.438rem 0.75rem',
            fontWeight: 400,
            fontSize: '0.875rem',
            lineHeight: '160%',
            '.MuiOutlinedInput-notchedOutline': { border: 0 }
          }
        }
      ]
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          height: '1.813rem',
          fontWeight: 400,
          lineHeight: '160%',
          display: 'flex',
          alignItems: 'center',
          flex: 'none',
          order: 0,
          flexGrow: 0
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          paddingLeft: '0.25rem'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          border: `1px solid ${colorTheme.palette.primary.main}`,
          padding: '0.875rem 0.5rem',
          fontSize: '0.75rem',
          backgroundColor: 'rgba(18, 18, 21, 0.5)'
        }
      }
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: colorTheme.palette.text.secondary
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: colorTheme.palette.text.secondary,
          cursor: 'pointer',
          ':hover': {
            color: colorTheme.palette.primary.main
          }
        }
      }
    }
  }
})

export { theme, colorTheme }
