export const storeOptions = (storeName: string) => {
  return {
    enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
    name: `fuji-v2/${storeName}`,
  };
};
