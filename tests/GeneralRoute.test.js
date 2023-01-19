/* eslint-disable import/no-unresolved */
require('dotenv').config();
const {http,test,got,listen,app,User,Dashboard} = require('../src/RouteImport');
const Source = require('../src/models/source');
const sinon = require('sinon');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
  //create test user , dashboard and source for tests
  user = await User.create({username: 'user',password: 'password',email: 'email',});
  dash = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',}).save();
  source = await Source({name:'source1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',}).save();
});
  
test.after.always((t) => {
  t.context.server.close();
});

//test that GET /general/test-url returns correct response and statusCode when correct url is given 
test('GET /test-url returns correct  code', async (t) => {
    const correct_url = "https://se2-frontend-4.netlify.app/";
    const { body, statusCode } = await t.context.got(`general/test-url?url=${correct_url}`);
    t.assert(body.active);
    t.is(statusCode, 200);  
});
  
//test that GET /general/test-url returns correct response when wrong url is given 
test('GET /test-url returns false status  code', async (t) => {
  
    const wrong_url = "https://se2-end-4.netlify.app/";
    const { body } = await t.context.got(`general/test-url?url=${wrong_url}`);
  
    t.assert(!body.active);
    t.is(body.status, 500);
  
});
  
//test that GET /general/test-url-request returns correct statusCode=200 and response when correct url is given and type=GET
test('GET /test-url-request returns correct status code for get', async (t) => {
    const test_url = "https://se2-frontend-4.netlify.app/";
    const type = 'GET';
  
    const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
    t.is(statusCode, 200);
    t.is(body.status, 200);
});
  
//test that GET /general/test-url-request returns correct statusCode=200 and response when correct url is given and type=POST
test('GET /test-url-request returns correct status code for post', async (t) => {
    const test_url = "https://se2-frontend-4.netlify.app/";
    const type = 'POST';
  
    const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
    t.is(statusCode, 200);
    t.is(body.status, 500); //post without body
});
  
//test that GET /general/test-url-request returns correct statusCode=200 and response when correct url is given and type=PUT
test('GET /test-url-request returns correct status code for put', async (t) => {
    const test_url = "https://se2-frontend-4.netlify.app/";
    const type = 'PUT';
    
    const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
    t.is(statusCode, 200);
    t.is(body.status, 500);  //put without previous post
});
  
//test that GET /general/test-url-request returns correct statusCode=200 and response when correct url is given and wrong type
test('GET /test-url-request returns false type', async (t) => {
    const test_url = "https://se2-frontend-4.netlify.app/";
    const type = 'PUSH'
    
    const {statusCode,body} = await t.context.got(`general/test-url-request?url=${test_url}&type=${type}`);
    t.is(statusCode, 200);
    t.is(body.status, 500);
});

// GET 'general/statistics' returns status code 500 when error is thrown
test('GET /statistics handles error correctly', async (t) => {
  //Throw error
  const Stub = sinon.stub(User , 'countDocuments').throws(new Error('Something went wrong!'));
  //send GET request
  const {body } = await t.context.got('general/statistics');
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
     
  //Restore sub
  Stub.restore();
});