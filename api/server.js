'use strict';

var crypto = require('crypto'),
  express = require('express'),
  redis = require('redis'),
  db = redis.createClient(),
  app = express(),
  bodyParser = require('body-parser'),
  urlencodeParser = bodyParser.urlencoded({ extended: false }),
  _ = require('underscore'),
  async = require('async'),
  PORT = Number(process.env.PORT || 8020),
  SERVER = String(process.env.SERVER_NAME || 'localhost'),
  dbPrefix = 'snake:',
  APIKEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
  cssEscapeReg = new RegExp('(!|"|#|\\$|%|&|\'|\\(|\\)|\\*|\\+|,|-|\\.|/|:|;|<|=|>|\\?|@|\\[|\\]|\\^|`|\\{|\\|\\}|\\s)', 'g');

app.SERVER = SERVER;
app.PORT = PORT;


var tokenCheck = function(req, res, next) {
  var token = req.query && req.query.token;
  if (token === APIKEY) {
    next();
  } else {
    responseSend(res, 'token wrong');
  }
};

var responseSend = function(res, err, data) {
  var result = {};
  if (err) {
    result.error = err;
  } else {
    result.result = data;
  }
  res.send(result);
};

app.get('/', function(req, res) {
  res.redirect(301, '/scores');
});
app.post('/auth', function(req, res) {
  var workflow = new(require('events').EventEmitter)(),
    body = req.body || {},
    model = _.escape(body.model),
    platform = _.escape(body.platform),
    uuid = _.escape(body.uuid),
    version = _.escape(body.version);

  workflow.on('validateParams', function() {
    var errors = [];
    if (!model) {
      errors.push('model is required');
    }
    if (!platform) {
      errors.push('platform is required');
    }
    if (!uuid) {
      errors.push('uuid is required');
    }
    if (!version) {
      errors.push('version is required');
    }
    if (errors.length) {
      console.log(errors);
      responseSend(res, errors);
    } else {
      workflow.emit('checkUserName');
    }
  });

  workflow.on('saveScore', function() {
    console.log(model);
    console.log(platform);
    console.log(uuid);
    console.log(version);
    responseSend(res, null, {
      token: true
    });
  });

  workflow.emit('validateParams');
});
app.get('/scores', tokenCheck, function(req, res) {
  db.zrangebyscore(dbPrefix + 'z:scores', '-inf', '+inf', 'withscores', 'LIMIT', '0', '50', function(err, response) {
    if (err) {
      responseSend(res, err.toString());
    } else {
      var result = [],
        i = 0, l = response.length;

      for (; i<l; i++) {
        if (i%2 === 0) {
          result.push({
            name: response[i],
            score: response[i + 1]
          });
        }
      }
      responseSend(res, null, result);
    }
  });
});
app.post('/scores', tokenCheck, urlencodeParser, function(req, res) {
  var workflow = new(require('events').EventEmitter)(),
    body = req.body || {},
    score = parseInt(body.score, 10),
    prevScore = parseInt(body.prevScore, 10),
    name = _.escape(cssEscape((body.name || '').trim()));

  workflow.on('validateParams', function() {
    var errors = [];
    if (!score) {
      errors.push('score is required');
    }
    if (!name) {
      errors.push('name is required');
    }
    if (errors.length) {
      responseSend(res, errors);
    } else {
      workflow.emit('checkUserName');
    }
  });

  workflow.on('checkUserName', function() {
    db.zscore(dbPrefix + 'z:scores', name, function(err, response) {
      if (err) {
        responseSend(res, err.toString());
      } else {
        if (response === null || prevScore == response) {
          workflow.emit('saveScore');
        } else {
          responseSend(res, 'busy name');
        }
      }
    });
  });

  workflow.on('saveScore', function() {
    db.zadd(dbPrefix + 'z:scores', score, name, function() {
      responseSend(res, null, {
        success: true
      });
    });
  });

  workflow.emit('validateParams');
});

app.listen(app.PORT, function() {
  console.log('%s: Node server started on %s:%d ...', new Date(Date.now()), app.SERVER, app.PORT);
});

db.on("error", function (err) {
  console.log("DB Error: " + err);
});

function cssEscape(cl) {
  return cl.replace(cssEscapeReg, '');
}