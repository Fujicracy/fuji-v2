import { ReactNode, useEffect, useState } from "react"
import {
  Divider,
  Typography,
  CardContent,
  Card,
  Grid,
  Stack,
  useMediaQuery,
  useTheme,
  Box,
  Link,
} from "@mui/material"
import Image from "next/image"

import TransactionProcessingModal from "./TransactionProcessingModal"
import { ChainSelect } from "./ChainSelect"
import TokenCard from "./TokenCard"
import { Fees } from "./Fees"
import ApprovalModal from "./ApprovalModal"
import RoutingModal from "./RoutingModal"
import { useHistory } from "../../store/history.store"
import { chainName } from "../../services/chains"
import { useBorrow } from "../../store/borrow.store"
import { useAuth } from "../../store/auth.store"
import { NetworkIcon } from "../Shared/Icons"
import TabChip from "../Shared/TabChip"
import BorrowButton from "./Button"

type BorrowProps = {
  managePosition: boolean
}
export default function Borrow(props: BorrowProps) {
  const address = useAuth((state) => state.address)
  const walletChain = useAuth((state) => state.chain)
  const changeChain = useAuth((state) => state.changeChain)
  const updateBalance = useBorrow((state) => state.updateBalances)
  const updateVault = useBorrow((state) => state.updateVault)
  const updateAllowance = useBorrow((state) => state.updateAllowance)
  useEffect(() => {
    if (address) {
      updateBalance("collateral")
      updateBalance("debt")
      updateAllowance()
      updateVault()
    }
  }, [address, updateBalance, updateAllowance, updateVault])

  const login = useAuth((state) => state.login)
  const theme = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("md"))

  const collateral = useBorrow((state) => state.position.collateral)
  const collateralInput = useBorrow((state) => state.collateralInput)
  const collateralAmount = parseFloat(collateralInput)
  const collateralChainId = useBorrow((state) => state.collateralChainId)
  const collateralAllowance = useBorrow((state) => state.collateralAllowance)

  const debtInput = useBorrow((state) => state.debtInput)
  const debtAmount = parseFloat(debtInput)
  const debtChainId = useBorrow((state) => state.debtChainId)

  // const vaultChainId = useBorrow((state) => state.position.vault?.chainId)

  const changeBorrowChain = useBorrow((state) => state.changeBorrowChain)
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  )

  // TODO: refacto with a "status" in store (i.e status = "editing, approving, signing, borrowing...") ?
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const balance = useBorrow(
    (state) => state.collateralBalances[state.position.collateral.token.symbol]
  )

  const updateTokenPrice = useBorrow((state) => state.updateTokenPrice)
  useEffect(() => {
    updateTokenPrice("collateral")
    updateTokenPrice("debt")
  }, [updateTokenPrice])

  const ltv = useBorrow((state) => state.position.ltv)
  const ltvMax = useBorrow((state) => state.position.ltvMax)

  const signAndBorrow = useBorrow((state) => state.signAndBorrow)
  const isSigning = useBorrow((state) => state.isSigning)
  const isBorrowing = useBorrow((state) => state.isBorrowing)

  const currentTxHash = useHistory((state) => state.inModal)
  const closeModal = useHistory((state) => state.closeModal)
  const metaStatus = useBorrow((state) => state.transactionMeta.status)
  const availableVaultStatus = useBorrow((state) => state.availableVaultsStatus)

  const [showRoutingModal, setShowRoutingModal] = useState(false)
  const [managingAction, setManagingAction] = useState(0)

  return (
    <>
      <Card sx={{ maxWidth: "500px", margin: "auto" }}>
        <CardContent sx={{ width: "100%", p: "1.5rem 2rem" }}>
          {props.managePosition ? (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              height="40px"
            >
              <Typography variant="body2" height="40px" lineHeight="40px">
                Manage your position
              </Typography>
              <NetworkIcon
                network={chainName(debtChainId)}
                height={18}
                width={18}
              />
            </Stack>
          ) : (
            <Typography variant="body2" height="40px" lineHeight="40px">
              Borrow
            </Typography>
          )}
          <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />
          {props.managePosition && (
            <Stack
              direction="row"
              sx={{
                marginTop: 3,
                marginBottom: 3,
              }}
            >
              <TabChip
                selected={managingAction === 0}
                label={"Add Position"}
                onClick={() => {
                  setManagingAction(0)
                }}
              />
              <TabChip
                selected={managingAction === 1}
                label={"Remove Position"}
                sx={{ marginLeft: 1 }}
                onClick={() => {
                  setManagingAction(1)
                }}
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
            <TokenCard type="collateral" disabled={props.managePosition} />
          </Box>

          <Box>
            <ChainSelect
              label="Borrow to"
              type="borrow"
              value={debtChainId}
              disabled={isBorrowing}
              onChange={(chainId) => changeBorrowChain(chainId)}
            />
            <TokenCard type="debt" disabled={props.managePosition} />
          </Box>

          <Stack
            direction="row"
            m="1rem 0"
            justifyContent="space-between"
            onClick={() => {
              !onMobile && address && setShowRoutingModal(true)
            }}
            sx={{ cursor: address && "pointer" }}
          >
            <Typography variant="small">Route</Typography>
            <Typography variant="small">
              <u>{`${chainName(collateralChainId)} > ${chainName(
                debtChainId
              )}`}</u>
            </Typography>
          </Stack>
          <Box mb="1rem">
            <Fees />
          </Box>

          <BorrowButton
            address={address}
            collateralChainId={collateralChainId}
            walletChain={walletChain}
            collateralAmount={collateralAmount}
            debtAmount={debtAmount}
            balance={balance}
            ltv={ltv}
            ltvMax={ltvMax}
            collateralAllowance={collateralAllowance?.value}
            collateral={collateral}
            metaStatus={metaStatus}
            isSigning={isSigning}
            isBorrowing={isBorrowing}
            availableVaultStatus={availableVaultStatus}
            onClick={(action) => {
              if (action === "login") {
                login()
              } else if (action === "change_chain") {
                changeChain(collateral.token.chainId)
              } else if (action === "approve") {
                setShowApprovalModal(true)
              } else {
                signAndBorrow()
              }
            }}
          />

          <Link
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
          </Link>
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

      <RoutingModal
        open={showRoutingModal}
        handleClose={() => setShowRoutingModal(false)}
      />
    </>
  )
}

Borrow.defaultProps = {
  position: false,
}
