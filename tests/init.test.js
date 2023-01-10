/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');


//Initial test made as examples in class

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
  });

test.after.always((t) => {
  t.context.server.close();
});

// GET 'general/statistics' return statusCode=200 and correct response in body
test('GET /statistics returns correct response and status code', async (t) => {

  //send GET request
  const {body, statusCode} = await t.context.got('general/statistics');

  // t.is(body.sources,0); //Remove because we add sources during testing,so body.sources doesn't have a fixed value
  //check response
  t.assert(body.success);
  t.is(statusCode, 200);
});

//GET sources/sources return statusCode=200 when authentication token is valid
test('GET /sources returns correct response and status code', async (t) => {
  //valid authentication token
  const token = jwtSign({id: 1});
  //send GET request with token in query
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  //check response
  t.is(statusCode, 200);
});

