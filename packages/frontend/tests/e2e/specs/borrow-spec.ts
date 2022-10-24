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

  it("can select another collateral chain", () => {
    cy.get("#collateral-chain-select").should("contain.text", "Ethereum")
    cy.get("#collateral-chain-select").click()

    const chainList = ["Ethereum", "Polygon", "Fantom", "Arbitrum", "Optimism"]
    for (const chain of chainList) {
      cy.get("#collateral-chain-menu ul")
        .children()
        .should("contain.text", chain)
    }

    cy.get("body").type("{downArrow}{enter}")
    cy.get("#collateral-chain-select").should("contain.text", "Polygon")
  })
})
