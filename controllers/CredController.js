const passphrase = process.env.SHA256_HASH_PHRASE;
const Client = require('pg').Client;

function sanitizeTags(str) {
  return str.replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace('\\n', '<br/>');
}

class CredController {
  constructor(request, response) {
    return function () {
      let input = request.body.passphrase;
      let dest = request.body.dest;
      let goal = request.body.goal;

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
              writeError(err);
              sqlClient.end();
              throw err;
            } else {
              writeAllRows(sqlresp);
              sqlClient.end();
            }
          });
        } else if (goal === 'search') {
          response.redirect(307, '/search');
        } else if (goal === 'token') {
          response.redirect(307, '/api/generate-token');
        } else {
          response.writeHead(404);
          response.end();
        }
      } else {
        console.log('Invalid passphrase attempt');
        response.render('invalid-phrase', { dest: dest });
        response.end();
      }
    };
  }
}
function writeError(response, err) {
  console.warn(
    'SQL error in attempt to read records from database. Passphrase passed');
  console.warn(JSON.stringify(err));
  response.writeHead(
    500, { 'Content-Type': 'text/plain', 'Success': 'false' });
  response.write('' + JSON.stringify(err));
  response.end();
}

function writeAllRows(response, sqlresp) {
  response.writeHead(
    200, { 'Content-Type': 'text/html', 'Success': 'true' });
  response.write(
    '<html><head><title>PyEdit Bugs</title><style>table, th, td {' +
    ' border: 1px solid black;' +
    ' padding: 7px;' +
    ' border-collapse: collapse;}\n' +
    'th, td { min-width: 300px; font-family: monospace; }' +
    '</style></head><body><h1>PyEdit Bugs</h1>');
  if (sqlresp.rows[0]) {
    response.write('<table>');
    var keys = Object.keys(sqlresp.rows[0]);
    if (keys) {
      response.write('<tr>');
      for (let key of keys) {
        response.write(`<th> ${sanitizeTags(key)} </th>`);
      }
      response.write('</tr>');
    }
    for (let row of sqlresp.rows) {
      response.write('<tr>');
      for (let value of Object.values(row)) {
        let text = new String(value).replace(/(\S),(\S)/g, '$1, $2');
        response.write(`<td>${sanitizeTags(text)}</td>`);
      }
      response.write('</tr>');
    }
    response.write('</table><p><a href="/">Home</a></p></body></html>');
  } else {
    response.write(
      '<p> No bugs reported</p><p><a href="/">Home</a></p>');
    response.write('</body></html>');
  }

  response.end();
}


module.exports = CredController;
