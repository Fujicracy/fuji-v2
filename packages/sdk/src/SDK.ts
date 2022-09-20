import { Currency } from './entities';
import { validateAndParseAddress } from './functions/validateAndParseAddress';

export class SDK {
  public account: string;

  public constructor(account: string) {
    this.account = validateAndParseAddress(account);
  }

  public getDefaultVaultFor(
    currencyIn: Currency,
    currencyOut: Currency,
    srcChainId: number,
    destChainId: number
  ) {
    currencyIn;
    currencyOut;
    srcChainId;
    destChainId;
    // determine "chain"
    // new Vault(this, currencyIn, currencyOut, chain);
  }

  public setAccount(address: string): string {
    const validAddress = validateAndParseAddress(address);
    this.account = validAddress;

    return this.account;
  }
}
