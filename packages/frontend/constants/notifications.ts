export enum ERROR_MESSAGES {
  ALLOWANCE = 'Allowance was not successful',
  CANCEL_SIGNATURE = 'Signature was canceled by the user.',
  POSITIONS = `We're having a hard time fetching some on-chain data and some of the positions may be inaccurate`,
  TX = 'The transaction was canceled by the user or cannot be submitted.',
  TX_PROCESS = 'The transaction cannot be processed, please try again later.',
}

export enum SUCCESS_MESSAGES {
  ALLOWANCE = 'Allowance is successful',
  TX = 'The transaction was submitted successfully.',
}
