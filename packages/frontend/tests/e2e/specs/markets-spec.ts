import * as Cypress from 'cypress';

describe('Markets', () => {
  before(() => {
    cy.visit('/');
    [0, 1, 2, 3].forEach((i) =>
      cy.get(`[data-cy="disclaimer-check-${i}"]`).click({ force: true })
    );
    cy.get(`[data-cy="disclaimer-button"]`).click({ force: true });
    cy.get(`[data-cy="skip-explore"]`).click({ force: true });
  });
  it('should load table data', () => {
    cy.get('[data-cy="market-row"]').should('exist');
  });
  it('should first table row be unfolded', () => {
    cy.get('[data-cy="market-row"]')
      .first()
      .find('[data-cy="market-row-network"]')
      .should('not.exist');
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="market-row-network"]')
      .should('exist');
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="market-row-debt"]')
      .should('not.exist');
  });
  it('should best label to be on right rows', () => {
    cy.get('[data-cy="market-row"]')
      .first()
      .find('[data-cy="best-label"]')
      .should('not.exist');
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="best-label"]')
      .should('exist');
    cy.get('[data-cy="market-row"]')
      .last()
      .find('[data-cy="best-label"]')
      .should('exist');
  });
  it('should toggle last high-level row', () => {
    cy.get('[data-cy="market-row"]')
      .last()
      .as('lastRow', { type: 'static' })
      .find('[data-cy="market-row-network"]')
      .should('exist');
    cy.get('[data-cy="market-toggle"]')
      .last()
      .as('lastToggle', { type: 'query' });

    cy.get('@lastToggle').click({ force: true });
    cy.get('@lastRow')
      .find('[data-cy="market-row-network"]')
      .should('not.exist');
    cy.get('[data-cy="market-row"]')
      .last()
      .find('[data-cy="market-row-network"]')
      .should('exist');
    cy.get('@lastRow').find('[data-cy="market-toggle"]').first().click();
    cy.get('@lastRow').find('[data-cy="market-row-network"]').should('exist');
  });
  it('should redirect after click with correct token prefill', () => {
    let collateralToken, debtToken;
    cy.get('[data-cy="market-row"]').first().as('firstRow', { type: 'static' });
    cy.get('@firstRow')
      .find('[data-cy="market-row-debt"]')
      .invoke('text')
      .then((debt) => {
        debtToken = debt;
      })
      .then(() => {
        cy.get('@firstRow')
          .find('[data-cy="market-row-collateral"]')
          .invoke('text')
          .then((collateral) => {
            collateralToken = collateral;
          })
          .then(() => {
            cy.get('@firstRow').first().click();
            cy.location('pathname').should('eq', '/borrow');
            cy.get('[data-cy="token-select"]')
              .first()
              .should('have.text', collateralToken);
            cy.get('[data-cy="token-select"]')
              .last()
              .should('have.text', debtToken);
          });
      });
  });
});
