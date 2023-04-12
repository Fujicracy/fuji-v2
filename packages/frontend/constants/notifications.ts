export enum NOTIFICATION_MESSAGES {
  ALLOWANCE_FAILURE = 'Allowance was not successful',
  ALLOWANCE_SUCCESS = 'Allowance is successful',
  SIGNATURE_PENDING = 'Please, sign the permit from your wallet',
  SIGNATURE_CANCELLED = 'You rejected signing the permit',
  POSITIONS_FAILURE = `We're having a hard time fetching some on-chain data and some of the positions may be inaccurate`,
  TX_CANCELLED = 'You rejected the transaction',
  TX_SENT = 'Your transaction was submitted successfully and is waiting to get confirmed',
  TX_FAILURE = 'Your transaction failed. Please, try again later or ask for help in DISCORD',
  TX_SUCCESS = 'Your transaction was executed successfully',
  TX_CROSSCHAIN = 'Your transaction was executed successfully on %CHAIN1% and it also needs to get confirmed on %CHAIN2%',
  UNEXPECTED_UNDEFINED = 'Unexpected undefined value',
}

export function formatCrosschainNotificationMessage(
  chain1: string,
  chain2: string
): string {
  return NOTIFICATION_MESSAGES.TX_CROSSCHAIN.replace(
    '%CHAIN1%',
    chain1
  ).replace('%CHAIN2%', chain2);
}
