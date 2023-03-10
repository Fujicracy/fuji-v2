import "../styles/globals.css"
import { AppProps } from "next/app"
import { Inter } from "next/font/google"
import { useEffect } from "react"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { onboard, useAuth } from "../store/auth.store"
import { Snackbar } from "../components/Shared/Snackbar"
import { Web3OnboardProvider } from "@web3-onboard/react"

const inter = Inter({ subsets: ["latin"] })

function MyApp({ Component, pageProps }: AppProps) {
  const initAuth = useAuth((state) => state.init)

  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NEXT_PUBLIC_APP_ENV === "development",
    })
    initAuth()
  }, [initAuth])

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
          <Snackbar />
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  )
}

export default MyApp
