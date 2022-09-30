import { task } from "hardhat/config";
import * as fs from "fs";

export default task("generate", "Create a wallet for builder deploys")
  .addParam("password", "The password for this wallet")
  .setAction(async (taskArgs: any, { ethers }) => {
    const newWallet = ethers.Wallet.createRandom();
    const address = newWallet.address;
    const mnemonic = newWallet.mnemonic.phrase;
    console.log(taskArgs.password);
    const encryptedWallet = await newWallet.encrypt(taskArgs.password);
    console.log("🔐 Account Generated as " + address + " and mnemonic stored in packages/protocol/<address>.txt");
    fs.writeFileSync("./" + address + ".txt", `${address}\n${mnemonic.toString()}\n${newWallet.privateKey}`);
    fs.writeFileSync(`newWallet.json`, encryptedWallet);
  });