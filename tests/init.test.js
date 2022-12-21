/* eslint-disable import/no-unresolved */
require('dotenv').config();
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');


const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');


const Dashboard = require('../src/models/dashboard');




async function createDashboard(name='',layout,items,nextId='',password='',shared,owner=''){
    try {
        const dashboard = await new Dashboard({name,nextId,password,owner}).save();
        return dashboard;
    }
    catch(e){
        return Promise.reject(reason=e);
    }
}


test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

test('GET /statistics returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got('general/statistics');
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

  const { body, statusCode } = await t.context.got(`general/test-url?url=${wrong_url}`);

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

test('GET /dashboards returns correct response and status code', async (t) => {
    const token = jwtSign({id: 1});
    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.is(statusCode, 200);
    t.assert(body.success);
    console.log(statusCode,body);

  });

 test('POST /dashboards returns correct response and status code', async (t) => {
    mongoose();
    const token = jwtSign({id: 1});
    
    const resultd1 =  await new Dashboard({name:'DashName',password:'password1'}).save();
    console.log(resultd1); 
    const name = resultd1.name ;
    const nextId = resultd1.nextId;

    const body = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :{name}}).json();
   
    console.log(body);
    t.assert(body.success);
});

/*
 test('POST /dashboards returns correct response and status code for dupl dashboard', async (t) => {
    mongoose();
    const token = jwtSign({id: 1});
    
    const resultd2 =  await new Dashboard({name:'Dash1',nextId:1}).save();
    console.log(resultd2); 
    const name2 = resultd2.name ;
    const nextId = resultd2.nextId;
    const resultd3 =  await new Dashboard({name:'Dash1',nextId:2,owner:resultd2._id}).save();
    console.log(resultd3); 
    const name3 = resultd3.name ;

    const body = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :{name3}}).json();
    
    console.log(body);
    t.assert(body.success);
    
});

*/
