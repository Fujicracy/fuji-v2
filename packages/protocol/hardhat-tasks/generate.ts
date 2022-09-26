import { task } from "hardhat/config";
import * as fs from "fs";

export default task("generate", "Create a wallet for builder deploys", async (_: any, { ethers }) => {
  const newWallet = ethers.Wallet.createRandom();
  const address = newWallet.address;
  const mnemonic = newWallet.mnemonic.phrase
  console.log("🔐 Account Generated as " + address + " and set as mnemonic in packages/protocol");
  fs.writeFileSync("./" + address + ".txt", `${address}\n${mnemonic.toString()}\n${newWallet.privateKey}`);
  fs.writeFileSync("./mnemonic.txt", mnemonic.toString());
});