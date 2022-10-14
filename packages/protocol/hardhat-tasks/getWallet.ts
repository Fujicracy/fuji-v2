import 'dotenv/config';

import * as ethers from 'ethers';
import { Wallet } from 'ethers';
import * as fs from 'fs';

const readWallet = (walletPath: string): Wallet => {
  let walletJson: JSON;
  let walletPass: string;
  if (fs.existsSync(walletPath)) {
    walletJson = JSON.parse(fs.readFileSync(walletPath).toString());
    if (!process.env.WALLET_PASSWORD) {
      throw 'Missing PRIVATE_KEY OR WALLET_PASSWORD in .env';
    } else {
      walletPass = process.env.WALLET_PASSWORD;
    }
  } else {
    throw 'Missing deployer.json file in root';
  }
  return ethers.Wallet.fromEncryptedJsonSync(
    JSON.stringify(walletJson),
    walletPass
  );
};

export const mnemonic = (walletPath: string): string => {
  const wallet: Wallet = readWallet(walletPath);
  console.log('here');
  return wallet.mnemonic.phrase;
};

export const getWalletAddress = (walletPath: string): string => {
  const wallet: Wallet = readWallet(walletPath);
  return wallet.address;
};
