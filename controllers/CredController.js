const passphrase = process.env.SHA256_HASH_PHRASE;
const Client = require('pg').Client;

function sanitizeTags(str) {
  return str.replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace('\\n', '<br/>');
}

class CredController {
  constructor(req, res) {
    this.request = req;
    this.response = res;
  }

  handle() {
    let input = this.request.body.passphrase;
    let dest = this.request.body.dest;
    let goal = this.request.body.goal;

    if (input === passphrase) {
      console.log('Passphrase passed');


      if (goal == 'all') {
        const sqlClient = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: true,
        });
        sqlClient.connect();
        sqlClient.query('SELECT * FROM bugs', (err, sqlresp) => {
          if (err) {
            this.writeError(err);
            sqlClient.end();
            throw err;
          } else {
            this.writeAllRows(sqlresp);
            sqlClient.end()
          }
        });
      } else if (goal === 'search') {
        this.response.redirect(307, '/search');
      } else if (goal === 'token') {
        this.response.redirect(307, '/api/generate-token');
      } else {
        this.response.writeHead(404);
        this.response.end();
      }
    } else {
      console.log('Invalid passphrase attempt');
      this.response.render('invalid-phrase', {dest: dest});
      this.response.end();
    }
  }

  writeError(err) {
    console.warn(
        'SQL error in attempt to read records from database. Passphrase passed');
    console.warn(JSON.stringify(err));
    this.response.writeHead(
        500, {'Content-Type': 'text/plain', 'Success': 'false'});
    this.response.write('' + JSON.stringify(err));
    this.response.end();
  }

  writeAllRows(sqlresp) {
    this.response.writeHead(
        200, {'Content-Type': 'text/html', 'Success': 'true'});
    this.response.write(
        '<html><head><title>PyEdit Bugs</title><style>table, th, td {' +
        ' border: 1px solid black;' +
        ' padding: 7px;' +
        ' border-collapse: collapse;}\n' +
        'th, td { min-width: 300px; font-family: monospace; }' +
        '</style></head><body><h1>PyEdit Bugs</h1>');
    if (sqlresp.rows[0]) {
      this.response.write('<table>');
      var keys = Object.keys(sqlresp.rows[0]);
      if (keys) {
        this.response.write('<tr>');
        for (let key of keys) {
          this.response.write(`<th> ${sanitizeTags(key)} </th>`);
        }
        this.response.write('</tr>');
      }
      for (let row of sqlresp.rows) {
        this.response.write('<tr>');
        for (let value of Object.values(row)) {
          let text = new String(value).replace(/(\S),(\S)/g, '$1, $2');
          this.response.write(`<td>${sanitizeTags(text)}</td>`);
        }
        this.response.write('</tr>');
      }
      this.response.write('</table><p><a href="/">Home</a></p></body></html>');
    } else {
      this.response.write(
          '<p> No bugs reported</p><p><a href="/">Home</a></p>');
      this.response.write('</body></html>');
    }

    this.response.end();
  }
}

module.exports = CredController;