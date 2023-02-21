import { createTheme } from "@mui/material"

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    primary: true
    secondary: true
    secondary2: true
    ghost: true
    gradient: true
    small: true
    rounded: true
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    gradient: true
    success: true
    warning: true
    number: true
    routing: true
    recommended: true
    selected: true
    currency: true
  }
}

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    currency: true
    lending: true
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display1: true
    display2: true
    body: true
    body2: true
    small: true
    smallDark: true
    xsmall: true
    xsmallDark: true
    xsmallLink: true
    label: true
    regularH4: true
  }
}

const colorTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F6145E",
      light: "#FE3477",
      dark: "#F0014F",
      contrastText: "rgba(254, 52, 119, 0)",
    },
    secondary: {
      main: "#2D2F35",
      light: "#3B404A",
      dark: "#222429",
      contrastText: "#191B1F",
    },
    text: {
      primary: "#E8E8E8",
      secondary: "#E2E8F0",
      disabled: "#6C7182",
    },
    info: {
      main: "#C3C5CB",
      dark: "#787883",
    },
    success: {
      main: "#42FF00",
      dark: "#0EC058",
    },
    warning: {
      main: "#F5AC37",
    },
    error: {
      main: "#FD4040",
      dark: "#FC0A54",
    },
    background: {
      paper: "black",
      default: "#2D2F35",
    },
  },
  typography: {
    fontFamily: "Inter", // Need to be specified here instead of above otherwise it use the default mui font family
  },
})

