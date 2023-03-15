import { useState } from "react"
import {
  Button,
  Card,
  Link,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import Image from "next/image"
// import { useAuth } from "../../store/auth.store"

function Lending() {
  const { palette } = useTheme()
  // const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  // const [errorMessage, setErrorMessage] = useState("")
  // const address = useAuth((state) => state.address)
  // const login = useAuth((state) => state.login)

  // const onSubmit = () => {
  //   if (
  //     String(email)
  //       .toLowerCase()
  //       .match(
  //         /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  //       )
  //   ) {
  //     setIsSubmitted(true)
  //     setErrorMessage("")
  //   } else {
  //     setErrorMessage("Please enter a valid email address.")
  //   }
  // }

  return (
    <Card variant="lending" sx={{ p: { xs: "1rem", sm: "8rem 27.5rem" } }}>
      <Image
        src="/assets/images/logo/himalaya.svg"
        alt="Logo Himalaya"
        width={64}
        height={64}
        style={{
          background: palette.secondary.dark,
          borderRadius: "100%",
        }}
      />
      <Typography variant="h4" mt="1.375rem">
        Himalaya Lend
        <br />
        {isSubmitted && "You’re on the waitlist!"}
      </Typography>

      <Typography
        color={palette.info.main}
        variant="small"
        m="1rem"
        sx={{ width: { xs: "100%", sm: "22.5rem" } }}
      >
        {!isSubmitted
          ? "Retail and insituition lending interest rate optimization. Be the first to use our beta platform"
          : "Want to cut to the front? Fill out this survey to be one of the first to gain access."}
      </Typography>

      {/*{!address ? (*/}
      {/*  <Button variant="gradient" onClick={() => login()} fullWidth>*/}
      {/*    Connect wallet*/}
      {/*  </Button>*/}
      {/*) : (*/}
      {/*  <>*/}
      {/*    {!isSubmitted ? (*/}
      {/*      <>*/}
      {/*        <TextField*/}
      {/*          id="email"*/}
      {/*          type="email"*/}
      {/*          placeholder="Enter your email"*/}
      {/*          value={email}*/}
      {/*          onChange={(e) => setEmail(e.target.value)}*/}
      {/*          fullWidth*/}
      {/*          sx={{ mb: "1rem" }}*/}
      {/*        />*/}
      {/*        {errorMessage && (*/}
      {/*          <Typography*/}
      {/*            color={palette.primary.main}*/}
      {/*            variant="small"*/}
      {/*            mb="1rem"*/}
      {/*          >*/}
      {/*            {errorMessage}*/}
      {/*          </Typography>*/}
      {/*        )}*/}

      {/*        <Button variant="gradient" fullWidth onClick={onSubmit}>*/}
      {/*          Join waitlist*/}
      {/*        </Button>*/}
      {/*      </>*/}
      {/*    ) : (*/}
      {/*      <Link*/}
      {/*        href="https://www.typeform.com"*/}
      {/*        target="_blank"*/}
      {/*        rel="noreferrer"*/}
      {/*      >*/}
      {/*        <Button*/}
      {/*          variant="gradient"*/}
      {/*          sx={{ width: "7.2rem", mt: "0.75rem" }}*/}
      {/*        >*/}
      {/*          Start*/}
      {/*        </Button>*/}
      {/*      </Link>*/}
      {/*    )}*/}
      {/*  </>*/}
      {/*)}*/}
    </Card>
  )
}

export default Lending
