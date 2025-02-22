import { e2e } from '../utils';

import datasetResponse from './datasets-response.json';
import fieldsResponse from './fields-response.json';
import tablesResponse from './tables-response.json';

const tableNameWithSpecialCharacter = tablesResponse.results.tables.frames[0].data.values[0][1];
const normalTableName = tablesResponse.results.tables.frames[0].data.values[0][0];

describe('MySQL datasource', () => {
  it('code editor autocomplete should handle table name escaping/quoting', () => {
    e2e.flows.login('admin', 'admin');

    cy.intercept(
      'POST',
      {
        pathname: '/api/ds/query',
      },
      (req) => {
        if (req.body.queries[0].refId === 'datasets') {
          req.alias = 'datasets';
          req.reply({
            body: datasetResponse,
          });
        } else if (req.body.queries[0].refId === 'tables') {
          req.alias = 'tables';
          req.reply({
            body: tablesResponse,
          });
        } else if (req.body.queries[0].refId === 'fields') {
          req.alias = 'fields';
          req.reply({
            body: fieldsResponse,
          });
        }
      }
    );

    e2e.pages.Explore.visit();

    e2e.components.DataSourcePicker.container().should('be.visible').type('gdev-mysql{enter}');

    cy.get("label[for^='option-code']").should('be.visible').click();
    cy.get('textarea').type('S{downArrow}{enter}');
    cy.wait('@tables');
    cy.get('.suggest-widget').contains(tableNameWithSpecialCharacter).should('be.visible');
    cy.get('textarea').type('{enter}');
    cy.get('textarea').should('have.value', `SELECT  FROM grafana.\`${tableNameWithSpecialCharacter}\``);

    const deleteTimes = new Array(tableNameWithSpecialCharacter.length + 2).fill(
      '{backspace}',
      0,
      tableNameWithSpecialCharacter.length + 2
    );
    cy.get('textarea').type(deleteTimes.join(''));

    cy.get('textarea').type('{command}i');
    cy.get('.suggest-widget').contains(tableNameWithSpecialCharacter).should('be.visible');
    cy.get('textarea').type('S{downArrow}{enter}');
    cy.get('textarea').should('have.value', `SELECT  FROM grafana.${normalTableName}`);

    cy.get('textarea').type('.');
    cy.get('.suggest-widget').contains('No suggestions.').should('be.visible');
  });
});
