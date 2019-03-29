/* eslint-disable no-console */
const Client = require('pg').Client;
const handleSQLError = require('util').handleSQLError;

class SearchResultsController {
  constructor(request, response) {
    this.request = request;
    this.response = response;
  }

  static sqlString(s) {
    return s.replace(/[\\'[%"]/g, '');
  }

  makeQuery(pyversion, user, platform) {
    let query = 'SELECT * FROM bugs';
    if (platform || user || pyversion) {
      query += ' WHERE ';
    }
    let seen = false;
    if (pyversion) {
      query +=
          `pyversion iLIKE '%${SearchResultsController.sqlString(pyversion)}%'`;
      seen = true;
    }
    if (user) {
      if (seen) query += ' and ';
      query += `user_user iLIKE '%${SearchResultsController.sqlString(user)}%'`;
      seen = true;
    }
    if (platform) {
      if (seen) query += ' and ';
      query +=
          `platform iLIKE '%${SearchResultsController.sqlString(platform)}%'`;
    }
    query += ';';
    return query;
  }

  handleGetCSV() {
    let pyversion = this.request.query.pyversion;
    let user = this.request.query.user;
    let platform = this.request.query.platform;

    let query = this.makeQuery(pyversion, user, platform);

    const sqlClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
    sqlClient.connect();
    sqlClient.query(query, (err, sqlresp) => {
      if (err) {
        handleSQLError(err, sqlClient, this.response);
        throw err;
      } else {
        this.response.writeHead(
            200, 'Success', {'Content-Type': 'application/csv'});
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
          this.response.write(text);
        } else {
          this.response.write('');
        }
        this.response.end();
        sqlClient.end();
      }
    });
  }

  handle() {
    let pyversion = this.request.query.pyversion;
    let user = this.request.query.user;
    let platform = this.request.query.platform;

    let query = this.makeQuery(pyversion, user, platform);

    const sqlClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
    sqlClient.connect();
    sqlClient.query(query, (err, sqlresp) => {
      if (err) {
        handleSQLError(err, sqlClient, this.response);
        throw err;
      } else {
        if (sqlresp.rows[0]) {
          let keys = Object.keys(sqlresp.rows[0]);
          let rows = sqlresp.rows.map((i) => Object.values(i));
          this.response.render(
              'search-results',
              {keys: keys, vals: rows, nResults: rows.length});
        } else {
          this.response.render(
              'search-results', {keys: [], vals: [], nResults: 0});
        }
        sqlClient.end();
      }
    });
  }
}

module.exports = SearchResultsController;