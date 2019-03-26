// var bp = require('body-parser');
var express = require('express');
var fs = require('fs');
var buglog = 'bugs.csv';
var server = express();
server.use(express.json());
server.use(express.static('public'))

const port = process.env.PORT || 8099;
const passphrase = "CATPASSPHRASE";

const {
  Client
} = require('pg');



function writeCSVCompleteLine(file, line) {
  fs.appendFileSync(file, line + '\n', 'utf-8');
}

function sanitizeColumnEntry(entry) {
  return `"${entry.replace(/"\n\\\t\v\r,/gi, ' ')}"`;
}

function writeCSVColumns(file, columns) {
  for (let i = 0; i < columns.length; i++) {
    let entry = columns.shift();
    entry = sanitizeColumnEntry(entry);
    columns.push(entry);
  }
  let line = columns.join(',');
  writeCSVCompleteLine(file, line);
}


function writeReportToFile(report, verbose) {
  try {
    let log = verbose ? report.app.logfile : ' ';
    let columns = [
      report.params.created, report.params.platform, report.params.version,
      report.params.pyversion, report.user.user, report.user.steps,
      report.user.info, report.app.preferences, log, report.app.appname
    ];
    writeCSVColumns(buglog, columns);
    return true;
  } catch (err) {
    return false;
  }
}
server.listen(port);

console.log(`Listening on ${port}`);

server.post('/auth', (req, res) => {
  console.log(req.body);
  let key = req.body.passphrase;
  if (key === passphrase) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    client.connect();
    client.query('SELECT * FROM bugs', (err, sqlresp) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
          'Success': 'false'
        });
        res.write('' + JSON.stringify(sqlresp));
        res.end();
        throw err;
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Success': 'true'
        });
        for (row of sqlresp.rows) res.write(`<p>${JSON.stringify(row)}</p>`);
        res.end();
      }
      client.end();
    });
  } else {
    res.writeHead(403, {
      'Content-Type': 'text/plain',
      'Success': 'false'
    });
    res.write('Invalid passphrase!');
    res.end();
  }
});

server.get('/list-success', function (req, res) {

})

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
  const parameters = [
    new Date(Date.parse(report.params.created)).toISOString(),
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
      res.writeHead(500, {
        'Content-Type': 'text/plain',
        'Success': 'false'
      });
      res.write('' + JSON.stringify(sqlresp));
      res.end();
      throw err;
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Success': 'true'
      });
      res.write('Successfully submitted bug report!');
      res.end();
    }
    client.end();
  });
});

console.log('Handling POST requests for /bug_report');