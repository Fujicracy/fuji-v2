import { validateAndParseAddress } from './functions/validateAndParseAddress';

export class SDK {
  public account: string;

  public constructor(account: string) {
    this.account = validateAndParseAddress(account);
  }

  public setAccount(address: string): string {
    const validAddress = validateAndParseAddress(address);
    this.account = validAddress;

    return this.account;
  }
}
