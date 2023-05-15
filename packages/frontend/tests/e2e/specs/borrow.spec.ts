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
});
