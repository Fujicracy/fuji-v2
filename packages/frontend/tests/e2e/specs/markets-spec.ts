describe('Markets', () => {
  before(() => {
    cy.visit('/');
    cy.dismissDisclaimer();
  });
  it('should load table data', () => {
    cy.get('[data-cy="market-row"]').should('exist');
  });
  it('should first table row be unfolded', () => {
    // checking first row to be unfolded so have no network column.
    cy.get('[data-cy="market-row"]')
      .first()
      .find('[data-cy="market-row-network"]')
      .should('not.exist');
    // checking first row first child to have network column.
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="market-row-network"]')
      .should('exist');
    // checking first row first child to not have debt column.
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="market-row-debt"]')
      .should('not.exist');
  });
  it('should best label be on the right rows', () => {
    // checking first row to be unfolded so have no best label on first row.
    cy.get('[data-cy="market-row"]')
      .first()
      .find('[data-cy="best-label"]')
      .should('not.exist');
    // checking first row first child to have best label.
    cy.get('[data-cy="market-row"]')
      .next()
      .find('[data-cy="best-label"]')
      .should('exist');
    // checking last row to have best label.
    cy.get('[data-cy="market-row"]')
      .last()
      .find('[data-cy="best-label"]')
      .should('exist');
  });
  it('should search', () => {
    let startLength, resultLength, query;
    // getting initial rows length.
    cy.get('[data-cy="market-row"]')
      .then((value) => {
        startLength = value.length;
      })
      .first()
      .find('[data-cy="market-row-debt"]')
      .invoke('text')
      .then((debt) => {
        // saving first rows debt name.
        query = debt;
        // searching first rows debt name.
        cy.get('[data-cy="market-search"]').find('input').clear().type(query);
        cy.get('[data-cy="market-row"]')
          .then((value) => {
            resultLength = value.length;
          })
          .first()
          .find('[data-cy="market-row-debt"]')
          .then((content) => {
            // checking result row debt name.
            expect(content).to.have.text(query);
            // checking result rows count not equal starting.
            expect(resultLength).to.not.eq(startLength);
            // clearing search input.
            cy.get('[data-cy="market-search"]').find('input').clear();
            cy.get('[data-cy="market-row"]').then((value) => {
              // checking rows count is same as in default state.
              expect(value.length).to.eq(startLength);
            });
          });
      });
  });
  it('should display no data on wrong search', () => {
    const randomImpossibleSearch = 'cwecwievhwoe2335irvhwiohoh234voihoih';
    // searching by impossible query.
    cy.get('[data-cy="market-search"]')
      .find('input')
      .clear()
      .type(randomImpossibleSearch);
    // checking no rows as result.
    cy.get('[data-cy="market-row"]').should('not.exist');
    // checking for empty table state.
    cy.get('[data-cy="market-empty-state"]').should(
      'contain.text',
      'No results found'
    );
    // resetting default.
    cy.get('[data-cy="market-search"]').find('input').clear();
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
    // checking last row exist and folded.
    cy.get('[data-cy="market-row"]')
      .last()
      .as('lastRow', { type: 'static' })
      .find('[data-cy="market-row-network"]')
      .should('exist');
    // finding its toggle button.
    cy.get('[data-cy="market-toggle"]')
      .last()
      .as('lastToggle', { type: 'query' });
    // clicking toggle button.
    cy.get('@lastToggle').click({ force: true });
    // checking last is unfolded.
    cy.get('@lastRow')
      .find('[data-cy="market-row-network"]')
      .should('not.exist');
    cy.get('[data-cy="market-row"]')
      .last()
      .find('[data-cy="market-row-network"]')
      .should('exist');
    // clicking toggle button.
    cy.get('@lastRow').find('[data-cy="market-toggle"]').first().click();
    // checking last is folded.
    cy.get('@lastRow').find('[data-cy="market-row-network"]').should('exist');
  });
  it('should redirect after click with correct token prefill', () => {
    let collateralToken, debtToken;
    // finding first row.
    cy.get('[data-cy="market-row"]').first().as('firstRow', { type: 'static' });
    cy.get('@firstRow')
      .find('[data-cy="market-row-debt"]')
      .invoke('text')
      .then((debt) => {
        // saving first row debt token.
        debtToken = debt;
      })
      .then(() => {
        cy.get('@firstRow')
          .find('[data-cy="market-row-collateral"]')
          .invoke('text')
          .then((collateral) => {
            // saving first row collateral token.
            collateralToken = collateral;
          })
          .then(() => {
            // clicking on first row.
            cy.get('@firstRow').first().click();
            // checking redirect to borrow page.
            cy.location('pathname').should('eq', '/borrow');
            // checking prefilled collateral token.
            cy.get('[data-cy="token-select"]')
              .first()
              .should('have.text', collateralToken);
            // checking prefilled debt token.
            cy.get('[data-cy="token-select"]')
              .last()
              .should('have.text', debtToken);
          });
      });
  });
});
