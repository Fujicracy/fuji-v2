```
type Signature = { v, r, s, deadline }
```

Actions:
  - DEPOSIT
  - BORROW
  - PAYBACK
  - WITHDRAW
  - PERMIT-BORROW
  - PERMIT-WITHDRAW
  - FLASHLOAN
  - X-TRANSFER-WITH-CALL
  - X-TRANSFER
  - X-CALL

## Getters

getBalanceOf(Address, Currency, ChainId) -> Amount (BigInt?)

getAllowanceOf(Address, Currency, ChainId) -> Amount

getPriceOf(Currency, ChainId) -> Price

getVaultsFor(Currency, Currency, ChainId, ChainId) -> Vault[]

getDefaultVaultFor(Currency, Currency, ChainId, ChainId) -> Vault

getActiveProvider(Vault, ChainId) -> LendingProvider (name, apr)

getProviders(Vault, ChainId) -> LendingProvider[]

---

class SDK {
  account: Address

  constructor(Address)

  // if account has a position on srcChain or destChain, return the corresponding vault
  // else return the vault with the lowest APR for currencyOut
  getDefaultVaultFor(currencyIn, currencyOut, srcChain, destChain) {
    // determine chain
    return new Vault(this, currencyIn, currencyOut, chain)
  }

  needPermit(actions): boolean {
    // deep iterate over actions to find PERMIT-BORROW or PERMIT-WITHDRAW
  }

  setAccount(Address)
}

class Vault {
  chain;
  currencyIn;
  currencyOut;

  constructor(readonly SDK, currencyIn, currencyOut, chain)

  sign()

  previewDepositAndBorrow(amountIn, amountOut, srcChain) {
    if (srcChain == chain) {
      [DEPOSIT, PERMIT-BORROW, BORROW]
    } else {
      [X-TRANSFER-WITH-CALL, DEPOSIT, PERMIT-BORROW, BORROW]
    }
  }

  getTXDataFor(actions, signature)
}

// init sdk with account's address that will be globally accesible
const sdk = new SDK(Address)

const vault = await sdk.getDefaultVaultFor(currencyIn, currencyOut, srcChain, destChain)

const { actions, cost, approval } = await vault.previewDepositAndBorrow(amountIn, amountOut, srcChain)

if (approval) {
  // approve token
}

let digest;
if (sdk.needPermit(actions)) {
  digest = await vault.sign("borrow", amountOut)
}

const signature = await ethers.signMessage(digest)

const txData = await vault.getTXDataFor(actions, signature)

## CASE: Borrowing

--- SIGN ---
// if no vault specified, then choose the vault with the highest risk score
// returns: digest to be used to sign a message with wallet
```
  sign(owner, currency, amount, destChain, vault?) -> SigDigest
```

--- DEPOSIT AND BORROW ---
// determines the most optimal sequence of actions
// estimates costs
// if no vault specified, then choose the vault with the highest risk score
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewDepositAndBorrow(currencyIn, amountIn, currencyOut, amountOut, srcChain, destChain, signature, vault?)
    -> actions: (Action, ChainId, Currency, Amount, LendingProvider?)[]
    -> cost: Cost
    -> txData: TxData (router address, data, value)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - checks borrow rate for currencyOut on srcChain and destChain
//    A. if borrow rate on srcChain < borrow rate on destChain
//      [DEPOSIT, PERMIT-BORROW, BORROW, X-TRANSFER]
//    B. if borrow rate on srcChain > borrow rate on destChain
//      [X-TRANSFER-WITH-CALL, DEPOSIT, PERMIT-BORROW, BORROW]
//  II. Follow-up
//    A. if open position on srcChain
//      [DEPOSIT, PERMIT-BORROW, BORROW, X-TRANSFER]
//    B. if open position on destChain
//      [X-TRANSFER-WITH-CALL, DEPOSIT, PERMIT-BORROW, BORROW]

--- PAYBACK AND WITHDRAW ---
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewPaybackAndWithdraw(amountIn, amountOut, srcChain, destChain, signature, vault)
    -> actions: (Action, ChainId, Currency, Amount, LendingProvider?)[]
    -> cost: Cost
    -> txData: TxData (router address, data, value)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to payback and withdraw, they must already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [PAYBACK, PERMIT-WITHDRAW, WITHDRAW, X-TRANSFER]
//    B. if open position on destChain
//      [X-TRANSFER-WITH-CALL, PAYBACK, PERMIT-WITHDRAW, WITHDRAW]

--- DEPOSIT ---
// assuming account already has an open position so we must specify the vault
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewDeposit(amountIn, srcChain, destChain, vault)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to only deposit, we assume they already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [DEPOSIT]
//    B. if open position on destChain
//      [X-TRANSFER-WITH-CALL, DEPOSIT]

--- BORROW ---
// account must already have an open position so the vault must be specified
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewBorrow(amountOut, srcChain, destChain, signature, vault)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to only borrow, they must already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [PERMIT-BORROW, BORROW, X-TRANSFER]
//    B. if open position on destChain
//      [X-CALL, PERMIT-BORROW, BORROW]

--- PAYBACK ---
// account must already have an open position so the vault must be specified
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewPayback(amountIn, srcChain, destChain, vault)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to payback, they must already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [PAYBACK]
//    B. if open position on destChain
//      [X-TRANSFER-WITH-CALL, PAYBACK]

--- WITHDRAW ---
// account must already have an open position so the vault must be specified
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewWithdraw(amountOut, srcChain, destChain, signature, vault)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to withdraw, they must already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [PERMIT-WITHDRAW, WITHDRAW]
//    B. if open position on destChain (optional: transfer withdrawn funds back to srcChain)
//      [X-CALL, PERMIT-WITHDRAW, WITHDRAW, X-TRANSFER?]

--- FLASHCLOSE ---
// account must already have an open position so the vault must be specified
// estimates costs
// returns: actions, cost and txData to be used in sendTransaction()
```
  previewFlashClose(amountOut, srcChain, destChain, signature, vault)
```
//  I. First-time (no open positions on srcChain and destChain)
//    - N/A: if the account wants to withdraw, they must already have an open position
//  II. Follow-up
//    A. if open position on srcChain
//      [FLASHLOAN, [PAYBACK, WITHDRAW, SWAP]]
//    B. if open position on destChain (optional: transfer withdrawn funds back to srcChain)
//      [X-CALL, FLASHLOAN, [PAYBACK, PERMIT-WITHDRAW, WITHDRAW, SWAP], X-TRANSFER?]
