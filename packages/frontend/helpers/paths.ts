export const getTokenImage = (symbol: string) => getAsset('tokens', symbol);
export const getProviderImage = (providerName: string) =>
  getAsset('providers', providerName);
export const getNetworkImage = (networkName: string) =>
  getAsset('networks', networkName);

const getAsset = (path: string, name: string) =>
  `/assets/images/protocol-icons/${path}/${name}.svg`.replace(/ /g, '%20');
