/* eslint-disable no-console */
const Client = require('pg').Client;
const handleSQLError = require('util').handleSQLError;
const makeQuery = require('util').makeQuery;
const sqlString = require('util').sqlString;

class SearchResultsCSVController {
  constructor(request, response) {
    return function handleGetCSV() {
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
          response.writeHead(
            200, 'Success', { 'Content-Type': 'application/csv' });
          if (sqlresp.rows[0]) {
            let keys = Object.keys(sqlresp.rows[0]);
            let header = keys.join(',');
            let entries = [];
            let rows = sqlresp.rows.map((i) => Object.values(i));
            for (let line of rows) {
              entries.push(line.join(','));
            }
            let body = entries.join('\n');
            let text = header + '\n' + body;
            response.write(text);
          } else {
            response.write('');
          }
          response.end();
          sqlClient.end();
        }
      });
    };
  }
}

module.exports = SearchResultsCSVController;
