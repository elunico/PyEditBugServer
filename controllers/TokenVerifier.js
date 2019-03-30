const Client = require('pg').Client;

function validTokenOrThrow(token) {
  return new Promise((resolve, reject) => {
    const sqlClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });
    sqlClient.connect();
    sqlClient.query('SELECT * FROM tokens', (err, sqlresp) => {
      if (err) {
        throw err;
      } else {
        if (sqlresp.rows[0]) {
          let rows = sqlresp.rows;
          for (let row of rows) {
            if (row.tokenvalue == token) {
              if (Date.parse(row.expires) > Date.now()) {
                sqlClient.end();
                resolve();
                return;
              }
            }
          }
          sqlClient.end();
          reject();
        } else {
          sqlClient.end();
          reject();
        }
      }
    });
  });
}


module.exports = validTokenOrThrow;
