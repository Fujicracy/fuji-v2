import "../styles/globals.css"
import { AppProps } from "next/app"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useStore } from "../store"

function MyApp({ Component, pageProps }: AppProps) {
  const init = useStore((state) => state.init)

  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NODE_ENV === "development",
    })
    init()
  }, [init])

  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
