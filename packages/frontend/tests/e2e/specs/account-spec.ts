import { hiddenAddress } from '../../../helpers/values';

describe('Account', () => {
  const accountAddress = Cypress.env('user_address');
  before(() => {
    cy.visit('/');
  });
  it('should display the explore carousel modal', () => {
    cy.get('[data-cy="explore-carousel"]').should('exist');
  });
  it('should skip onboarding', () => {
    cy.skipOnboarding();
    cy.get('[data-cy="explore-carousel"]').should('not.exist');
  });
  it('should display a connect button if the user is not connected', () => {
    cy.get('[data-cy="header-login"]')
      .should('exist')
      .and('contain.text', 'Connect wallet');
  });
  it('should login', () => {
    cy.login();
    cy.dismissDisclaimer();
    cy.acceptMetamaskAccess().then((connected) => {
      expect(connected).to.be.true;
    });
  });
  it('should be connected to the right address', () => {
    cy.getMetamaskWalletAddress().then((address) => {
      expect(address).to.be.equal(accountAddress);
      const formattedAddress = hiddenAddress(address);
      cy.get('[data-cy="header-address"]').should(
        'have.text',
        formattedAddress
      );
    });
  });
  it('should be connected to the right network', () => {
    cy.getNetwork().then((network: any) => {
      expect(network.networkName).to.be.equal('gnosis');
      expect(network.networkId).to.be.equal(100);

      cy.get('[data-cy="header-network"]')
        .first()
        .should(
          'have.text',
          network.networkName.charAt(0).toUpperCase() +
            network.networkName.slice(1)
        );
    });
  });
  it('should switch accounts', () => {
    cy.createMetamaskAccount('account #2')
      .then(() => {
        return cy.switchMetamaskAccount(2);
      })
      .then(() => {
        return cy.getMetamaskWalletAddress();
      })
      .then((address) => {
        expect(address).to.not.be.equal(accountAddress);

        const formattedAddress = hiddenAddress(address);
        cy.get('[data-cy="header-address"]').should(
          'not.have.text',
          formattedAddress
        );
      });
  });
  it('should change network to Optimism', () => {
    cy.get('[data-cy="network-button"]')
      .first()
      .click({ force: true })
      .then(() => {
        cy.get('[data-cy="network-menu-item"]')
          .first()
          .click({ force: true })
          .then(() => {
            cy.allowMetamaskToAddAndSwitchNetwork().then((connected) => {
              expect(connected).to.be.true;
              // Could be a little flaky since we test real value and cy.getNetwork still Gnosis
              cy.get('[data-cy="header-network"]')
                .first()
                .should('have.text', 'Optimism');
            });
          });
      });
  });

  /*
    it('should recognize an unsupported network, () => ...
    Idea was to add and connect to an unsupported network and check how we handle it,
    but no matter what we send as params to the `addMetamaskNetwork` function,
    it always sets the initial values passed in the .env file or the before hook
  */

  it('should disconnect', () => {
    cy.get('[data-cy="header-address"]').click({ force: true });
    cy.get('[data-cy="header-disconnect"]').click({ force: true });
    cy.get('[data-cy="header-login"]')
      .should('exist')
      .and('contain.text', 'Connect wallet');
  });
});
