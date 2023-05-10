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
    // `poktId` is optional, but if provided, it will take precedence over Infura
    poktId: POKT_ID
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
  const balancesDebt = await sdk.getTokenBalancesFor(debts, account, chainId);

  // user selects a "token2" as debt
```

### Vault data

_Vault is an instance on a single chain, i.e. its collateral and debt token are from the same chain._

1. Get all "Vault" for a given combo of tokens

```
  const vaultsResult = await sdk.getBorrowingVaultsFor(token1, token2);
  if (vaultsResult.success) {
    const vaults = vaultsResult.data;
    // vaults are sorted, starting by this with the lowest borrow rate
    // or if token1 and token2 are on the same chain, the first vault will
    // be on that chain

    const vault = vaults[0];
  }
```

2. Pre-load some data for the vault so that it's available for a later use

```
  await vault.preLoad();

  // pre-load makes available vault.maxLtv and vault.liqRatio
  // that can be used to calculate health ratio and
  // liquidation price based on the amounts inputs below
```

3. Get user deposit and borrow balances for this Vault

```
  const balanacesResult = await vault.getBalances(user);
  if (balanacesResult.success) {
    ...
    const { deposit, borrow } = balanacesResult.data;

    // if they are not 0, they have to be used in the health ratio and liquidation price math,
    // together with the amouts that the user has input
  }
```

4. Get prices of collateral and debt token in $

```
  const [collateralResult, debtResult] = Promise.all([token1.getPriceUSD(), token2.getPriceUSD()]);
  if (collateralResult.success) {
    ...
  }
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

### Transaction

```
  // Note: cost and estimateTime are hardcoded
  const { steps, actions, bridgeFees, estimateTime } = await sdk.previews.get({
    name: PreviewName.DEPOSIT_AND_BORROW,
    vault,
    srcChainId,
    amountIn: amount1,
    amountOut: amount2,
    tokenIn: token1,
    tokenOut: token2,
    account: user
  });

  // verify if user needs to sign a permit
  if (Sdk.needPermit(actions)) {
    const permitAction = Sdk.findPermitAction(actions)

    // signing the permit action has to be done through the vault
    const { domain, types, value } = await vault.signPermitFor(permitAction)

    const signature = await signer.signMessage(domain, types, value)
  }

  const result = await sdk.getTxDetails(actions, srcChainId, user, signature?);
  if (!result.success) {
    // display error
  }
  const txRequest = result.data;
  const tx = await signer.sendTransaction(txRequest);
  const receipt = await tx.wait();

  if (isCrossChain) {
    // poll every N seconds the following method to get the destination transaction hash
    const result = await sdk.getConnextTxDetails(srcChainId, receipt.transactionHash);
    if (!result.success) {
      // display error
      return;
    }
    if (result.data.status === PENDING || result.data.status === UNKNOWN) {
      // poll again
    }
  }
```
