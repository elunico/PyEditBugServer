module.exports = {
  handleSQLError: function (err, sqlClient, httpResponse) {
    console.warn(
      'SQL error in attempt to read records from database. Passphrase passed');
    console.warn(JSON.stringify(err));
    httpResponse.writeHead(
      500, { 'Content-Type': 'text/plain', 'Success': 'false' });
    httpResponse.write('' + JSON.stringify(err));
    httpResponse.end();
    sqlClient.end();
  },

  makeQuery: function (pyversion, user, platform) {
    let query = 'SELECT * FROM bugs';
    if (platform || user || pyversion) {
      query += ' WHERE ';
    }
    let seen = false;
    if (pyversion) {
      query +=
        `pyversion iLIKE '%${sqlString(pyversion)}%'`;
      seen = true;
    }
    if (user) {
      if (seen) query += ' and ';
      query += `user_user iLIKE '%${sqlString(user)}%'`;
      seen = true;
    }
    if (platform) {
      if (seen) query += ' and ';
      query +=
        `platform iLIKE '%${sqlString(platform)}%'`;
    }
    query += ';';
    return query;
  },

  sqlString: function (s) {
    return s.replace(/[\\'[%"]/g, '');
  },

  ipCanPassOrThrow: function (ip) {
    return new Promise(function (resolve, reject) {
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
              if (row.ip == ip) {
                if ((Date.now() - Date.parse(row.created)) >
                  (blockPeriodMillis)) {
                  sqlClient.end();
                  resolve();
                } else {
                  reject();
                }
              }
            }
            sqlClient.end();
            resolve();
          } else {
            sqlClient.end();
            resolve();
          }
        }
      });
    });
  }

};



