export const fetchGuardedLaunchAddresses = async () => {
  let addresses: string[] = [];

  await import('../constants/guardedLaunchAddresses')
    .then((result) => {
      addresses = result?.guardedLaunchAddresses || [];
    })
    .catch();

  return addresses;
};
