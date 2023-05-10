describe('Markets', () => {
  before(() => {
    cy.visit('/');
    cy.dismissDisclaimer();
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
  it('should best label be on the right rows', () => {
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
  it('should search', () => {
    let startLength, resultLength, query;
    cy.get('[data-cy="market-row"]')
      .then((value) => {
        startLength = value.length;
      })
      .first()
      .find('[data-cy="market-row-debt"]')
      .invoke('text')
      .then((debt) => {
        query = debt;
        cy.get('[data-cy="market-search"]').find('input').clear().type(query);
        cy.get('[data-cy="market-row"]')
          .then((value) => {
            resultLength = value.length;
          })
          .first()
          .find('[data-cy="market-row-debt"]')
          .then((content) => {
            expect(content).to.have.text(query);
            expect(resultLength).to.not.eq(startLength);
            cy.get('[data-cy="market-search"]').find('input').clear();
            cy.get('[data-cy="market-row"]').then((value) => {
              expect(value.length).to.eq(startLength);
            });
          });
      });
  });
  it('should filter by chain', () => {
    let startLength, resultLength, chainName;
    // getting initial rows length.
    cy.get('[data-cy="market-row"]').then((value) => {
      startLength = value.length;
    });

    // clicking second network filter button.
    cy.get('[data-cy="market-network-filter"]')
      .next()
      .find('img')
      .then((img) => {
        chainName = img.attr('alt');
      })
      .click();
    // checking rows count changes.
    cy.get('[data-cy="market-row"]')
      .then((value) => {
        resultLength = value.length;
        expect(resultLength).to.not.eq(startLength);
      })
      .first()
      .find('[data-cy="market-row-network"]')
      .first()
      .then((network) => {
        // checking rows filtered by network properly.
        expect(network).to.have.text(chainName);
        // clicking first network filter button which is ALL.
        cy.get('[data-cy="market-network-filter"]').first().click();
        // checking rows count is same as in default state.
        cy.get('[data-cy="market-row"]').then((value) => {
          expect(value.length).to.eq(startLength);
        });
      });
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
