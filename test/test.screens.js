var express = require('express');
var app = express.createServer();
var auth = require('../lib/authenticate');
var should = require('should');
var nconf = require('nconf');
var configurations = module.exports;
var settings = require('../settings')(app, configurations, express);

nconf.argv().env().file({ file: 'test/local-test.json' });

var redis = require('./db-test');
var db = redis.redisConnect(settings);

var screens = require('../lib/screens');
var projects = require('../lib/projects');

var projectReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Project'
  }
};

var screenReq = {
  session: {
    email: 'test@test.org'
  },
  body: {
    title: 'My Screen',
    is_start: true,
    layout: 'col1'
  },
  params: {
    id: 1
  }
};

describe('screen', function() {
  before(function(done) {
    var req = projectReq;
    projects.add(req, db, function(err, project) {
      done();
    });
  });

  after(function(done) {
    db.flushdb(done);
    console.log('cleared test screens database');
  });

  describe('POST /screen', function() {
    var req = screenReq;

    it('adds a new screen', function(done) {
      screens.add(req, db, function(err, screen) {
        screen.title.should.equal(req.body.title);
        screen.is_start.should.equal(req.body.is_start);
        screen.layout.should.equal(req.body.layout);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      screens.add(req, db);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        screens.get(req, db, 2, function(err, screen) {
          screen.title.should.equal(req.body.title);
          screen.is_start.should.equal(req.body.is_start);
          screen.layout.should.equal(req.body.layout);
          done();
        });
      }, 10);
    });
  });

  describe('GET /list', function() {
    it('returns a list of available screens for the project', function(done) {
      var req = screenReq;

      screens.list(req, db, function(errList, screenList) {
        screenList[0].title.should.equal(req.body.title);
        screenList[0].is_start.should.equal(req.body.is_start);
        screenList[0].layout.should.equal(req.body.layout);
        done();
      });
    });
  });

  describe('GET /screen/:id', function() {
    var req = screenReq;

    it('returns a specific screen', function(done) {
      screens.get(req, db, 1, function(err, screen) {
        screen.title.should.equal(req.body.title);
        done();
      });
    });

    it('returns no screen', function(done) {
      screens.get(req, db, 12345, function(err, screen) {
        should.not.exist(screen);
        done();
      });
    });
  });

  describe('PUT /screen/:id', function() {
    var req = screenReq;

    it('updates a specific screen', function(done) {
      req.body.title = 'My Screen2';
      screens.update(req, db, 1, function(err, screen) {
        screen.title.should.equal(req.body.title);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      req.body.title = 'My Screen3';
      screens.update(req, db, 1);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        screens.get(req, db, 1, function(err, screen) {
          screen.title.should.equal(req.body.title);
          done();
        });
      }, 10);
    });
  });

  describe('DELETE /screen/:id', function() {
    var req = screenReq;

    it('attempts to delete a screen', function(done) {
      screens.remove(req, db, 1, function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('accepts an empty callback', function(done) {
      screens.remove(req, db, 2);

      // wait 10ms for db transaction to complete
      setTimeout(function() {
        screens.list(req, db, function(err, screenList) {
          screenList.should.eql([]);
          done();
        });
      }, 10);
    });
  });
});