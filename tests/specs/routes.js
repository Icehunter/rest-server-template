const { should } = require('chai');
const Lab = require('lab');
const fs = require('fs');
const path = require('path');

should();

const lab = exports.lab = Lab.script();

const server = require('../../index.js');

lab.experiment('route experiments:', () => {
  lab.before((done) => {
    process.nextTick(() => {
      done();
    });
  });
  lab.test('health route responds with { running: true }', (done) => {
    server.inject({
      method: 'GET',
      url: '/system/health'
    }, (response) => {
      response.headers['content-type'].should.equal('application/json; charset=utf-8');
      response.statusCode.should.equal(200);
      const result = response.result;
      result.should.eql({
        running: true
      });
      done();
    });
  });
  lab.test('index route responds with html', (done) => {
    server.inject({
      method: 'GET',
      url: '/'
    }, (response) => {
      response.headers['content-type'].should.equal('text/html; charset=utf-8');
      response.statusCode.should.equal(200);
      const result = response.result;
      result.should.equal(fs.readFileSync(path.join(__dirname, '../../static/index.html'), 'utf-8'));
      done();
    });
  });
});
