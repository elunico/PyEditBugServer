const Client = require('pg').Client;

class CommitToDatabaseController {
  constructor(httpResponse, report, richResponse) {
    this.httpResponse = httpResponse;
    this.report = report;
    this.richResponse = richResponse;
  }

  handle() {
    this.commitReportToDB(this.httpResponse, this.report, this.richResponse);
  }

  commitReportToDB(httpResponse, report, richResponse) {
    const queryTemplate =
        'INSERT into bugs (created, platform, version, pyversion, user_user, steps, info, preferences, log, appname) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);';
    let isoDate = new Date(Date.parse(report.params.created)).toUTCString();
    const parameters = [
      isoDate, report.params.platform, report.params.version,
      report.params.pyversion, report.user.user, report.user.steps,
      report.user.info, report.app.preferences, report.app.logfile,
      report.app.appname
    ];
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    client.connect();
    client.query(queryTemplate, parameters, (err, sqlresp) => {
      if (err) {
        console.warn('SQL error at submit report on web');
        console.warn(JSON.stringify(err));
        httpResponse.writeHead(
            500, {'Content-Type': 'text/plain', 'Success': 'false'});
        httpResponse.write('' + JSON.stringify(err));
        httpResponse.end();
        // throw err;
      } else {
        if (richResponse) {
          httpResponse.render(
              'web-submit-success.pug',
              {message: JSON.stringify(report, null, 4)});
        } else {
          httpResponse.writeHead(
              200, {'Content-Type': 'text/plain', 'Success': 'true'});
          httpResponse.write('Successfully submitted bug report!');
        }
        httpResponse.end();
      }
      client.end();
    });
  }
}

module.exports = CommitToDatabaseController;