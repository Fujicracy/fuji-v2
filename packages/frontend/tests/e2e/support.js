import '@synthetixio/synpress/support/index';

Cypress.Commands.add('dismissDisclaimer', () => {
  [0, 1, 2, 3].forEach((i) =>
    cy.get(`[data-cy="disclaimer-check-${i}"]`).click({ force: true })
  );
  cy.get(`[data-cy="disclaimer-button"]`).click({ force: true });
});

Cypress.Commands.add('login', () => {
  cy.get('[data-cy="header-login"]').click({ force: true });
});

Cypress.Commands.add('skipOnboarding', () => {
    cy.get(`[data-cy="skip-explore"]`).click({ force: true });
});
