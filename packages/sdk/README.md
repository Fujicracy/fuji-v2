# Fuji SDK

## Flow

### Init

```
  // import all chains and chainIds

  // init sdk
  const sdk = new Sdk({
    infuraId: INFURA_ID,
    // If you use streams, then you should set up Alchemy
    // because streams rely on web sockets and Infura doesn't
    // provide ws for its supported chains. On the other side,
    // Alchemy requires a different ID for each chain
    alchemy: {
      1: ETHEREUM_ALCHEMY_ID,
      5: GOERLI_ALCHEMY_ID,
      10: OPTIMISM_ALCHEMY_ID,
      137: POLYGON_ALCHEMY_ID,
      42161: ARBITRUM_ALCHEMY_ID,
      80001: POLYGON_MUMBAI_ALCHEMY_ID,
    },
  });
```

### Chains and tokens selection

**For collateral**

```
  // user selects chainA or chainA is selected by default
  // fetch collateral tokens available on chainA

  const collaterals = sdk.getCollateralForChain(chainId);

  // get balances of the user for each of the token
  const balancesCollateral = await sdk.getBatchTokenBalances(collaterals, account, chainId);

  // user selects a "token1" as collateral
```

**For debt**

```
  // user selects chainB or chainB is selected by default
  // fetch debt tokens available on chainB

  const debts = sdk.getDebtForChain(chainId);

  // get balances of the user for each of the token
  const balancesDebt = await sdk.getBatchTokenBalances(debts, account, chainId);

  // user selects a "token2" as debt
```

### Vault data
_Vault is an instance on a single chain, i.e. its collateral and debt token are from the same chain._

1. Get an instance of a "Vault"
```
  const vault = await sdk.getBorrowingVaultFor(token1, token2);

  // if vault is undefined, display error
```

2. Pre-load some data for the vault so that it's available for a later use
```
  await vault.preLoad(user);

  // pre-load makes available vault.maxLtv and vault.liqRatio
  // that can be used to calculate health ratio and 
  // liquidation price based on the amounts inputs below
```

3. Get user deposit and borrow balances for this Vault
```
  const { deposit, borrow } = await vault.getBalances(user);

  // if they are not 0, they have to be used in the health ratio and liquidation price math,
  // together with the amouts that the user has input
```

4. Get prices of collateral and debt token in $
```
  const collateralPrice = await token1.getPriceUSD();
  const debtPrice = await token2.getPriceUSD();
```

5. fetch providers for this vault and their rates
```
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
  // TODO for cost
  const { actions, cost } = await sdk.previewDepositAndBorrow(vault, amount1, amount2, srcChainId, destChain, user);

  // verify if user needs to sign a permit
  if (sdk.needPermit(actions)) {
    const permitAction = actions.find(PERMIT_BORROW || PERMIT_WITHDRAW)

    // signing the permit action has to be done through the vault
    const digest = await vault.signPermitFor(permitAction)

    const signature = await ethers.signMessage(digest)
  }

  const txRequest = await vault.getTxDetails(actions, srcChainId, user, signature?)
  await ethers.sendTransaction(txRequest);
```

### Misc

```
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
