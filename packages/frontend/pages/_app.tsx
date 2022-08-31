import "../styles/globals.css"
import type { AppProps } from "next/app"
import { inspect } from "@xstate/inspect"
import { createContext } from "react"
import { useInterpret } from "@xstate/react"
import { authMachine } from "../machines/login.machine"
import { InterpreterFrom } from "xstate"

if (typeof window !== "undefined") {
  inspect({
    // options
    // url: 'https://stately.ai/viz?inspect', // (default)
    iframe: false, // open in new window
  })
}
interface GlobalStateContext {
  authService: InterpreterFrom<typeof authMachine>
}
export const GlobalStateContext = createContext({} as GlobalStateContext)

function MyApp({ Component, pageProps }: AppProps) {
  const authService = useInterpret(authMachine, {
    devTools: process.env.NODE_ENV === "development",
  })
  // const onboard = useContext(OnboardContext)
  // onboard.connectWallet()
  // const currentState = onboard.state.get()
  // useEffect(() => console.log(currentState), [])

  return (
    <GlobalStateContext.Provider value={{ authService }}>
      <Component {...pageProps} />
    </GlobalStateContext.Provider>
  )
}

export default MyApp
