function writeCSVCompleteLine(file, line) {
  appendFileSync(file, line + '\n', 'utf-8');
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