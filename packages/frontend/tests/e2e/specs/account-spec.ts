describe('Account', () => {
  before(() => {
    cy.visit('/');
  });
  it('should display the disclaimer modal', () => {
    cy.get('[data-cy="disclaimer-modal"]').should('exist');
  });
  it('should accept the disclaimer', () => {
    [0, 1, 2, 3].forEach((i) =>
      cy.get(`[data-cy="disclaimer-check-${i}"]`).click({ force: true })
    );
    cy.get(`[data-cy="disclaimer-button"]`).click({ force: true });
    cy.get(`[data-cy="skip-explore"]`).click({ force: true });

    cy.get('[data-cy=disclaimer-modal').should('not.exist');
  });
  // it('should display a connect button if the user is not connected', () => {
  //   cy.get('[data-cy="borrow-login"]')
  //     .should('exist')
  //     .and('contain.text', 'Connect wallet');
  // });
  // it('should login', () => {
  //   cy.get('[data-cy="login"]').click({ force: true });
  //   cy.acceptMetamaskAccess().then((connected) => {
  //     expect(connected).to.be.true;
  //   });
  // });
});
