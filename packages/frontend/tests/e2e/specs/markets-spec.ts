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
});
