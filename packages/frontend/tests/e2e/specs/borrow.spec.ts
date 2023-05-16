describe('Borrow', () => {
  before(() => {
    cy.visit('/borrow');
    cy.dismissDisclaimer();
    cy.login();
  });
  it('should load right chain', () => {
    cy.get('[data-cy="borrow-chain-select"]')
      .first()
      .should('contain.text', 'Optimism');
    cy.get('[data-cy="borrow-chain-select"]')
      .last()
      .should('contain.text', 'Optimism');
  });
  it('should not show routes button', () => {
    cy.get('[data-cy="borrow-routes-button"]').should('not.exist');
  });
  it('should input valid but impossible amount', () => {
    cy.get('[data-cy="borrow-input"]')
      .first()
      .find('input')
      .clear()
      .type('2e50');
    cy.get('[data-cy="disabled-borrow-button"]')
      .should('exist')
      .should('contain.text', 'Insufficient');
  });
  // Requires funds on Optimism to run
  it('should show balance', () => {
    // checking balance
    cy.get('[data-cy="balance-amount"]')
      .first()
      .should('exist')
      .should('not.have.text', '0');
  });
  // Requires funds on Optimism to run
  it('should input max collateral amount', () => {
    // clearing collateral input
    cy.get('[data-cy="borrow-input"]').first().find('input').clear();
    // clicking MAX
    cy.get('[data-cy="max-btn"]').click();
    // collateral input value should be changed
    cy.get('[data-cy="borrow-input"]')
      .first()
      .find('input')
      .should('not.have.value', '0');
  });
  // Requires funds on Optimism to run
  it('should input recommended debt amount', () => {
    cy.get('[data-cy="recommended-value"]')
      .first()
      .should('not.have.text', '0');
    // clicking Recommended
    cy.get('[data-cy="recommended-btn"]').click();
    // debt input value should be changed
    cy.get('[data-cy="borrow-input"]')
      .last()
      .find('input')
      .should('not.have.value', '0');
  });
  // Requires funds on Optimism to run
  it('should show correct summary', () => {
    cy.get('[data-cy="borrow-summary-amount"]')
      .first()
      .should('not.have.text', '0 WETH');
    [1, 2, 3].forEach((index) => {
      cy.get('[data-cy="borrow-summary-amount"]')
        .eq(index)
        .should('not.have.text', '$0.00');
    });
  });
  // Requires funds on Optimism to run
  it('should show correct ltv progress line', () => {
    let value, maxLTV;
    cy.get('[data-cy="max-ltv-percent"]')
      .invoke('text')
      .then((max) => {
        maxLTV = parseInt(max);
        cy.get('[data-cy="recommended-ltv-percent"]')
          .invoke('text')
          .then((text) => {
            value = parseInt(text);
            const expectedAriaValue = Math.round((value * 100) / maxLTV);
            cy.get('[data-cy="ltv-progress-line"]')
              .invoke('attr', 'aria-valuenow')
              .should('contain', `${expectedAriaValue}`);
          });
      });
  });
  it('should change debt chain', () => {
    cy.get('[data-cy="borrow-chain-select"]')
      .last()
      .click()
      .then(() => {
        cy.get('[data-cy="borrow-chain-select-item"]').eq(1).click();
        cy.get('[data-cy="borrow-chain-select"]')
          .last()
          .should('contain.text', 'Gnosis');
      });
  });
  it('should display available routes', () => {
    cy.get('[data-cy="borrow-routes-button"]').should('exist').click();
    cy.get('[data-cy="routing-modal"]').should('exist');
    cy.get('[data-cy="route-card"]').then((value) => {
      expect(value.length).to.be.gt(1);
    });
    cy.get('[data-cy="routing-modal-close-button"]').should('exist').click();
  });
});
