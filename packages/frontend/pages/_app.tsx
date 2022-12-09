import "../styles/globals.css"
import { AppProps } from "next/app"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useStore } from "../store"
import { Notifications } from "../components/Notifications"

function MyApp({ Component, pageProps }: AppProps) {
  const init = useStore((state) => state.init)

  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NEXT_PUBLIC_APP_ENV === "development",
    })
    init()
  }, [init])

  return (
    <ThemeProvider theme={theme}>
      <div className="backdrop"></div>
      <Component {...pageProps} />
      <Notifications />
    </ThemeProvider>
  )
}

export default MyApp
