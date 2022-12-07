describe("Borrow", () => {
  before(() => {
    cy.visit("/borrow")
  })

  it("should display a connect button if the user is not connected", () => {
    cy.get('[data-cy="borrow-login"]')
      .should("exist")
      .and("contain.text", "Connect wallet")
  })

  it("should login", () => {
    cy.get('[data-cy="login"]').click({ force: true })
    cy.acceptMetamaskAccess().then((connected) => {
      expect(connected).to.be.true
    })
  })

  it("can click on MAX button to set input as value", () => {
    cy.get("#collateral-amount").should("have.value", "")
    cy.get('[data-cy="balance-amount"]')
      .invoke("text")
      .then((balance) => {
        cy.get('[data-cy="max-btn"]').click()
        cy.get("#collateral-amount").should(
          "have.value",
          parseFloat(balance.replace(/,/g, "."))
        )
      })
  })

  it("can select another collateral chain", () => {
    // Disable since we are using testnet only before launch
    // cy.get("#collateral-chain-select")
    //   .invoke("text")
    //   .then((chainName) => {
    //     cy.get("#collateral-chain-select").click()
    //     cy.get("body").type("{downArrow}{enter}")
    //     cy.get("#collateral-chain-select").should("not.contain.text", chainName)
    //   })
    // const chainList = ["Ethereum", "Polygon", "Fantom", "Arbitrum", "Optimism"]
    // for (const chain of chainList) {
    //   cy.get("#collateral-chain-menu ul")
    //     .children()
    //     .should("contain.text", chain)
    // }
  })

  it("can select any available token on the collateral chain", () => {
    // Disable because it may vary on testnets
    // cy.get("#select-collateral-button").should("contain.text", "WMATIC")
    // cy.get("#select-collateral-button").click()
    // const tokenList = ["WMATIC", "WETH"]
    // for (const token of tokenList) {
    //   cy.get("#collateral-token ul").children().should("contain.text", token)
    // }
  })
})
