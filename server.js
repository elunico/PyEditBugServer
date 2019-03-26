// var bp = require('body-parser');
var express = require('express');
var fs = require('fs');
var buglog = 'bugs.csv';
var server = express();
server.use(express.json());

const port = process.env.PORT || 8099;

const {
  Client
} = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();


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
  client.query(
    'INSERT into bugs (created, platform, version, pyversion, user_user, steps, info, preferences, log, appname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    report.params.created, report.params.platform, report.params.version,
    report.params.pyversion, report.user.user, report.user.steps,
    report.user.info, report.app.preferences, report.app.logfile,
    report.appnameapp.appname, (err, res) => {
      if (err) {
        res.writeHead(
          500, {
            'Content-Type': 'text/plain',
            'Success': 'false'
          });
        res.write(
          'An internal server error occurred. Report failed tosubmit');
        res.end();
        throw err;
      }
      for (let row of res.rows) {
        console.log(JSON.stringify(row));
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Success': 'true'
        });
        res.write('Successfully submitted bug report');
        res.end();
      }
      client.end();
    });
  // if (writeReportToFile(report)) {
  //   res.writeHead(200, {'Content-Type': 'text/plain', 'Success': 'true'});
  //   res.write('Successfully submitted bug report');
  //   res.end();
  // } else {
  //   res.writeHead(500, {'Content-Type': 'text/plain', 'Success': 'false'});
  //   res.write('An internal server error occurred. Report failed to submit');
  //   res.end();
  // }
});

console.log('Handling POST requests for /bug_report');