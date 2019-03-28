/* eslint-disable quotes */
/* eslint-disable no-console */
const express = require('express');
const Client = require('pg').Client;

const passphrase = process.env.SHA256_HASH_PHRASE;
const port = process.env.PORT || 8099;
const server = express();

server.use(express.json());
server.use(express.urlencoded());
server.use(express.static('public'));
server.set('view engine', 'pug');
server.set('views', './private/templates');

function sanitizeTags(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace('\\n', '<br/>');
}

server.listen(port);

console.log(`Listening on ${port}`);

server.get('/cred', (req, res) => {
  console.log('GET /cred redirected to home');
  res.redirect(301, '/');
});

server.post('/cred', (req, res) => {
  let input = req.body.passphrase;
  if (input === passphrase) {
    console.log("Passphrase passed");
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    client.connect();
    client.query('SELECT * FROM bugs', (err, sqlresp) => {
      if (err) {
        console.warn("SQL error in attempt to read records from database. Passphrase passed");
        console.warn(JSON.stringify(err));
        res.writeHead(500, { 'Content-Type': 'text/plain', 'Success': 'false' });
        res.write('' + JSON.stringify(err));
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
          res.write('</table><p><a href="/">Home</a></p></body></html>');
        } else {
          res.write('<p> No bugs reported</p><p><a href="/">Home</a></p>');
          res.write('</body></html>');
        }

        res.end();
      }
      client.end();
    });
  } else {
    console.log("Invalid passphrase attempt");
    res.render('invalid-phrase');
    res.end();
  }
});

server.get('/do-submit', (req, res) => {
  console.log("GET at /do-submit redirected to home");
  res.redirect(301, '/');
});

server.post('/do-submit', function (req, res) {
  var report = {
    'params': {
      'created': new Date(Number(req.body.created)),
      'version': req.body.version.replace('\n', ' '),
      'pyversion': req.body.pyversion.replace('\n', ' '),
      'platform': '<unknown>'
    },
    'user': {
      'user': req.body.user.replace('\n', ' '),
      'steps': req.body.steps.replace('\n', ' '),
      'info': req.body.info.replace('\n', ' ')
    },
    'app': {
      'preferences': '<unknown>',
      'logfile': '<unknown>',
      'appname': '<unknown>'
    }
  };
  commitReportToDB(res, report, true);
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
  commitReportToDB(res, report, false);
});

function commitReportToDB(httpResponse, report, richResponse) {
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
      console.warn("SQL error at submit report on web");
      console.warn(JSON.stringify(err));
      httpResponse.writeHead(500, { 'Content-Type': 'text/plain', 'Success': 'false' });
      httpResponse.write('' + JSON.stringify(err));
      httpResponse.end();
      // throw err;
    } else {
      if (richResponse) {
        httpResponse.render('web-submit-success.pug', { message: JSON.stringify(report, null, 4) });
      }
      else {
        httpResponse.writeHead(200, { 'Content-Type': 'text/plain', 'Success': 'true' });
        httpResponse.write('Successfully submitted bug report!');
      }
      httpResponse.end();
    }
    client.end();
  });
}
console.log(`Mapped all routes.`);
