import "../styles/globals.css"
import { AppProps } from "next/app"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useAuth } from "../store/auth.store"
import Snackbar from "../components/Shared/Snackbar"
import { usePositions } from "../store/positions.store"
import { useBorrow } from "../store/borrow.store"
import { useRouter } from "next/router"
import { isTopLevelUrl } from "../helpers/navigation"
import TransactionModal from "../components/Borrow/TransactionModal"
import { useHistory } from "../store/history.store"

function MyApp({ Component, pageProps }: AppProps) {
  const initAuth = useAuth((state) => state.init)
  const address = useAuth((state) => state.address)
  const router = useRouter()

  const currentTxHash = useHistory((state) => state.inModal)
  const closeModal = useHistory((state) => state.closeModal)
  const fetchPositions = usePositions((state) => state.fetchUserPositions)
  const updateVault = useBorrow((state) => state.updateVault)

  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NEXT_PUBLIC_APP_ENV === "development",
    })
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (address) {
      fetchPositions()
      updateVault()
    }
  }, [address, fetchPositions, updateVault])

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const isTop = isTopLevelUrl(url)
      if (isTop && address) {
        fetchPositions()
        updateVault()
      }
    }
    router.events.on("routeChangeStart", handleRouteChange)
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  })

  return (
    <ThemeProvider theme={theme}>
      <div className="backdrop"></div>
      <Component {...pageProps} />
      <TransactionModal hash={currentTxHash} handleClose={closeModal} />
      <Snackbar />
    </ThemeProvider>
  )
}

export default MyApp
