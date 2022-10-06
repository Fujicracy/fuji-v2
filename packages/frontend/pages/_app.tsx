import "../styles/globals.css"
import { AppProps } from "next/app"
import { inspect } from "@xstate/inspect"
import { createContext, useEffect } from "react"
import { useInterpret } from "@xstate/react"
import { authMachine } from "../machines/auth.machine"
import { InterpreterFrom } from "xstate"
import mixpanel from "mixpanel-browser"
import { ThemeProvider } from "@mui/material"

import { theme } from "../styles/theme"
import { useStore } from "../store"

interface GlobalStateContext {
  authService: InterpreterFrom<typeof authMachine>
}
export const GlobalStateContext = createContext({} as GlobalStateContext)

function MyApp({ Component, pageProps }: AppProps) {
  const reconnect = useStore((state) => state.reconnect)
  const subscribe = useStore((state) => state._subscribe)

  const authService = useInterpret(authMachine, {
    devTools: process.env.NODE_ENV === "development",
  })
  useEffect(() => {
    mixpanel.init("030ddddf19623797be516b634956d108", {
      debug: process.env.NODE_ENV === "development",
    })
    reconnect()
    subscribe()
  }, [authService])

  return (
    <GlobalStateContext.Provider
      value={{
        authService,
      }}
    >
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </GlobalStateContext.Provider>
  )
}

export default MyApp
