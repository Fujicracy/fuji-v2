export enum NOTIFICATION_MESSAGES {
  ALLOWANCE_FAILURE = 'Approval was not successful.',
  ALLOWANCE_SUCCESS = 'Approval succeeded.',
  ONCHAIN_FAILURE = `We're having a hard time fetching on-chain data and some information may be inaccurate.`,
  SIGNATURE_PENDING = 'Please, sign the permit from your wallet.',
  SIGNATURE_CANCELLED = 'You rejected signing the permit.',
  TX_INSUFFICIENT_FUNDS = 'Insufficient funds to pay for gas.',
  TX_CANCELLED = 'You rejected the transaction.',
  TX_PENDING = 'The transaction is waiting for you to confirm in your wallet.',
  TX_SENT = 'Your transaction was submitted successfully and is waiting to get confirmed.',
  TX_NOT_SENT = 'Your transaction cannot be sent. Please, try again later or ask for assistance.',
  TX_FAILURE = 'Your transaction failed. Please, try again later or ask for assistance.',
  TX_SUCCESS = 'Your transaction was executed successfully.',
  TX_CROSSCHAIN = 'Your transaction was executed successfully on %CHAIN1% and it also needs to get confirmed on %CHAIN2%.',
  UNEXPECTED_UNDEFINED = 'Unexpected undefined value.',
}

export const formatCrosschainNotificationMessage = (
  chain1: string,
  chain2: string
): string =>
  NOTIFICATION_MESSAGES.TX_CROSSCHAIN.replace('%CHAIN1%', chain1).replace(
    '%CHAIN2%',
    chain2
  );

export const formatOnchainNotificationMessage = (chain?: string): string =>
  chain
    ? NOTIFICATION_MESSAGES.ONCHAIN_FAILURE.replace('on-chain', chain)
    : NOTIFICATION_MESSAGES.ONCHAIN_FAILURE;
