module.exports = {
  handleSQLError: function (err, sqlClient, httpResponse) {
    console.warn(
      'SQL error in attempt to read records from database. Passphrase passed');
    console.warn(JSON.stringify(err));
    httpResponse.writeHead(
      500, { 'Content-Type': 'text/plain', 'Success': 'false' });
    httpResponse.write('' + JSON.stringify(err));
    httpResponse.end();
    sqlClient.end();
  }
};
