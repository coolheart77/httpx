'use strict';

const http = require('http');
const zlib = require('zlib');
const assert = require('assert');

const httpx = require('../');

const server = http.createServer((req, res) => {
  if (req.url === '/timeout') {
    setTimeout(() => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello world!');
    }, 200);
  } else if (req.url === '/compression') {
    res.writeHead(200, {
      'content-encoding': 'gzip'
    });
    zlib.gzip('Hello world!', function (err, buff) {
      res.end(buff);
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello world!');
  }
});

var make = function (server) {
  const port = server.address().port;
  var prefix = 'http://127.0.0.1:' + port;

  return function (path, opts) {
    return httpx.request(prefix + path, opts);
  };
};

describe('httpx', () => {
  before((done) => {
    server.listen(0, done);
  });

  after((done) => {
    server.close(done);
  });

  it('should ok', function* () {
    var res = yield make(server)('/');
    assert.equal(res.statusCode, 200);
    var result = yield httpx.read(res, 'utf8');
    assert.equal(result, 'Hello world!');
  });

  it('compression should ok', function* () {
    var res = yield make(server)('/compression');
    assert.equal(res.statusCode, 200);
    var result = yield httpx.read(res, 'utf8');
    assert.equal(result, 'Hello world!');
  });

  it('timeout should ok', function* () {
    try {
      yield make(server)('/timeout', {timeout: 100});
    } catch (ex) {
      assert.equal(ex.name, 'RequestTimeoutError');
      // assert.equal(ex.message, '');
      return;
    }
    assert.ok(false, 'should not ok');
  });
});
