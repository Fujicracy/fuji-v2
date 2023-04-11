export enum NOTIFICATION_MESSAGES {
  ALLOWANCE_FAILURE = 'Allowance was not successful',
  ALLOWANCE_SUCCESS = 'Allowance is successful',
  SIGNATURE_PENDING = 'Please, sign the permit from your wallet',
  SIGNATURE_CANCELLED = 'You rejected signing the permit',
  POSITIONS_FAILURE = `We're having a hard time fetching some on-chain data and some of the positions may be inaccurate`,
  TX_CANCELLED = 'You rejected the transaction',
  TX_FAILURE = 'Your transaction failed. Please, try again later or ask for help in DISCORD',
  TX_SUCCESS = 'The transaction was submitted successfully.',
  UNEXPECTED_UNDEFINED = 'Unexpected undefined value',
}
