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
import Fees from "./Fees"
import ApprovalModal from "./ApprovalModal"
import RoutingModal from "./Routing/RoutingModal"
import { useHistory } from "../../store/history.store"
import { chainName } from "../../helpers/chains"
import { useBorrow } from "../../store/borrow.store"
import { useAuth } from "../../store/auth.store"
import BorrowButton from "./Button"
import BorrowHeader from "./Header"
import BorrowBox from "./Box/Box"
import ConnextFooter from "./ConnextFooter"
import { modeForContext, PositionAction } from "../../helpers/borrow"
import { Address } from "@x-fuji/sdk"
import { useRouter } from "next/router"
import { navigateToVault } from "../../helpers/navigation"
import { Position } from "../../store/models/Position"

type BorrowProps = {
  managePosition: boolean
  futurePosition?: Position
}
function Borrow({ managePosition, futurePosition }: BorrowProps) {
  const router = useRouter()
  const theme = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("md"))

  const address = useAuth((state) => state.address)
  const walletChain = useAuth((state) => state.chain)
  const changeChain = useAuth((state) => state.changeChain)
  const login = useAuth((state) => state.login)

  const balance = useBorrow(
    (state) => state.collateral.balances[state.collateral.token.symbol]
  )
  const collateral = useBorrow((state) => state.collateral)
  const debt = useBorrow((state) => state.debt)
  const ltvMeta = useBorrow((state) => state.ltv)
  const isSigning = useBorrow((state) => state.isSigning)
  const isExecuting = useBorrow((state) => state.isExecuting)
  const metaStatus = useBorrow((state) => state.transactionMeta.status)
  const availableVaultStatus = useBorrow((state) => state.availableVaultsStatus)
  const availableRoutes = useBorrow((state) => state.availableRoutes)
  const vault = useBorrow((state) => state.activeVault)
  const mode = useBorrow((state) => state.mode)
  const changeMode = useBorrow((state) => state.changeMode)
  const updateBalance = useBorrow((state) => state.updateBalances)
  const updateVault = useBorrow((state) => state.updateVault)
  const updateAllowance = useBorrow((state) => state.updateAllowance)
  const updateTokenPrice = useBorrow((state) => state.updateTokenPrice)
  const signAndExecute = useBorrow((state) => state.signAndExecute)

  const currentTxHash = useHistory((state) => state.inModal)
  const closeModal = useHistory((state) => state.closeModal)

  const collateralAmount = parseFloat(collateral.input)
  const debtAmount = parseFloat(debt.input)

  const dynamicLtvMeta = futurePosition
    ? {
        ltv: futurePosition.ltv,
        ltvMax: futurePosition.ltvMax,
        ltvThreshold: futurePosition.ltvThreshold,
      }
    : ltvMeta

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRoutingModal, setShowRoutingModal] = useState(false)
  const [positionAction, setPositionAction] = useState(PositionAction.ADD)
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
      if (address && vault && !managePosition) {
        // Poor implementation, needs to be more complex and probably grab the associated position
        const balance = await vault.getBalances(Address.from(address))
        const hasBalance =
          balance.deposit.toNumber() > 0 || balance.borrow.toNumber() > 0
        setHasBalance(hasBalance)
      }
    })()
  }, [address, vault, managePosition])

  useEffect(() => {
    const mode = modeForContext(
      managePosition,
      positionAction,
      Number(collateral.input),
      Number(debt.input)
    )
    changeMode(mode)
  }, [changeMode, managePosition, collateral.input, debt.input, positionAction])

  return (
    <>
      <Card sx={{ maxWidth: "500px", margin: "auto" }}>
        <CardContent sx={{ width: "100%", p: "1.5rem 2rem" }}>
          <BorrowHeader
            chainName={chainName(debt.chainId)}
            managePosition={managePosition}
            action={positionAction}
            onPositionActionChange={(action) => setPositionAction(action)}
          />
          {[collateral, debt].map((assetChange, index) => {
            const type = index === 0 ? "collateral" : "debt"
            return (
              <BorrowBox
                key={type}
                type={type}
                assetChange={assetChange}
                managePosition={managePosition}
                chainId={assetChange.chainId}
                isExecuting={isExecuting}
                value={assetChange.input}
                ltvMeta={dynamicLtvMeta}
              />
            )
          })}

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
            collateral={collateral}
            walletChain={walletChain}
            collateralAmount={collateralAmount}
            debtAmount={debtAmount}
            balance={balance}
            ltvMeta={dynamicLtvMeta}
            metaStatus={metaStatus}
            isSigning={isSigning}
            isExecuting={isExecuting}
            availableVaultStatus={availableVaultStatus}
            mode={mode}
            managePosition={managePosition}
            hasBalance={hasBalance}
            onLoginClick={login}
            onChainChangeClick={() => changeChain(collateral.token.chainId)}
            onApproveClick={() => setShowApprovalModal(true)}
            onPositionClick={() => {
              navigateToVault(router, walletChain?.id, vault, false)
            }}
            onClick={signAndExecute}
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

export default Borrow

Borrow.defaultProps = {
  position: false,
}
