import { ReactNode, useEffect, useState } from "react"
import {
  Divider,
  Button,
  Typography,
  CardContent,
  Card,
  Grid,
  Box,
  Stack,
  Tooltip,
  Chip,
} from "@mui/material"
import Image from "next/image"

import { useStore } from "../../store"
import TransactionProcessingModal from "./TransactionProcessingModal"
import { ChainSelect } from "./ChainSelect"
import TokenCard from "./TokenCard"
import { Fees } from "./Fees"
import ApprovalModal from "./ApprovalModal"
import LoadingButton from "@mui/lab/LoadingButton"
import { useHistory } from "../../store/history.store"
import NetworkIcon from "../NetworkIcon"
import { chainName } from "../../helpers/chainName"

export default function Borrow() {
  const address = useStore((state) => state.address)
  const walletChain = useStore((state) => state.chain)
  const changeChain = useStore((state) => state.changeChain)
  const updateBalance = useStore((state) => state.updateBalances)
  const updateVault = useStore((state) => state.updateVault)
  const updateAllowance = useStore((state) => state.updateAllowance)
  useEffect(() => {
    if (address) {
      updateBalance("collateral")
      updateBalance("debt")
      updateAllowance()
      updateVault()
    }
  }, [address, updateBalance, updateAllowance, updateVault])

  const login = useStore((state) => state.login)
  const formType = useStore((state) => state.formType)

  const collateral = useStore((state) => state.position.collateral)
  const collateralInput = useStore((state) => state.collateralInput)
  const collateralAmount = parseFloat(collateralInput)
  const collateralChainId = useStore((state) => state.collateralChainId)
  const collateralAllowance = useStore((state) => state.collateralAllowance)

  const debtInput = useStore((state) => state.debtInput)
  const debtAmount = parseFloat(debtInput)
  const debtChainId = useStore((state) => state.debtChainId)

  const vaultChainId = useStore((state) => state.position.vault?.chainId)

  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)

  // TODO: refacto with a "status" in store (i.e status = "editing, approving, signing, borrowing...") ?
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const balance = useStore(
    (state) => state.collateralBalances[state.position.collateral.token.symbol]
  )

  const updateTokenPrice = useStore((state) => state.updateTokenPrice)
  useEffect(() => {
    updateTokenPrice("collateral")
    updateTokenPrice("debt")
  }, [updateTokenPrice])

  const ltv = useStore((state) => state.position.ltv)
  const ltvMax = useStore((state) => state.position.ltvMax)

  const signAndBorrow = useStore((state) => state.signAndBorrow)
  const isSigning = useStore((state) => state.isSigning)
  const isBorrowing = useStore((state) => state.isBorrowing)

  const currentTxHash = useHistory((state) => state.inModal)
  const closeModal = useHistory((state) => state.closeModal)
  const metaStatus = useStore((state) => state.transactionMeta.status)
  const availableVaultStatus = useStore((state) => state.availableVaultsStatus)

  let button: ReactNode
  if (!address) {
    button = (
      <Button
        variant="gradient"
        size="large"
        onClick={() => login()}
        fullWidth
        data-cy="borrow-login"
      >
        Connect wallet
      </Button>
    )
  } else if (collateralChainId !== walletChain?.id) {
    button = (
      <Button
        variant="gradient"
        size="large"
        fullWidth
        onClick={() => changeChain(collateral.token.chainId)}
      >
        Switch network
      </Button>
    )
  } else if (collateralAmount > 0 && collateralAmount > balance) {
    button = (
      <Button variant="gradient" size="large" disabled fullWidth>
        Insufficient {collateral.token.symbol} balance
      </Button>
    )
  } else if (ltv > ltvMax) {
    button = (
      <Button variant="gradient" size="large" disabled fullWidth>
        Not enough collateral
      </Button>
    )
  } else if (
    collateralAllowance?.value !== undefined &&
    collateralAllowance.value < collateralAmount
  ) {
    button = (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => setShowApprovalModal(true)}
      >
        Allow
      </Button>
    )
  } else {
    button = (
      <LoadingButton
        variant="gradient"
        onClick={signAndBorrow}
        size="large"
        fullWidth
        disabled={
          collateralAmount <= 0 || debtAmount <= 0 || metaStatus !== "ready"
        }
        loading={
          isSigning || isBorrowing || availableVaultStatus === "fetching"
        }
        loadingPosition="start"
        startIcon={<></>}
      >
        {(isSigning && "(1/2) Signing...") ||
          (isBorrowing && "(2/2) Borrowing...") ||
          "Sign & Borrow"}
      </LoadingButton>
    )
  }

  return (
    <>
      <Card sx={{ maxWidth: "500px", margin: "auto" }}>
        <CardContent sx={{ width: "100%", p: "1.5rem 2rem" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" height="40px" lineHeight="40px">
              {formType === "create" && "Borrow"}
              {formType === "edit" && "Manage your position"}
            </Typography>

            {formType === "edit" && vaultChainId && (
              <Tooltip
                title={`Your position is currently on ${chainName(
                  vaultChainId
                )} network`}
                placement="top"
                arrow
              >
                <Box>
                  <NetworkIcon network={vaultChainId} height={18} width={18} />
                </Box>
              </Tooltip>
            )}
          </Stack>

          <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />

          {formType === "edit" && vaultChainId && (
            <Stack mt={3} mb={3} spacing={1} direction="row">
              <Chip
                label="Add position"
                variant="outlined"
                color="primary"
                onClick={() => alert("not implemented")}
              />
              <Chip
                label="Remove position"
                onClick={() => alert("not implemented")}
              />
            </Stack>
          )}

          <Box mb="1rem">
            <ChainSelect
              label="Collateral from"
              type="collateral"
              value={collateralChainId}
              disabled={isBorrowing}
              onChange={(chainId) => changeCollateralChain(chainId)}
            />
            <TokenCard type="collateral" />
          </Box>

          <Box mb="2rem">
            <ChainSelect
              label="Borrow to"
              type="borrow"
              value={debtChainId}
              disabled={isBorrowing}
              onChange={(chainId) => changeBorrowChain(chainId)}
            />
            <TokenCard type="debt" />
          </Box>

          <Box mb="1rem">
            <Fees />
          </Box>

          {button}

          <a
            href="https://www.connext.network/"
            target="_blank"
            rel="noreferrer"
          >
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              mt="2rem"
            >
              <Typography variant="small">Powered by</Typography>
              <Image
                src="/assets/images/logo/connext-title.svg"
                height={16}
                width={95}
                alt="Connext logo"
              />
            </Grid>
          </a>
        </CardContent>
      </Card>
      {/* TODO: Move txprocessing outside of borrow */}
      <TransactionProcessingModal
        hash={currentTxHash}
        handleClose={closeModal}
      />
      {showApprovalModal && (
        <ApprovalModal handleClose={() => setShowApprovalModal(false)} />
      )}
    </>
  )
}
