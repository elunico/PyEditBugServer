/* eslint-disable no-console */
const Client = require('pg').Client;

class SearchResultsController {
  constructor(request, response) {
    this.request = request;
    this.response = response;
  }

  static sqlString(s) {
    return s.replace(/[\\'[%"]/g, '');
  }

  handle() {
    let pyversion = this.request.query.pyversion;
    let user = this.request.query.user;
    let platform = this.request.query.platform;
    // if (!(pyversion && user && platform) && (platform || pyversion || user))
    // {
    //   throw 'Fill out all search fields or none';
    // }
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


    const sqlClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
    sqlClient.connect();
    sqlClient.query(query, (err, sqlresp) => {
      if (err) {
        console.warn(
            'SQL error in attempt to read records from database. Passphrase passed');
        console.warn(JSON.stringify(err));
        this.response.writeHead(
            500, {'Content-Type': 'text/plain', 'Success': 'false'});
        this.response.write('' + JSON.stringify(err));
        this.response.end();
        sqlClient.end()
        throw err;
      } else {
        if (sqlresp.rows[0]) {
          let keys = Object.keys(sqlresp.rows[0]);
          console.log(keys);
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