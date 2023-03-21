import "../styles/globals.css"
import { AppProps } from "next/app"
import { Inter } from "next/font/google"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useAuth, onboard } from "../store/auth.store"
import { usePositions } from "../store/positions.store"
import { useBorrow } from "../store/borrow.store"
import { useRouter } from "next/router"
import { isTopLevelUrl } from "../helpers/navigation"
import TransactionModal from "../components/Borrow/TransactionModal"
import Snackbar from "../components/Shared/Snackbar"
import { useHistory } from "../store/history.store"
import SafetyNoticeModal from "../components/Onboarding/SafetyNoticeModal"
import { Web3OnboardProvider } from "@web3-onboard/react"

const inter = Inter({ subsets: ["latin"] })

function MyApp({ Component, pageProps }: AppProps) {
  const initAuth = useAuth((state) => state.init)
  const address = useAuth((state) => state.address)
  const router = useRouter()

  const currentPage = `/${router.pathname.substring(1)}`
  const currentTxHash = useHistory((state) => state.inModal)
  const fetchPositions = usePositions((state) => state.fetchUserPositions)
  const updateVault = useBorrow((state) => state.updateVault)
  const changeSlippageValue = useBorrow((state) => state.changeSlippageValue)

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

  useEffect(() => {
    const slippage = localStorage.getItem("slippage")

    if (slippage) {
      changeSlippageValue(Number(slippage))
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>

      <Web3OnboardProvider web3Onboard={onboard}>
        <ThemeProvider theme={theme}>
          <div className="backdrop"></div>
          <Component {...pageProps} />
          <TransactionModal hash={currentTxHash} currentPage={currentPage} />
          <Snackbar />
          <SafetyNoticeModal />
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  )
}

export default MyApp
