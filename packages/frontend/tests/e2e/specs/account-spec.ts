import { hiddenAddress } from '../../../helpers/values';

describe('Account', () => {
  const accountAddress = '0xedBf22d2c627318C57C542E35330955a3076C198'; // Temp
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
  it('should display a connect button if the user is not connected', () => {
    cy.get('[data-cy="header-login"]')
      .should('exist')
      .and('contain.text', 'Connect wallet');
  });
  it('should login', () => {
    cy.get('[data-cy="header-login"]').click({ force: true });
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
  it('should recognize an unsupported networks', () => {
    cy.addMetamaskNetwork({
      networkName: 'Ethereum Classic',
      rpcUrl: 'https://www.ethercluster.com/etc',
      chainId: '61',
      symbol: 'ETC',
      blockExplorer: 'https://etcblockexplorer.com/',
      isTestnet: false,
    }).then((networkAdded) => {
      expect(networkAdded).to.be.true;
      cy.get('[data-cy="header-unsupported-network"]').should('exist');
    });
  });
  it('should disconnect', () => {
    cy.get('[data-cy="header-address"]').click({ force: true });
    cy.get('[data-cy="header-disconnect"]').click({ force: true });
    cy.get('[data-cy="header-login"]')
      .should('exist')
      .and('contain.text', 'Connect wallet');
  });
});
