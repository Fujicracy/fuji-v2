import "../styles/globals.css"
import { AppProps } from "next/app"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useAuth } from "../store/auth.store"
import { Snackbar } from "../components/Shared/Snackbar"
import { usePositions } from "../store/positions.store"
import { useBorrow } from "../store/borrow.store"

function MyApp({ Component, pageProps }: AppProps) {
  const initAuth = useAuth((state) => state.init)
  const address = useAuth((state) => state.address)

  const fetchPositions = usePositions((state) => state.fetchUserPositions)
  const updateVault = useBorrow((state) => state.updateVault)

  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NEXT_PUBLIC_APP_ENV === "development",
    })
    initAuth()
  }, [initAuth])

  // TODO: Need to trigger this every time the user changes a page
  useEffect(() => {
    if (address) {
      fetchPositions()
      updateVault()
    }
  }, [address, fetchPositions, updateVault])

  return (
    <ThemeProvider theme={theme}>
      <div className="backdrop"></div>
      <Component {...pageProps} />
      <Snackbar />
    </ThemeProvider>
  )
}

export default MyApp
