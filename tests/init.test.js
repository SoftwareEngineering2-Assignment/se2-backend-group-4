/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

test('GET /statistics returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got(`general/statistics`);
  //t.is(body.sources,1);
  //body,sources=0
  t.is(body.sources,0);
  t.assert(body.success);
  t.is(statusCode, 200);
});

test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});




test('GET /test-url returns correct  code', async (t) => {

  const test_url = "https://se2-frontend-4.netlify.app/";

  const { body, statusCode } = await t.context.got(`general/test-url?url=${test_url}`);
  t.assert(body.active);
  t.is(statusCode, 200);
  

});

test('GET /test-url returns false status  code', async (t) => {

  const wrong_url = "https://se2-end-4.netlify.app/";

  const { body, statusCode } = await t.context.got(`general/test-url?url=${wrong_url}`);

  t.assert(!body.active);
  t.is(body.status, 500);


});

//may add headers and params
test('GET /test-url-request returns correct status code for get', async (t) => {
  const test_url = "https://se2-frontend-4.netlify.app/";
  const type = 'GET';
  //const headers ='headers';
  //const param = 'param';

  const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
  t.is(statusCode, 200);
  t.is(body.status, 200);
  console.log(statusCode,body)

});

test('GET /test-url-request returns correct status code for post', async (t) => {
  const test_url = "https://se2-frontend-4.netlify.app/";
  const type = 'POST';
  //const headers ='headers';
  //const param = 'param';

  const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
  t.is(statusCode, 200);
  t.is(body.status, 500); //post without body
  console.log(statusCode,body)

});

test('GET /test-url-request returns correct status code for put', async (t) => {
  const test_url = "https://se2-frontend-4.netlify.app/";
  const type = 'PUT';
  

  const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
  t.is(statusCode, 200);
  t.is(body.status, 500);  //put without previous post
  console.log(statusCode,body)

});

test('GET /test-url-request returns false type', async (t) => {
  const test_url = "https://se2-frontend-4.netlify.app/";
  const type = 'PUSH'
  

  const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
  t.is(statusCode, 200);
  t.is(body.status, 500);
  //console.log(statusCode,body)
});

