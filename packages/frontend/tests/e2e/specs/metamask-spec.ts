describe("Metamask", () => {
  context("Test commands", () => {
    // Not needed cause the setup is done depending on what's in synpress config and .env
    // it(`setupMetamask should finish metamask setup using secret words`, () => {
    //   cy.setupMetamask(
    //     "shuffle stay hair student wagon senior problem drama parrot creek enact pluck",
    //     "goerli",
    //     "Tester@1234"
    //   ).then((setupFinished) => {
    //     expect(setupFinished).to.be.true
    //   })
    // })
    it(`disconnectMetamaskWalletFromDapp shouldn't fail if there are no dapps connected`, () => {
      cy.disconnectMetamaskWalletFromDapp().then((disconnected) => {
        expect(disconnected).to.be.true
      })
    })
    it(`disconnectMetamaskWalletFromAllDapps shouldn't fail if there are no dapps connected`, () => {
      cy.disconnectMetamaskWalletFromAllDapps().then((disconnected) => {
        expect(disconnected).to.be.true
      })
    })
    it(`acceptMetamaskAccess should accept connection request to metamask`, () => {
      cy.visit("/")
      // Note: web3 onboard is in a shadow root so we cannot use cy.get to click on buttons...
      localStorage.setItem("connectedWallets", '["MetaMask"]') // Workaround to autoconnect web3 onboard
      cy.get('[data-cy="login"]').click({ force: true })
      cy.acceptMetamaskAccess().then((connected) => {
        expect(connected).to.be.true
      })
    })
    it(`getNetwork should return network by default`, () => {
      cy.getNetwork().then((network: any) => {
        expect(network.networkName).to.be.equal("goerli")
        expect(network.networkId).to.be.equal(5)
        expect(network.isTestnet).to.be.true
      })
    })
    it(`addMetamaskNetwork should add custom networks`, () => {
      cy.addMetamaskNetwork({
        networkName: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
        chainId: "137",
        symbol: "MATIC",
        blockExplorer: "https://polygonscan.com",
        isTestnet: false,
      }).then((networkAdded) => {
        expect(networkAdded).to.be.true
      })
      // cy.get('[data-cy="chain"]').contains("Polygon")
    })
    it(`getNetwork should return valid network after adding a new network`, () => {
      cy.getNetwork().then((network: any) => {
        expect(network.networkName).to.be.equal("polygon")
        expect(network.networkId).to.be.equal(137)
        expect(network.isTestnet).to.be.false
      })
      // cy.get('[data-cy="chain"]').contains("Polygon")
    })
    //
    // I let the other test below as reference, we may need to reactivate them or simply
    // use them as examples
    //
    // it(`importMetamaskAccount should import new account using private key`, () => {
    //   cy.importMetamaskAccount(
    //     "69270203c33d9d54ffd9cfcd9be01a12259a6efe968db9f1d5728717a9ab9a17"
    //   ).then((imported) => {
    //     expect(imported).to.be.true
    //   })
    //   cy.get("#requestPermissions").click()
    //   cy.acceptMetamaskAccess()
    //   cy.get("#accounts").contains("0x210b7af5962af8ab4ac55d5800ef42e0b0c09e62")
    // })
    // it(`createMetamaskAccount should create new account with default name`, () => {
    //   cy.createMetamaskAccount().then((created) => {
    //     expect(created).to.be.true
    //   })
    // })
    // it(`createMetamaskAccount should create new account with custom name`, () => {
    //   cy.createMetamaskAccount("custom-wallet").then((created) => {
    //     expect(created).to.be.true
    //   })
    // })
    // it(`switchMetamaskAccount should switch to another account using order number`, () => {
    //   cy.switchMetamaskAccount(2).then((switched) => {
    //     expect(switched).to.be.true
    //   })
    // })
    // it(`getMetamaskWalletAddress should return wallet address of current metamask account`, () => {
    //   cy.getMetamaskWalletAddress().then((address) => {
    //     expect(address).to.be.equal(
    //       "0x210B7af5962af8Ab4ac55D5800Ef42e0B0c09e62"
    //     )
    //   })
    // })
    // it(`switchMetamaskAccount should switch to another account using account name`, () => {
    //   cy.switchMetamaskAccount("account 1").then((switched) => {
    //     expect(switched).to.be.true
    //   })
    // })
    // it(`getMetamaskWalletAddress should return valid wallet address of metamask account after changing an account`, () => {
    //   cy.getMetamaskWalletAddress().then((address) => {
    //     expect(address).to.be.equal(
    //       "0x352e559B06e9C6c72edbF5af2bF52C61F088Db71"
    //     )
    //   })
    // })
    // it(`activateCustomNonceInMetamask should activate custom nonce input field for transactions`, () => {
    //   cy.activateCustomNonceInMetamask().then((activated) => {
    //     expect(activated).to.be.true
    //   })
    // })
    // it(`resetMetamaskAccount should reset current account`, () => {
    //   cy.resetMetamaskAccount().then((resetted) => {
    //     expect(resetted).to.be.true
    //   })
    // })
    // it(`disconnectMetamaskWalletFromDapp should disconnect current account from current dapp (when already connected)`, () => {
    //   cy.get("#requestPermissions").click()
    //   cy.acceptMetamaskAccess()
    //   cy.disconnectMetamaskWalletFromDapp().then((disconnected) => {
    //     expect(disconnected).to.be.true
    //   })
    // })
    // it(`disconnectMetamaskWalletFromAllDapps should disconnect current account from all dapps (when already connected)`, () => {
    //   cy.get("#requestPermissions").click()
    //   cy.acceptMetamaskAccess()
    //   cy.disconnectMetamaskWalletFromAllDapps().then((disconnected) => {
    //     expect(disconnected).to.be.true
    //   })
    // })
    // it(`confirmMetamaskSignatureRequest should confirm signature request`, () => {
    //   cy.get("#requestPermissions").click()
    //   cy.acceptMetamaskAccess()
    //   cy.get("#personalSign").click()
    //   cy.confirmMetamaskSignatureRequest().then((confirmed) => {
    //     expect(confirmed).to.be.true
    //   })
    //   cy.get("#personalSignVerify").click()
    //   cy.get("#personalSignVerifySigUtilResult").contains(
    //     "0x352e559b06e9c6c72edbf5af2bf52c61f088db71"
    //   )
    // })
    // it(`confirmMetamaskSignatureRequest should confirm data signature request`, () => {
    //   cy.get("#signTypedDataV4").click()
    //   cy.confirmMetamaskDataSignatureRequest().then((confirmed) => {
    //     expect(confirmed).to.be.true
    //   })
    //   cy.get("#signTypedDataV4Verify").click()
    //   cy.get("#signTypedDataV4VerifyResult").contains("0x")
    // })
    // it(`rejectMetamaskEncryptionPublicKeyRequest should reject public encryption key request`, () => {
    //   cy.get("#getEncryptionKeyButton").click()
    //   cy.rejectMetamaskEncryptionPublicKeyRequest().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    //   cy.get("#encryptionKeyDisplay").contains(
    //     "Error: MetaMask EncryptionPublicKey: User denied message EncryptionPublicKey."
    //   )
    // })
    // it(`confirmMetamaskEncryptionPublicKeyRequest should confirm public encryption key request`, () => {
    //   cy.get("#getEncryptionKeyButton").click()
    //   cy.confirmMetamaskEncryptionPublicKeyRequest().then((confirmed) => {
    //     expect(confirmed).to.be.true
    //   })
    //   cy.get("#encryptionKeyDisplay").contains(
    //     "PF4wuX6QqcIKdCzructa1JlY/LninxRWFdMThIDIJEU="
    //   )
    // })
    // it(`confirmMetamaskDecryptionRequest should confirm request to decrypt message with private key`, () => {
    //   cy.get("#encryptMessageInput").type("test message")
    //   cy.get("#encryptButton").click()
    //   cy.get("#ciphertextDisplay").contains("0x7")
    //   cy.get("#decryptButton").click()
    //   cy.confirmMetamaskDecryptionRequest().then((confirmed) => {
    //     expect(confirmed).to.be.true
    //   })
    //   cy.get("#cleartextDisplay").contains("test message")
    // })
    // it(`rejectMetamaskDecryptionRequest should reject request to decrypt message with private key`, () => {
    //   cy.get("#decryptButton").click()
    //   cy.rejectMetamaskDecryptionRequest().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    //   cy.get("#cleartextDisplay").contains(
    //     "Error: MetaMask Decryption: User denied message decryption."
    //   )
    // })
    // it(`rejectMetamaskSignatureRequest should reject signature request`, () => {
    //   cy.get("#personalSign").click()
    //   cy.rejectMetamaskSignatureRequest().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    //   cy.get("#personalSign").contains("User denied message signature")
    // })
    // it(`rejectMetamaskDataSignatureRequest should confirm data signature request`, () => {
    //   cy.get("#signTypedDataV4").click()
    //   cy.rejectMetamaskDataSignatureRequest().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    //   cy.get("#signTypedDataV4Result").contains("User denied message signature")
    // })
    // it(`rejectMetamaskTransaction should reject transaction`, () => {
    //   cy.importMetamaskAccount(Cypress.env("PRIVATE_KEY_WITH_FUNDS"))
    //   cy.get("#requestPermissions").click()
    //   cy.acceptMetamaskAccess()
    //   cy.get("#createToken").click()
    //   cy.rejectMetamaskTransaction().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    //   cy.contains("#tokenAddress", "Creation Failed", { timeout: 60000 })
    // })
    // it(`confirmMetamaskTransaction should confirm transaction`, () => {
    //   cy.get("#createToken").click()
    //   cy.confirmMetamaskTransaction().then((confirmed) => {
    //     expect(confirmed).to.be.true
    //   })
    //   cy.contains("#tokenAddress", /0x.*/, { timeout: 60000 })
    //     .invoke("text")
    //     .then((text) => cy.log("Token hash: " + text))
    // })
    // it(`rejectMetamaskPermissionToSpend should reject permission to spend token`, () => {
    //   cy.get("#approveTokens").click()
    //   cy.rejectMetamaskPermissionToSpend().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    // })
    // it(`confirmMetamaskPermissionToSpend should approve permission to spend token`, () => {
    //   cy.get("#approveTokens").click()
    //   cy.confirmMetamaskPermissionToSpend().then((approved) => {
    //     expect(approved).to.be.true
    //   })
    // })
    // // todo: this feature is broken inside test-dapp, needs to be fixed (unable to switch to DAI chain)
    // it.skip(`rejectMetamaskToAddNetwork should reject permission to add network`, () => {
    //   cy.get("#addEthereumChain").click()
    //   cy.rejectMetamaskToAddNetwork().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    // })
    // it.skip(`allowMetamaskToAddNetwork should approve permission to add network`, () => {
    //   cy.get("#addEthereumChain").click()
    //   cy.allowMetamaskToAddNetwork("close").then((approved) => {
    //     expect(approved).to.be.true
    //   })
    // })
    // it.skip(`rejectMetamaskToSwitchNetwork should reject permission to switch network`, () => {
    //   cy.rejectMetamaskToSwitchNetwork().then((rejected) => {
    //     expect(rejected).to.be.true
    //   })
    // })
    // it.skip(`allowMetamaskToSwitchNetwork should approve permission to switch network`, () => {
    //   cy.get("#switchEthereumChain").click()
    //   cy.allowMetamaskToSwitchNetwork().then((approved) => {
    //     expect(approved).to.be.true
    //   })
    // })
  })
})
