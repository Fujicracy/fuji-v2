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

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    display1: true
    display2: true
    body: true
    small: true
    xsmall: true
    label: true
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
    /*action: {
      active: '#FE3477',
      hover: '#FE3477',
      hoverOpacity: 0.7,
      focus: '#FE3477',
      focusOpacity: 1,
      selected: '#FE3477',
      selectedOpacity: 1
    }, */
    success: {
      main: '#42FF00'
    },
    warning: {
      main: '#F5AC37'
    },
    error: {
      main: '#FD4040'
    }
  }
})

const theme = createTheme(colorTheme, {
  typography: {
    color: colorTheme.palette.text.primary,
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
    small: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: '160%'
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
          color: colorTheme.palette.text.primary,
          borderRadius: '0.5rem',
          padding: '0.75rem 1.25rem',
          //width: '23em',
          textTransform: 'none',
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: '1rem',
          lineHeight: '1.188rem',
          height: '3.25rem',
          '&.Mui-disabled': {
            opacity: 0.5,
            color: '#F5F5FD'
          },
          '&:hover': {
            opacity: 0.9,
            background:
              'linear-gradient(to right, rgb(254, 52, 119), rgb(240, 1, 79))',
            transition: 'all 0.17s ease 0s',
            color: '#F5F5FD'
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
            border: '0.063rem solid #3B404A',
            color: colorTheme.palette.text.primary
          }
        },
        {
          props: { variant: 'secondary2' },
          style: {
            background: colorTheme.palette.secondary.dark,
            border: '0.063rem solid #3B404A',
            color: colorTheme.palette.primary.main
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
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.secondary.dark} 120.29%)`,
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
          background: '#191B1F',
          borderRadius: '0.75rem'
          //color: colorTheme.palette.primary.light
        }
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            background: colorTheme.palette.secondary.contrastText,
            border: '0.063rem solid #3A3A3C',
            borderRadius: '0.5rem'
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
          color: colorTheme.palette.text.secondary,
          opacity: 0.5
        }
      }
    }
  }
})

export { theme, colorTheme }
