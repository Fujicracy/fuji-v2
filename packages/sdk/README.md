// NOTE: Vault is an instance on a single chain, i.e. its collateral and debt token are from the same chain.

## Flow

### Init

```
  // import all chains and chainIds

  // init sdk
  const sdk = new Sdk({ infuraId: INFURA_ID });
```

### Chains and tokens selection

**For collateral**

```
  // user selects chainA or chainA is selected by default
  // fetch collateral tokens available on chainA

  const collaterals = sdk.getCollateralForChain(chainId);

  // user selects a "token1" as collateral
```

**For debt**

```
  // user selects chainB or chainB is selected by default
  // fetch debt tokens available on chainB

  const debts = sdk.getDebtForChain(chainId);

  // user selects a "token2" as debt
```

### Vault data

```
  // 1. get an instance of "vault"

  const vault = await sdk.getBorrowingVaultFor(token1, token2);

  // if vault is undefined, display error

  // 2. pre-load some data for the vault so that it's available for a later use

  await vault.preLoad(user);

  // pre-load makes available vault.maxLtv and vault.liqRatio
  // that can be used to calculate health ratio and 
  // liquidation price based on the amounts inputs below

  // 3. get user deposit and borrow balances for this Vault

  const { deposit, borrow } = await vault.getBalances(user);

  // if they are not 0, they have to be used in the health ratio and liquidation price math,
  // together with the amouts that the user has input

  // 4. TODO get prices of collateral and debt token in $

  const { collateralPrice, debtPrice } = await vault.getPrices();

  // 5. fetch providers for this vault and their rates

  const providers = await vault.getProviders();
```

### Amounts

```
  // user inputs "amount1" and "amount2"

  // check if there's enough allowance for token1 and amount1

  await sdk.getAllowanceOf(token1, user);
  if (needApproval) {
    // approve token1
  }
```

### Transation

```
  const srcChainId = token1.chainId
  // TODO for cost
  const { actions, cost } = await vault.previewDepositAndBorrow(amount1, amount2, srcChainId);

  // verify if user needs to sign a permit
  if (sdk.needPermit(actions)) {
    const permitAction = actions.find(PERMIT_BORROW || PERMIT_WITHDRAW)
    const digest = await vault.signPermitFor(permitAction)

    const signature = await ethers.signMessage(digest)
  }

  // TODO
  const txData = await vault.getTXDataFor(actions, signature?)
```

### Misc

```
  // TODO
  getPriceOf(Currency, ChainId) -> Price

  ---

  class SDK {
    // TODO
    // if account has a position on srcChain or destChain, return the corresponding vault
    // else return the vault with the lowest APR for currencyOut
    getDefaultVaultFor(currencyIn, currencyOut, srcChain, destChain) {
      // determine chain
      return new Vault(this, currencyIn, currencyOut, chain)
    }
  }
```

## CASE: Borrowing (DRAFTS, Ignore this!)

--- SIGN ---

  ```
  // if no vault specified, then choose the vault with the highest risk score
  // returns: digest to be used to sign a message with wallet
  sign(owner, currency, amount, destChain, vault?) -> SigDigest
```

--- DEPOSIT AND BORROW ---

```
  // determines the most optimal sequence of actions
  // estimates costs
  // if no vault specified, then choose the vault with the highest risk score
  // returns: actions, cost and txData to be used in sendTransaction()

  previewDepositAndBorrow(currencyIn, amountIn, currencyOut, amountOut, srcChain, destChain, signature, vault?)
    -> actions: (Action, ChainId, Currency, Amount, LendingProvider?)[]
    -> cost: Cost
    -> txData: TxData (router address, data, value)

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
```

--- PAYBACK AND WITHDRAW ---

```
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()

  previewPaybackAndWithdraw(amountIn, amountOut, srcChain, destChain, signature, vault)
    -> actions: (Action, ChainId, Currency, Amount, LendingProvider?)[]
    -> cost: Cost
    -> txData: TxData (router address, data, value)

  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to payback and withdraw, they must already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [PAYBACK, PERMIT-WITHDRAW, WITHDRAW, X-TRANSFER]
  //    B. if open position on destChain
  //      [X-TRANSFER-WITH-CALL, PAYBACK, PERMIT-WITHDRAW, WITHDRAW]
```

--- DEPOSIT ---

```
  // assuming account already has an open position so we must specify the vault
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()

  previewDeposit(amountIn, srcChain, destChain, vault)

  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to only deposit, we assume they already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [DEPOSIT]
  //    B. if open position on destChain
  //      [X-TRANSFER-WITH-CALL, DEPOSIT]
```

--- BORROW ---

```
  // account must already have an open position so the vault must be specified
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()

  previewBorrow(amountOut, srcChain, destChain, signature, vault)

  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to only borrow, they must already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [PERMIT-BORROW, BORROW, X-TRANSFER]
  //    B. if open position on destChain
  //      [X-CALL, PERMIT-BORROW, BORROW]
```

--- PAYBACK ---

```
  // account must already have an open position so the vault must be specified
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()

    previewPayback(amountIn, srcChain, destChain, vault)

  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to payback, they must already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [PAYBACK]
  //    B. if open position on destChain
  //      [X-TRANSFER-WITH-CALL, PAYBACK]
```

--- WITHDRAW ---

```
  // account must already have an open position so the vault must be specified
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()

    previewWithdraw(amountOut, srcChain, destChain, signature, vault)

  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to withdraw, they must already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [PERMIT-WITHDRAW, WITHDRAW]
  //    B. if open position on destChain (optional: transfer withdrawn funds back to srcChain)
  //      [X-CALL, PERMIT-WITHDRAW, WITHDRAW, X-TRANSFER?]
```

--- FLASHCLOSE ---

```
  // account must already have an open position so the vault must be specified
  // estimates costs
  // returns: actions, cost and txData to be used in sendTransaction()
    previewFlashClose(amountOut, srcChain, destChain, signature, vault)
  //  I. First-time (no open positions on srcChain and destChain)
  //    - N/A: if the account wants to withdraw, they must already have an open position
  //  II. Follow-up
  //    A. if open position on srcChain
  //      [FLASHLOAN, [PAYBACK, WITHDRAW, SWAP]]
  //    B. if open position on destChain (optional: transfer withdrawn funds back to srcChain)
  //      [X-CALL, FLASHLOAN, [PAYBACK, PERMIT-WITHDRAW, WITHDRAW, SWAP], X-TRANSFER?]
```
