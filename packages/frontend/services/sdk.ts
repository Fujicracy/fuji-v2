import { Sdk } from '@x-fuji/sdk';

const sdkInitOptions = {
  infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  alchemy: {},
  defillamaproxy: '/proxy/defillama/',
};
export const sdk = new Sdk(sdkInitOptions);
