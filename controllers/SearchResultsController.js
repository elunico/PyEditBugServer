/* eslint-disable no-console */
const Client = require('pg').Client;
const handleSQLError = require('util').handleSQLError;
const makeQuery = require('util').makeQuery;
const sqlString = require('util').sqlString;

class SearchResultsController {
  constructor(request, response) {

    return function () {
      console.log('do this');
      let pyversion = request.query.pyversion;
      let user = request.query.user;
      let platform = request.query.platform;

      let query = makeQuery(pyversion, user, platform);

      const sqlClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
      });
      sqlClient.connect();
      sqlClient.query(query, (err, sqlresp) => {
        if (err) {
          handleSQLError(err, sqlClient, response);
          throw err;
        } else {
          if (sqlresp.rows[0]) {
            let keys = Object.keys(sqlresp.rows[0]);
            let rows = sqlresp.rows.map((i) => Object.values(i));
            response.render(
              'search-results',
              { keys: keys, vals: rows, nResults: rows.length });
          } else {
            response.render(
              'search-results', { keys: [], vals: [], nResults: 0 });
          }
          sqlClient.end();
        }
      });
    };
  }
}


module.exports = SearchResultsController;
