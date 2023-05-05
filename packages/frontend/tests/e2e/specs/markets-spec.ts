describe('Markets', () => {
  it('should not display the disclaimer modal', () => {
    cy.get('[data-cy="disclaimer-modal"]').should('not.exist');
  });
});
