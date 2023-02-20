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
import { modeForContext, PositionAction } from "../../helpers/borrow"
import { Address } from "@x-fuji/sdk"

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

  const login = useAuth((state) => state.login)
  const theme = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("md"))

  const collateral = useBorrow((state) => state.collateral)
  const collateralAmount = parseFloat(collateral.input)

  const debt = useBorrow((state) => state.debt)
  const debtAmount = parseFloat(debt.input)

  const changeBorrowChain = useBorrow((state) => state.changeBorrowChain)
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  )

  // TODO: refacto with a "status" in store (i.e status = "editing, approving, signing, borrowing...") ?
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const balance = useBorrow(
    (state) => state.collateral.balances[state.collateral.token.symbol]
  )

  const updateTokenPrice = useBorrow((state) => state.updateTokenPrice)

  const ltv = useBorrow((state) => state.ltv)
  const ltvMax = useBorrow((state) => state.ltvMax)

  const signAndBorrow = useBorrow((state) => state.signAndBorrow)
  const isSigning = useBorrow((state) => state.isSigning)
  const isBorrowing = useBorrow((state) => state.isBorrowing)

  const currentTxHash = useHistory((state) => state.inModal)
  const closeModal = useHistory((state) => state.closeModal)
  const metaStatus = useBorrow((state) => state.transactionMeta.status)
  const availableVaultStatus = useBorrow((state) => state.availableVaultsStatus)

  const [showRoutingModal, setShowRoutingModal] = useState(false)
  const availableRoutes = useBorrow((state) => state.availableRoutes)

  const [positionAction, setPositionAction] = useState(PositionAction.ADD)

  // TODO: Need to make sure to update mode when changing page, chains, collateral, debt, etc.
  const mode = useBorrow((state) => state.mode)
  const changeMode = useBorrow((state) => state.changeMode)

  const vault = useBorrow((state) => state.activeVault)
  const [hasBalance, setHasBalance] = useState(false)

  useEffect(() => {
    if (address) {
      updateBalance("collateral")
      updateBalance("debt")
      updateAllowance()
      updateVault()
    }
  }, [address, updateBalance, updateAllowance, updateVault])

  useEffect(() => {
    updateTokenPrice("collateral")
    updateTokenPrice("debt")
  }, [updateTokenPrice])

  useEffect(() => {
    ;(async () => {
      if (address && vault && !props.managePosition) {
        // Poor implementation, needs to be more complex and probably grab the associated position
        const balance = await vault.getBalances(Address.from(address))
        const hasBalance =
          balance.deposit.toNumber() > 0 || balance.borrow.toNumber() > 0
        setHasBalance(hasBalance)
      }
    })()
  }, [address, vault, props.managePosition])

  useEffect(() => {
    const mode = modeForContext(
      props.managePosition,
      positionAction,
      Number(collateral.input),
      Number(debt.input)
    )
    changeMode(mode)
  }, [
    changeMode,
    props.managePosition,
    collateral.input,
    debt.input,
    positionAction,
  ])

  return (
    <>
      <Card sx={{ maxWidth: "500px", margin: "auto" }}>
        <CardContent sx={{ width: "100%", p: "1.5rem 2rem" }}>
          <BorrowHeader
            chainName={chainName(debt.chainId)}
            managePosition={props.managePosition}
            action={positionAction}
            onPositionActionChange={(action) => setPositionAction(action)}
          />
          <BorrowBox
            mb="1rem"
            managePosition={props.managePosition}
            label="Collateral from"
            type="collateral"
            chainId={collateral.chainId}
            disableChainChange={isBorrowing}
            onChainChange={(chainId) => changeCollateralChain(chainId)}
          />
          <BorrowBox
            managePosition={props.managePosition}
            label="Borrow to"
            type="borrow"
            chainId={debt.chainId}
            disableChainChange={isBorrowing}
            onChainChange={(chainId) => changeBorrowChain(chainId)}
          />

          <Stack
            direction="row"
            m="1rem 0"
            justifyContent="space-between"
            onClick={() => {
              availableRoutes.length > 0 &&
                !onMobile &&
                address &&
                setShowRoutingModal(true)
            }}
            sx={{ cursor: address && "pointer" }}
          >
            <Typography variant="small">Route</Typography>
            <Typography variant="small">
              <u>{`${chainName(collateral.chainId)} > ${chainName(
                debt.chainId
              )}`}</u>
            </Typography>
          </Stack>
          <Box mb="1rem">
            <Fees />
          </Box>

          <BorrowButton
            address={address}
            collateralChainId={collateral.chainId}
            walletChain={walletChain}
            collateralAmount={collateralAmount}
            debtAmount={debtAmount}
            balance={balance}
            ltv={ltv}
            ltvMax={ltvMax}
            collateralAllowance={collateral.allowance?.value}
            collateralToken={collateral.token}
            metaStatus={metaStatus}
            isSigning={isSigning}
            isExecuting={isBorrowing}
            availableVaultStatus={availableVaultStatus}
            mode={mode}
            managePosition={props.managePosition}
            hasBalance={hasBalance}
            onLoginClick={login}
            onChainChangeClick={() => changeChain(collateral.token.chainId)}
            onApproveClick={() => setShowApprovalModal(true)}
            onPositionClick={() => console.log("redirect to position")}
            onClick={signAndBorrow}
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
