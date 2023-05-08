import { Sdk } from '@x-fuji/sdk';

const sdkInitOptions = {
  infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  alchemy: {},
  poktId: process.env.NEXT_PUBLIC_POKT_KEY
    ? `${process.env.NEXT_PUBLIC_POKT_KEY}`
    : undefined,
  defillamaproxy: '/proxy/defillama/',
};
export const sdk = new Sdk(sdkInitOptions);
