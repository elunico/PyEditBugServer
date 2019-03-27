/* eslint-disable quotes */
/* eslint-disable no-console */
const express = require('express');
const Client = require('pg').Client;

const passphrase = process.env.SHA256_HASH_PHRASE;
const port = process.env.PORT || 8099;
const server = express();

server.use(express.json());
server.use(express.urlencoded());
server.use(express.static('public'))

function sanitizeTags(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
}

function signedString(num) {
  let rv = new String(num);
  if (rv >= 0) {
    rv = '+' + rv;
  }
  return rv;
}

server.listen(port);

console.log(`Listening on ${port}`);

server.get('/cred', (req, res) => {
  res.redirect(301, '/');
});

server.post('/cred', (req, res) => {
  let input = req.body.passphrase;
  if (input === passphrase) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    client.connect();
    client.query('SELECT * FROM bugs', (err, sqlresp) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain', 'Success': 'false' });
        res.write('' + JSON.stringify(sqlresp));
        res.end();
        throw err;
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Success': 'true' });
        res.write(
          '<html><head><title>PyEdit Bugs</title><style>table, th, td {' +
          ' border: 1px solid black;' +
          ' padding: 7px;' +
          ' border-collapse: collapse;}\n' +
          'th, td { min-width: 300px; font-family: monospace; }' +
          '</style></head><body><h1>PyEdit Bugs</h1>');
        if (sqlresp.rows[0]) {
          res.write('<table>');
          var keys = Object.keys(sqlresp.rows[0]);
          if (keys) {
            res.write('<tr>');
            for (let key of keys) {
              res.write(`<th> ${sanitizeTags(key)} </th>`);
            }
            res.write('</tr>');
          }
          for (let row of sqlresp.rows) {
            res.write('<tr>');
            for (let value of Object.values(row)) {
              let text = new String(value).replace(/(\S),(\S)/g, '$1, $2');
              res.write(`<td>${sanitizeTags(text)}</td>`);
            }
            res.write('</tr>');
          }
          res.write('</table></body></html>');
        } else {
          res.write('<p> No bugs reported</p>');
          res.write('</body></html>');
        }

        res.end();
      }
      client.end();
    });
  } else {
    res.writeHead(403, { 'Content-Type': 'text/html', 'Success': 'false' });
    res.write(
      `<html><head><title>Invalid passphrase!</title></head>` +
      `<script> function redir_home() { setTimeout(() => { window.location = '/'; }, 1500); } </script>` +
      `<body onload="redir_home()" style="font-family: monospace">` +
      `<p>Invalid passphrase!</p><p>Redirecting to home in <span style="color: red" id="timer">1500</span>ms</p>` +
      `<script>setInterval(() => {document.getElementById('timer').innerHTML = (new Number(document.getElementById('timer').innerHTML) - 30); }, 33);</script>` +
      `<a href="/">Home</a>` +
      `</body></html>`);
    res.end();
  }
});

server.post('/bug-report', function (req, res) {
  var report = {
    'params': {
      'created': req.body.parameters.created.replace('\n', ' '),
      'platform': req.body.parameters.platform.replace('\n', ' '),
      'version': req.body.parameters.version.replace('\n', ' '),
      'pyversion': req.body.parameters.pyversion.replace('\n', ' ')
    },
    'user': {
      'user': req.body.user.user.replace('\n', ' '),
      'steps': req.body.user.steps.replace('\n', ' '),
      'info': req.body.user.info.replace('\n', ' ')
    },
    'app': {
      'preferences': JSON.stringify(JSON.parse(req.body.app.preferences)),
      'logfile': req.body.app.logfile.replace('\n', ' '),
      'appname': req.body.app.appname.replace('\n', ' ')
    }
  };
  const queryTemplate =
    'INSERT into bugs (created, platform, version, pyversion, user_user, steps, info, preferences, log, appname) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);';
  let isoDate = new Date(Date.parse(report.params.created)).toUTCString();
  const parameters = [
    isoDate,
    report.params.platform, report.params.version, report.params.pyversion,
    report.user.user, report.user.steps, report.user.info,
    report.app.preferences, report.app.logfile, report.app.appname
  ];
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  client.connect();
  client.query(queryTemplate, parameters, (err, sqlresp) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain', 'Success': 'false' });
      res.write('' + JSON.stringify(sqlresp));
      res.end();
      throw err;
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Success': 'true' });
      res.write('Successfully submitted bug report!');
      res.end();
    }
    client.end();
  });
});

console.log('Handling POST requests for /bug_report');
