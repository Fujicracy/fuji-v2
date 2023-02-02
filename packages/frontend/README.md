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

Please note that testing is a WIP feature. We setup [synpress](https://github.com/synthetixio/synpress) but are having few bugs (i.e can't use watch mode aka `yarn test:watch` in our package).

```bash
# in your .env

PRIVATE_KEY=<testing-wallet-key>
NETWORK_NAME=polygon
```

⚠️ RN it looks like there is a bug if you use "mainnet" as network name (changeMetamaskNetwork never ends or if you put it in .env setupMetamask never finish), so I suggest to use `Polygon` or `Fantom` instead.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Store

We use [zustand](https://github.com/pmndrs/zustand) as our primary store for our application. This decision was taken because after a few tests I found zustand easy to use and to understand. But there are few drawbacks.

### Drawbacks and common problems

1. Handling multiple changes with dependancies between values

The major drawbacks is, compared to writing logic in a component: when an action change the state, you have to manually run dependancies (i.e computed properties or data that need to be refetched - because they depends on something that have changed). This action is a good demonstration:

```ts
  async changeCollateralChain(chainId) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    set(
      produce((state: TransactionState) => {
        state.collateralChainId = chainId
        state.collateralTokens = tokens
        state.position.collateral.token = tokens[0]
      })
    )
    return Promise.all([
      get().updateTokenPrice("collateral"),
      get().updateBalances("collateral"),
      get().updateVault(),
      get().updateAllowance(),
    ])
  },
```

I wrote most of the store with this logic: changeXX is a primary value, and upateXX is an action to change a secondary - computed / fetched - value.

⚠️ On the code above we can do `Promise.all()` but sometimes it's not possible; i.e when and "updateXX" use another value that will change async. In that case you need to do it sequentially.

Nothing difficult here, but it can be hard to debug, and you have to be careful not falling into infinite loop of call.

2. Computing properties

Zustand does not come out of the box with a way to computed properties. You have several way to do it: using sub hooks, with selectors...

I suggest you read this discussions that summurize my research on the subject

- https://github.com/pmndrs/zustand/discussions/1384#discussion-4499797

3. Typing

Store can and must be typed, but the way typing is implemented by zustand is tricky and hard to understand. Honnnestly it's a bad DX, but there's nothing we can do about it.

If you struggle I recommend reading what has already be done or the official [zustand/typescript documentation]()

Also if you have trouble typing slices you may want to check this: https://github.com/pmndrs/zustand/discussions/1409

4. Next steps

I recommend not using slice patten, but overall I found that zustand is a good tool.

## File organization

After several discussion, we came up with that conclusion: classic way of organizing file in next app can easily lead to a messy code (i.e a folder for all components and a folder for pages).

So we tried to do a more modular approach (still WIP):

```
components
├── Borrow/
├── Markets/
├── Layout/
└── Theming/
```

- `Borrow/` is a folder that contains all the components specific to the `/borrow` page. You can think of it as a "module", but without encapsulation (components are simply exported).
- - `Borrow/` is a folder that contains all the components specific to the `/markets` page. Same as above.
- `Layout/` are big or small component that are / may be used in different places of the application. Maybe we should consider renaming this folder as `shared/`
- `Theming/` is a legacy we build at the beginning of the app, this way we can visualize the components of the design system. When we have time we should remove or replace it by `storybook` if we feel we need it.

> Tbh, we're still at a very early stage so I don't think we need to but too much focus on having a design system. Better make it work first and refacto later.

You can also see that we have several components at the root of the folder, these are small and dumb components that are shared in the app. They are here because they didn't fit well in the others folder, but we can create a `dumb/` components folder or smth alike.

Overall, the organization of the files is up to you but you have to keep it consistent. I simply foster that we keep the "modular" solution for now, to avoid having 100 components in the same folder later on.

## SDK

Because of the high complexity of fuji smart contracts, part of the business logic has been abstracted by our package called `Sdk`. It's basically a proxy between our react app and smart contracts.

To know more about it and how to use it, please read the README within `packages/sdk/` folder.

## Quick look on how things works

You have 4 different pages:

```
- markets/       represent available fuji markets
- borrow/        represent the borrow form to create a new position
- my-positions/  list all the user open positions
  - my-positions/{chainId}-{vaultAddr}  manage an open position
```

![schema](./drawio.svg)
