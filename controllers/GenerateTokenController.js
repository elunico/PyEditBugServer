const crypto = require('crypto');
const Client = require('pg').Client;
const handleSQLError = require('./tomutils').handleSQLError;
const ipCanPassOrThrow = require('./tomutils').ipCanPassOrThrow;

const blockPeriodMillis = 1000 * 60 * 60 * 24;


class GenerateTokenController {

  constructor(ip, req, res) {
    this.req = req;
    this.res = res;
    this.ip = ip;

    return function () {

      ipCanPassOrThrow(this.ip)
        .then(() => {
          let token = crypto.randomBytes(48).toString('hex');
          let created = new Date().toUTCString();
          let expires =
            new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

          let query =
            'INSERT INTO tokens (tokenvalue, ip, created, expires) VALUES ($1, $2, $3, $4);';
          let parameters = [token, this.ip, created, expires];

          const sqlClient = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: true,
          });
          sqlClient.connect();
          sqlClient.query(query, parameters, (err, sqlresp) => {
            if (err) {
              handleSQLError(err, sqlresp, this.res);
              throw err;
            } else {
              this.res.render(
                'token-generate-success',
                { expires: expires, ip: this.ip, token: token, created: created });
            }
          });
        })
        .catch(() => {
          this.res.render('token-generate-fail', { reason: 'Too many attempts' });
          return;
        });
    };
  }
}

module.exports = GenerateTokenController;
