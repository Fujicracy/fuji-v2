import { useEffect, useState } from "react"
import {
  Typography,
  CardContent,
  Card,
  Stack,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material"

import TransactionProcessingModal from "./TransactionProcessingModal"
import { Fees } from "./Fees"
import ApprovalModal from "./ApprovalModal"
import RoutingModal from "./Routing/RoutingModal"
import { useHistory } from "../../store/history.store"
import { chainName } from "../../services/chains"
import { useBorrow } from "../../store/borrow.store"
import { useAuth } from "../../store/auth.store"
import BorrowButton from "./Button"
import BorrowHeader from "./Header"
import BorrowBox from "./Box/Box"
import ConnextFooter from "./ConnextFooter"
import { Mode, modeForContext, PositionAction } from "../../helpers/borrow"

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

  const [positionAction, setPositionAction] = useState(PositionAction.ADD)
  const [mode, setMode] = useState(Mode.DEPOSIT_AND_BORROW)

  useEffect(() => {
    const mode = modeForContext(
      props.managePosition,
      positionAction,
      Number(collateralInput),
      Number(debtInput)
    )
    setMode(mode)
  }, [props.managePosition, collateralInput, debtInput, positionAction])

  return (
    <>
      <Card sx={{ maxWidth: "500px", margin: "auto" }}>
        <CardContent sx={{ width: "100%", p: "1.5rem 2rem" }}>
          <BorrowHeader
            chainName={chainName(debtChainId)}
            managePosition={props.managePosition}
            action={positionAction}
            onPositionActionChange={(action) => setPositionAction(action)}
          />
          <BorrowBox
            mb="1rem"
            managePosition={props.managePosition}
            label="Collateral from"
            type="collateral"
            chainId={collateralChainId}
            disableChainChange={isBorrowing}
            onChainChange={(chainId) => changeCollateralChain(chainId)}
          />
          <BorrowBox
            managePosition={props.managePosition}
            label="Borrow to"
            type="borrow"
            chainId={debtChainId}
            disableChainChange={isBorrowing}
            onChainChange={(chainId) => changeBorrowChain(chainId)}
          />

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
            managePosition={props.managePosition}
            managingAction={positionAction}
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

          <ConnextFooter />
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
