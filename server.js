/* eslint-disable quotes */
/* eslint-disable no-console */
const express = require('express');
const SearchResultsController =
    require('./controllers/SearchResultsController');
const CredController = require('./controllers/CredController');
const GenerateTokenController =
    require('./controllers/GenerateTokenController');
const validTokenOrThrow = require('./controllers/TokenVerifier');
const CommitToDatabaseController =
    require('./controllers/CommitToDatabaseController');

const passphrase = process.env.SHA256_HASH_PHRASE;
const port = process.env.PORT || 8099;
const server = express();

server.use(express.json());
server.use(express.urlencoded());
server.use(express.static('public'));

server.set('view engine', 'pug');
server.set('views', './private/templates');

server.listen(port);

console.log(`Listening on ${port}`);

server.get('/search', (req, res) => {
  res.redirect('/search-stop');
});

server.post('/search', (req, res) => {
  let input = req.body.passphrase;
  if (input === passphrase) {
    res.render('search');
  } else {
    console.log(input);
    console.log('failed');
    res.redirect('/search-stop');
  }
});

server.get('/submit_report', (req, res) => {
  res.render('submit_report');
});

server.get('/search-results', (req, res) => {
  let controller = new SearchResultsController(req, res);
  controller.handle();
});

server.get('/api-docs', (req, res) => {
  res.render('api-docs');
});

server.get('/', (req, res) => {
  res.render('index');
});

server.get('/search-stop', (req, res) => {
  res.render('search-stop');
});

server.get('/cred', (req, res) => {
  console.log('GET /cred redirected to home');
  res.redirect(301, '/');
});

server.post('/cred', (req, res) => {
  let a = new CredController(req, res);
  a.handle();
});

server.get('/do-submit', (req, res) => {
  console.log('GET at /do-submit redirected to home');
  res.redirect(301, '/');
});

server.post('/do-submit', function(req, res) {
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
  let controller = new CommitToDatabaseController(res, report, true);
  controller.handle();
});

server.get('/api/search', (req, res) => {
  validTokenOrThrow(req.query.token)
    .then(() => new SearchResultsController(req, res).handleGetCSV())
    .catch(() => res.render('invalid-token'));
});

server.post('/api/public/submit-report', function(req, res) {
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
  let controller = new CommitToDatabaseController(res, report, false);
  controller.handle();
});

server.get('/api/public/new-token', (req, res) => {
  res.render('token-stop');
});

server.post('/api/generate-token', (req, res) => {
  let ip = /* req.headers['x-forwarded-for'] || */ req.connection.remoteAddress;
  let generateTokenController = new GenerateTokenController(ip, req, res);
  generateTokenController.handle();
});

// Update checking routes

const newestVersion = [6, 0, 0, 'rc'];

server.get('/updates-available', (req, res) => {
  let currentVersion =
      [req.query.major, req.query.minor, req.query.sub, req.query.vtype];
  if (!currentVersion) {
    res.writeHead(500, 'Invalid version', {'Content-Type': 'text/plain'});
    res.write('Invalid version provided ' + currentVersion);
    res.end();
  }
  // get newest version from somewhere?
  console.log(req.query.major);
  console.log(req.query.minor);
  console.log(req.query.sub);
  console.log(req.query.vtype);
  console.log(newestVersion);
  if (req.query.major < newestVersion[0]) {
    updateNeeded(currentVersion, newestVersion, res);
  } else if (req.query.major == newestVersion[0]) {
    if (req.query.minor < newestVersion[1]) {
      updateNeeded(currentVersion, newestVersion, res);
    } else if (req.query.minor == newestVersion[1]) {
      if (req.query.sub < newestVersion[2]) {
        updateNeeded(currentVersion, newestVersion, res);
      }
    }
  } else {
    res.writeHead(
      200, 'Success', {'Content-Type': 'text/plain', 'x-update': false});
    res.write('No update available');
    res.end();
  }
});

function updateNeeded(currentVersion, newestVersion, response) {
  response.writeHead(
    200, 'Success', {'Content-Type': 'text/plain', 'x-update': true});
  response.write(
    'Update available. You have version (' + currentVersion +
      ') newest version is (' + newestVersion + ')');
  response.end();
}

server.get('/get-update-script', (req, res) => {
  // TODO: ignores version query parameters
  let platform = req.query.platform;
  if (platform == 'bat') {
    res.sendFile(__dirname + '/private/updates/update_script.bat');
  } else {
    res.sendFile(__dirname + '/private/updates/update_script.sh');
  }
});

server.get('/get-update', (req, res) => {
  // TODO: ignores version query parameters
  res.sendFile(__dirname + '/private/updates/pyedit_test_update.py');
});

console.log(`Mapped all routes.`);
