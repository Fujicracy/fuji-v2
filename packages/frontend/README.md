This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

```
touch .env.local
echo "NEXT_PUBLIC_INFURA_KEY=<your key>" >> .env.local
echo "NEXT_PUBLIC_APP_ENV=development" >> .env.local
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Testing

Please note that testing is a WIP feature. We setup [synpress](https://github.com/synthetixio/synpress) but are having a few bugs (i.e., can't use watch mode aka `yarn test:watch` in our package).

```bash
# in your .env

SECRET_WORDS=<seed phrase, space separated>
NETWORK_NAME=Gnosis
RPC_URL=https://rpc.gnosischain.com/
CHAIN_ID=100
SYMBOL=xDAI
```

⚠️ RN it looks like there is a bug if you use "mainnet" as network name (changeMetamaskNetwork never ends or if you put it in .env setupMetamask never finish), so I suggest using `Polygon` or `Fantom` instead.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Store

We use [zustand](https://github.com/pmndrs/zustand) as our primary store for our application. It's easy to use and understand, but there are a few drawbacks.

### Drawbacks and common problems

1. Handling multiple changes with dependencies between values

The major drawback is, compared to writing logic in a component: when an action changes the state, you have to manually run dependencies (i.e., computed properties or data that need to be re-fetched -because they depend on something that has changed). This action is a good demonstration:

```ts
changeAssetChain(type, chainId, updateVault) {
  const tokens =
    type === "debt"
      ? sdk.getDebtForChain(chainId)
      : sdk.getCollateralForChain(chainId)

  set(
    produce((state: BorrowState) => {
      const t = type === "debt" ? state.debt : state.collateral
      t.chainId = chainId
      t.selectableTokens = tokens
      t.token = tokens[0]
    })
  )
  get().updateTokenPrice(type)
  get().updateBalances(type)

  if (updateVault) {
    get().updateVault()
  } else {
    get().updateTransactionMeta()
  }

  get().updateAllowance(type)
},
```

I wrote most of the store with this logic: `changeXX` is a primary value, and `upateXX` is an action to change a secondary - computed / fetched - value.

⚠️ On the code above we can do `Promise.all()` but sometimes it's not possible; i.e., when `updateXX` uses another value that will change async. In that case you need to do it sequentially.

Nothing difficult here, but it can be hard to debug, and you have to be careful not falling into infinite loop of call.

2. Computing properties

`Zustand` does not come out of the box with a way to computed properties. You have several way to do it: using sub hooks, with selectors...

Read this [discussion](https://github.com/pmndrs/zustand/discussions/1384#discussion-4499797) for a summary.

3. Typing

Stores can and must be typed, but the way typing is implemented by `zustand` is tricky and hard to understand. Honestly, it's a bad DX, but there's nothing we can do about it.

Read our codebase and the official zustand/typescript documentation.

### Structure

We had some problems (like [this one](https://github.com/pmndrs/zustand/discussions/1409) and decided not to use the slice pattern at all.

```
stores
├── auth
├── borrow
├── history
└── snackbar
```

## File organization

After several discussions, we came up with a conclusion: the classic way of organizing files in a `next.js` app can easily lead to messy code (i.e., a folder for all components and a folder for pages).

So we tried to follow a modular approach:

```
components
├── Borrow/
├── Markets/
├── Shared/
└── Theming/
```

- `Borrow/` is a folder that contains all the components specific to the `/borrow` page. You can think of it as a "module", but without encapsulation (components are simply exported).
- `Markets/` contains all the components specific to the `/markets` page. Same as above.
- `Shared/` are big or small shared component.
- `Theming/` is a legacy we built at the beginning of the app, this way we can visualize the components of the design system. We will probably replace with `Storybook`.

## SDK

Because of the high complexity of Fuji's smart contracts, part of the business logic has been abstracted by our package called `Sdk`. It's basically a proxy between our react app and the smart contracts.

To know more about it and how to use it, please read the README within `packages/sdk/` folder.

## Quick look on how things works

There are 4 different pages:

```
- markets/       represents available Fuji markets
- borrow/        represents the borrow form to create a new position
- my-positions/  lists all of the user open positions
  - my-positions/{chainId}-{vaultAddr}  manage an open position
```

![schema](./drawio.svg)
