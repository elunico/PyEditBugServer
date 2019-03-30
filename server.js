/* eslint-disable quotes */
/* eslint-disable no-console */
const express = require('express');
const SearchResultsController = require('./controllers/SearchResultsController');
const SearchResultsCSVController = require('./controllers/SearchResultsCSVController');
const CredController = require('./controllers/CredController');
const GenerateTokenController = require('./controllers/GenerateTokenController');
const validTokenOrThrow = require('./controllers/TokenVerifier');
const CommitToDatabaseController = require('./controllers/CommitToDatabaseController');

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

server.get('/search', (_, res) => res.redirect('/search-stop'));

server.post('/search', (req, res) => {
  if (req.body.passphrase === passphrase)
    res.render('search');
  else
    res.redirect('/search-stop');
});

server.get('/submit_report', (_, res) => res.render('submit_report'));

server.get('/search-results', (req, res) => new SearchResultsController(req, res));

server.get('/api-docs', (_, res) => res.render('api-docs'));

server.get('/', (_, res) => res.render('index'));

server.get('/search-stop', (_, res) => res.render('search-stop'));

server.get('/cred', (_, res) => res.redirect(301, '/'));

server.post('/cred', (req, res) => new CredController(req, res));

server.get('/do-submit', (_, res) => res.redirect(301, '/'));

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
  let action = new CommitToDatabaseController(res, report, true);
  action();
});

server.get('/api/search', (req, res) => validTokenOrThrow(req.query.token)
  .then(() => new SearchResultsCSVController(req, res))
  .catch(() => res.render('invalid-token')));

server.post('/api/public/submit-report', function (req, res) {
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
  let action = new CommitToDatabaseController(res, report, false);
  action();
});

server.get('/api/public/new-token', (_, res) => res.render('token-stop'));

server.post('/api/generate-token', (req, res) => new GenerateTokenController(req.connection.remoteAddress, req, res));

console.log(`Mapped all routes.`);
