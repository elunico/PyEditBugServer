const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const buglog = 'bugs.csv'

const server = express();
server.use(bodyParser.json());

function repeatStr(s, i) {
  let x = '';
  for (let j = 0; j < i; j++)
    x += s;
  return x;
}

function writeCsvColumnEntry(file, value, initial = false) {
  if (initial)
    fs.appendFileSync(file, '"' + value + '"', 'utf-8');
  else
    fs.appendFileSync(file, ',"' + value + '"', 'utf-8');
}

function writeReportToFile(report, verbose = false) {

  let time = new Date().toISOString();
  try {
    fs.appendFileSync(buglog, repeatStr('*', 60) + '\n', 'utf8');
    writeCsvColumnEntry(buglog, "Report", true);
    writeCsvColumnEntry(buglog, report.params.created);
    writeCsvColumnEntry(buglog, report.params.platform);
    writeCsvColumnEntry(buglog, report.params.version);
    writeCsvColumnEntry(buglog, report.params.pyversion);
    writeCsvColumnEntry(buglog, report.user.user);
    writeCsvColumnEntry(buglog, report.user.steps);
    writeCsvColumnEntry(buglog, report.user.info);
    writeCsvColumnEntry(buglog, report.app.preferences);
    if (verbose) writeCsvColumnEntry(buglog, report.app.logfile);
    writeCsvColumnEntry(buglog, report.app.appname);


    return true;
  } catch (err) {
    return false;
  }

}


server.listen(8099);
server.post('/bug-report', (req, res) => {

  let report = {
    "params": {
      "created": req.body.parameters.created.replace('\n', ' '),
      "platform": req.body.parameters.platform.replace('\n', ' '),
      "version": req.body.parameters.version.replace('\n', ' '),
      "pyversion": req.body.parameters.pyversion.replace('\n', ' ')
    },
    'user': {
      "user": req.body.user.user.replace('\n', ' '),
      "steps": req.body.user.steps.replace('\n', ' '),
      "info": req.body.user.info.replace('\n', ' ')
    },
    'app': {
      "preferences": JSON.stringify(JSON.parse(req.body.app.preferences)),
      "logfile": req.body.app.logfile.replace('\n', ' '),
      'appname': req.body.app.appname.replace('\n', ' ')
    }
  }

  if (writeReportToFile(report)) {

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Success': 'true'
    });
    res.write("Successfully submitted bug report");
    res.end();
  } else {
    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Success': 'false'
    });
    res.write("An internal server error occurred. Report failed to submit");
    res.end();
  }

});