const theme = createTheme(colorTheme, {
  typography: {
    letterSpacing: "0%",
    display1: {
      fontWeight: 700,
      fontSize: "3rem",
      lineHeight: "120%",
    },
    display2: {
      fontWeight: 700,
      fontSize: "2.75rem",
      lineHeight: "120%",
    },
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: "120%",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.25rem",
      lineHeight: "150%",
    },
    h3: {
      fontWeight: 700,
      fontSize: "1.875rem",
      lineHeight: "150%",
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: "150%",
    },
    regularH4: {
      display: "block",
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: "120%",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: "150%",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1.125rem",
      lineHeight: "160%",
    },
    body: {
      fontWeight: 400,
      fontSize: "1rem",
      lineHeight: "160%",
    },
    body2: {
      fontWeight: 700,
      fontSize: "1rem",
      lineHeight: "160%",
    },
    small: {
      fontWeight: 400,
      fontSize: "0.875rem",
      lineHeight: "160%",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    smallDark: {
      fontWeight: 400,
      fontSize: "0.875rem",
      lineHeight: "160%",
      color: colorTheme.palette.info.dark,
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    xsmall: {
      fontWeight: 400,
      fontSize: "0.75rem",
    },
    xsmallDark: {
      fontWeight: 400,
      fontSize: "0.75rem",
      lineHeight: "160%",
      color: colorTheme.palette.info.dark,
    },
    xsmallLink: {
      fontWeight: 400,
      fontSize: "0.75rem",
      cursor: "pointer",
      ":hover": { color: colorTheme.palette.primary.main },
    },
    label: {
      fontWeight: 700,
      fontSize: "0.875rem",
      lineHeight: "100%",
      letterSpacing: "2%",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxSizing: "border-box",
          borderRadius: "0.5rem",
          textTransform: "none",
          fontSize: "1rem",
          "&.Mui-disabled": {
            opacity: 0.5,
            color: colorTheme.palette.text.secondary,
          },
          "&:hover": {
            opacity: 0.9,
            borderColor: colorTheme.palette.primary,
          },
        },
      },
      variants: [
        {
          props: {
            variant: "primary",
          },
          style: {
            background:
              "linear-gradient(92.29deg, rgba(254, 52, 119, 0.8) 0%, rgba(240, 1, 79, 0.8) 100%)",
            boxShadow: "0rem 0.063rem 0.125rem rgba(16, 24, 40, 0.05)",
            padding: "0.75rem 1.25rem",
            fontSize: "1rem",
          },
        },
        {
          props: {
            variant: "secondary",
          },
          style: {
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
          },
        },
        {
          props: {
            variant: "secondary2",
          },
          style: {
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
            color: colorTheme.palette.primary.main,
            "&:hover": {
              borderColor: colorTheme.palette.primary.main,
            },
          },
        },
        {
          props: {
            variant: "ghost",
          },
          style: {
            background: "transparent",
          },
        },
        {
          props: {
            variant: "gradient",
          },
          style: {
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.primary.dark} 120.29%)`,
            border: `1px solid ${colorTheme.palette.primary.light}`,
            textTransform: "none",
            fontSize: "1rem",
          },
        },
        {
          props: {
            variant: "text",
          },
          style: {
            background:
              "linear-gradient(92.29deg, rgba(254, 52, 119, 0.1) 0%, rgba(240, 1, 79, 0.1) 100%)",
            borderRadius: "6.25rem",
            padding: "0.438rem 1rem",
          },
        },
        {
          props: {
            variant: "small",
          },
          style: {
            color: colorTheme.palette.primary.main,
            background: "transparent",
            border: `1px solid ${colorTheme.palette.primary.dark}`,
            textTransform: "capitalize",
            padding: "0 .6rem",
            fontSize: "0.75rem",
            borderRadius: "1rem",
          },
        },
        {
          props: { size: "large" },
          style: { padding: ".7rem", fontSize: "1rem" },
        },
        {
          props: { variant: "rounded" },
          style: {
            borderRadius: "50rem",
            color: colorTheme.palette.primary.light,
            border: `1px solid ${colorTheme.palette.primary.light}`,
          },
        },
      ],
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colorTheme.palette.text.primary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: colorTheme.palette.secondary.contrastText,
          borderRadius: "0.75rem",
          // TODO: refacto and reomve, flex should not be part of card theming
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
        },
      },
      variants: [
        {
          props: {
            variant: "outlined",
          },
          style: {
            boxSizing: "border-box",
            background: colorTheme.palette.secondary.dark,
            border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
            flexDirection: "column",
            borderRadius: "0.5rem",
            padding: "1rem",
            flex: "none",
            order: 1,
            flexGrow: 0,
          },
        },
        {
          props: {
            variant: "currency",
          },
          style: {
            borderRadius: "0.5rem",
            backgroundColor: colorTheme.palette.secondary.dark,
            padding: "1rem",
            display: "block",
            width: "100%",
            marginBottom: "1rem",
          },
        },
        {
          props: {
            variant: "lending",
          },
          style: {
            borderRadius: "0.75rem",
            backgroundColor: colorTheme.palette.secondary.contrastText,
            border: `1px solid ${colorTheme.palette.secondary.light}`,
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",

            paddingBottom: "12.5rem",
          },
        },
      ],
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 400,
          fontSize: "0.875rem",
          lineHeight: "160%",
          borderRadius: "2rem",
          padding: ".25rem .5rem",
          color: colorTheme.palette.text.secondary,
        },
      },
      variants: [
        {
          props: {
            variant: "outlined",
          },
          style: {
            background: colorTheme.palette.secondary.dark,
            borderRadius: "6.25rem",
            height: "2.25rem",
            padding: "0.438rem 0.75rem",
            fontWeight: 400,
            fontSize: "0.875rem",
            lineHeight: "160%",
          },
        },
      ],
    },
    MuiTooltip: {
      styleOverrides: {
        cursor: "help",
        tooltip: {
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          lineHeight: "1rem",
          borderRadius: "0.5rem",
          background: colorTheme.palette.secondary.dark,
          textAlign: "center",
          border: `1px solid ${colorTheme.palette.secondary.light}`,
          boxShadow: "0rem 0.063rem 0.125rem rgba(16, 24, 40, 0.05)",
        },
        arrow: {
          color: colorTheme.palette.secondary.light,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
          color: colorTheme.palette.text.secondary,
          cursor: "pointer",
          ":hover": {
            color: colorTheme.palette.primary.main,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          ".MuiPaper-root": {
            borderRadius: "1.125rem",
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          background: colorTheme.palette.secondary.contrastText,
          padding: "0.3rem 0.5rem",
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "Inherit",
          background: colorTheme.palette.secondary.dark,
          height: "2.25rem",
          fontSize: "0.75rem",
          borderRadius: "6.25rem",
          "& .MuiChip-deleteIcon": {
            color: colorTheme.palette.text.primary,
          },
        },
      },
      variants: [
        {
          props: { variant: "gradient" },
          style: {
            background: `linear-gradient(287.45deg, rgba(254, 52, 119, 0) 6.81%, ${colorTheme.palette.primary.dark} 120.29%)`,
            border: `1px solid ${colorTheme.palette.primary.light}`,
            padding: "0.125rem 0",
            height: "100%",
            lineHeight: "160%",
          },
        },
        {
          props: {
            variant: "success",
          },
          style: {
            background: `${colorTheme.palette.success.main}33`,
            color: colorTheme.palette.success.main,
            width: "2.52rem",
            height: "1.438rem",
          },
        },
        {
          props: {
            variant: "warning",
          },
          style: {
            background: `${colorTheme.palette.warning.main}33`,
            color: colorTheme.palette.warning.main,
            width: "2.47rem",
            height: "1.438rem",
          },
        },
        {
          props: {
            variant: "number",
          },
          style: {
            width: "1.5rem",
            height: "1.5rem",
            background: colorTheme.palette.secondary.light,
            position: "relative",
            right: `${3 * 0.25}rem`,
          },
        },
        {
          props: {
            variant: "routing",
          },
          style: {
            background: colorTheme.palette.secondary.main,
            height: "22px",
          },
        },
        {
          props: {
            variant: "recommended",
          },
          style: {
            background: colorTheme.palette.primary.main,
            position: "relative",
            bottom: ".7rem",
            height: "22px",
          },
        },
        {
          props: {
            variant: "selected",
          },
          style: {
            height: "22px",
            color: colorTheme.palette.primary.main,
            border: `1px solid ${colorTheme.palette.primary.main}`,
          },
        },

        {
          props: {
            variant: "currency",
          },
          style: {
            height: "28px",
            fontSize: "0.9rem",
            lineHeight: "100%",
            backgroundColor: colorTheme.palette.secondary.light,
            color: "white",
          },
        },
      ],
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          ":last-child": {
            paddingBottom: "1rem",
          },
        },
      },
    },
    MuiPaper: {
      variants: [
        {
          props: {
            variant: "outlined",
          },
          style: {
            background: colorTheme.palette.secondary.contrastText,
            border: `1px solid ${colorTheme.palette.secondary.light}`,
            borderRadius: "1.125rem",
          },
        },
      ],
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${colorTheme.palette.secondary.light}`,
          borderRadius: "12px !important",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: colorTheme.palette.info.dark,
          textTransform: "none",
          fontSize: "0.875rem",
          borderBottom: `1px solid ${colorTheme.palette.info.dark}`,
          "&.Mui-selected": {
            color: colorTheme.palette.text.primary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          ".MuiTabs-indicator": {
            backgroundColor: colorTheme.palette.text.primary,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem !important",
          alignItems: "center",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem",
        },
      },
      variants: [
        {
          props: {
            variant: "outlined",
          },
          style: {
            background: colorTheme.palette.secondary.dark,
            color: colorTheme.palette.info.dark,
          },
        },
      ],
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          textAlign: "center",
          borderRadius: "0.75rem",
          border: `1px solid ${colorTheme.palette.secondary.light}`,
          background: colorTheme.palette.secondary.contrastText,
          fontSize: "0.75rem",
          borderBottom: "none",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          ".MuiTableCell-head": {
            color: colorTheme.palette.info.main,
            fontSize: "0.75rem",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          fontWeight: 500,
          paddingTop: 0,
          paddingBottom: 0,
          whiteSpace: "nowrap",
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          background: colorTheme.palette.secondary.contrastText,
          border: `2px solid ${colorTheme.palette.secondary.light}`,
          borderRadius: "1.125rem",
          p: "1rem",
          color: colorTheme.palette.text.primary,
        },
      },
    },
  },
})

export { theme, colorTheme }
