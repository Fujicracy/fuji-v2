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
  it('should input max amount', () => {
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
  it('should input max amount', () => {
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
});
