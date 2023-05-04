import { SerializableToken } from './history';
import { getTokenImage } from './paths';

declare const ethereum: any; // eslint-disable-line

export const addTokenToMetamask = async (token: SerializableToken) => {
  if (!ethereum) {
    throw 'var ethereum is undefined, user may not have mmask';
  }
  const { symbol, decimals, address } = token;
  const { protocol, host } = window.location;
  const image = `${protocol}${host}${getTokenImage(token.symbol)}`;

  const success = await ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20', // Initially only supports ERC20, but eventually more!
      options: {
        address: address,
        symbol,
        decimals,
        image,
      },
    },
  });

  if (!success) {
    throw 'await ethereum.request is false or undefined';
  }
};
