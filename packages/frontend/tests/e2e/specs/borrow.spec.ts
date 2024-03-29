describe('Borrow', () => {
  before(() => {
    cy.visit('/borrow');
    cy.skipOnboarding();
    cy.login();
    cy.dismissDisclaimer();
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
  it('should show and change slippage', () => {
    cy.get('[data-cy="slippage-settings"]').should('exist').click();
    cy.get('[data-cy="slippage-default-option"]')
      .first()
      .click()
      .then(() => {
        let localSlippage = JSON.parse(localStorage.getItem('xFuji/borrow'))
          ?.state?.slippage;
        expect(localSlippage).to.be.equal(100);
        cy.get('[data-cy="slippage-input"]')
          .first()
          .find('input')
          .clear()
          .type('2.1')
          .then(() => {
            localSlippage = JSON.parse(localStorage.getItem('xFuji/borrow'))
              ?.state?.slippage;
            expect(localSlippage).to.be.equal(210);
            cy.get('[data-cy="slippage-close-button"]').click();
          });
      });
  });
  it('should show fees', () => {
    // checking high level fee is shown and not 0
    cy.get('[data-cy="fees-container"]')
      .find('span')
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(parseFloat(text.slice(2))).to.be.gt(0);
      });
    // unfolding fees
    cy.get('[data-cy="fees-container"]').should('exist').click();
    // checking first unfolded fee is 'Bridge fee'
    cy.get('[data-cy="fee-item"]')
      .eq(0)
      .find('span')
      .first()
      .should('contain.text', 'Bridge Fee');
    // checking 'Bridge fee' value greater than 0
    cy.get('[data-cy="fee-item"]')
      .eq(0)
      .find('span')
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(parseFloat(text.slice(2))).to.be.gt(0);
      });
    // checking second unfolded fee is 'Relayer Fee'
    cy.get('[data-cy="fee-item"]')
      .eq(1)
      .find('span')
      .first()
      .should('contain.text', 'Relayer Fee');
  });
});
