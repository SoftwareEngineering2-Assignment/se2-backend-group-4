/* eslint-disable import/no-unresolved */
require('dotenv').config();
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const sinon = require('sinon');


const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const User = require('../src/models/user');
let user;

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
  user = await User.create({
      username: 'user',
      password: 'password',
      email: 'email',
    });
  });

test.after.always((t) => {
  t.context.server.close();
  User.findByIdAndDelete(user._id);
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
    // console.log(statusCode,body);

  });

 test('POST /create-dashboard returns correct response and status code', async (t) => {
    mongoose();
    const token = jwtSign({id: 1});
    
    const resultd1 =  await new Dashboard({name:'DashName',password:'password1'}).save();
    // console.log(resultd1); 
    const name = resultd1.name ;
    const nextId = resultd1.nextId;

    const body = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :{name}}).json();
   
    // console.log(body);
    t.assert(body.success);
})


 test('POST /create-dashboard returns correct response and status code for dupl dashboard', async (t) => {
    //mongoose();
    const token = jwtSign({id: user._id});
    
    await Dashboard.create({
      name: 'Dash1',
      layout:[],
      items:{},
      nextId: 1,
      password: '',
      shared: 0,
      views: 5,
      owner: user._id,
      createdAt:'',
    });
    // console.log(user._id)

    const resultd3 = new Dashboard({name:'Dash1',nextId:2});
    console.log(resultd3)

    const {body} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :resultd3});
    
    // console.log(body.status);
    t.is(body.status, 409);
    
});

test('POST /delete-dashboard returns correct response when selected dashboard is not found ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  // console.log(user._id)
  
  const body_del= {id:0} //id not existing

  const {body} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{ json :body_del});
  
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');

});

test('POST /delete-dashboard returns correct response when selected dashboard is found and deleted', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
    
 dash = await Dashboard({
    name: 'DashToDel',
    layout:[],
    items:{},
    nextId: 1,
    password: '',
    shared: 0,
    views: 5,
    owner: user._id,
    createdAt:'',
  }).save();


  
  const id = {id:dash._id}; //id of dashboard created above
  
  const {body} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{ json :id});
  
  console.log(body);
  t.assert(body.success);

});


test('GET /dashboard returns correct response when selected dashboard exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
    
 dash = await Dashboard({
    name: 'DashToGet',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();


  
  const id = dash._id; //id of dashboard created above
  // console.log(dash,id)
  const {body,statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
  
  t.assert(body.success);

});

test('GET /dashboard returns correct response when selected dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id:user._id});
    
  const id = '67ab17187c66d60ad82cf6cc'; //id of non existing dashboard
  const {body} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
  
  // console.log(body,body.status,body.message);
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');
});

test('GET /save-dashboard returns correct response when selected dashboard exists and is updated successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
    
 dash = await Dashboard({
    name: 'DashToSave',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();


  const id = {id:dash._id}; //id of dashboard created above
  // console.log(dash,id)
  const {body,statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{ json :id});
  
  t.assert(body.success);

});

test('POST /save-dashboard returns correct response when selected dashboard is not found ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  // console.log(user._id)
  
  const body_id= {id:0} //id not existing

  const {body} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{ json :body_id});
  
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');

});


test('POST /clone-dashboard returns correct response when dashboard clones successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
    
 dash = await Dashboard({
    name: 'DashToClone',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const new_name='DashSuccessClone';
  const DashBody = {dashboardId:dash._id, name:new_name}; //Body of new dashboard with new ,non existing name

  console.log(DashBody)
  const {body,statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  console.log(body)
  t.assert(body.success);

});


test('POST /clone-dashboard returns correct response when dashboard with same name already exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 //Creat dashboard we want to clone
 dash1 = await Dashboard({
    name: 'DashToClone',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  //Create dashboard with sane name as the one ,we want the cloned dashboard to have
  dash2 = await Dashboard({
    name: 'DashNameExisting',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 4,
    owner: user._id,
    createdAt:'',
  }).save();

  const DashBody = {dashboardId:dash1._id,name:'DashNameExisting'}; //Dashboard body with same name as the one created above

  console.log(dash,DashBody)
  const {body,statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  
  t.is(body.status, 409);
  t.is(body.message, 'A dashboard with that name already exists.');

});

test('POST /check-password-needed returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToClone',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc';
  const DashBody = {user:user._id, dashboardId:wrong_dash_id}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

test('POST /check-password-needed returns correct response when owner wants to access dashboard ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToView',
    layout:[],
    items:{},
    nextId: 6,
    password: 'null',
    shared: 1,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();


  const test_user = {id: user._id} //test_user with same id as the owner
  const DashBody = {user: test_user, dashboardId:dash._id}; 
  
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  console.log(body,body.success,body.owner,body.shared)
  t.assert(body.success);
  t.is(body.owner, 'self');

});

test('POST /check-password-needed returns correct response when dashboard is not shared ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToView',
    layout:[],
    items:{},
    nextId: 6,
    password: 'null',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
  const test_user = {id: diffUserId}; //test_user with same id as the owner
  const DashBody = {user: test_user, dashboardId:dash._id}; 
  
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  console.log(body,body.success,body.owner,body.shared)
  t.assert(body.success);
  t.is(body.owner, '');
  t.assert(!body.shared);

});

test('POST /check-password-needed returns correct response when dashboard shared with no password', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToView',
    layout:[],
    items:{},
    nextId: 6,
    // password: null, password sets to default=null
    shared: 1,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
  const test_user = {id: diffUserId}; //test_user with same id as the owner
  const DashBody = {user: test_user, dashboardId:dash._id}; 
  
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  console.log(body,body.success,body.owner,body.shared)
  t.assert(body.success);
  t.assert(body.shared);
  t.assert(!body.passwordNeeded);
});

test('POST /check-password-needed returns correct response when dashboard shared and password not null', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToView',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 1,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
  const test_user = {id: diffUserId}; //test_user with same id as the owner
  const DashBody = {user: test_user, dashboardId:dash._id}; 
  
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  console.log(body,body.success,body.owner,body.shared)
  t.assert(body.success);
  t.is(body.owner, '');
  t.assert(body.shared);
  t.assert(body.passwordNeeded);
});

test('POST /check-password returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc';
  const DashBody = {dashboardId:wrong_dash_id , password:dash.password}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

test('POST /check-password returns correct response when given password is wrong', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  
  const wrong_password = '123wrongpassword123';
  const DashBody = {dashboardId:dash._id , password:wrong_password}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  
  t.assert(body.success);
  t.assert(!body.correctPassword);

});

test('POST /check-password returns correct response when given password is correct', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: "12345CorrectPassword",
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const DashBody = {dashboardId:dash._id,password:"12345CorrectPassword"}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  console.log(body.success,body.correctPssword,body.owner);
  t.assert(body.success);
  t.assert(body.correctPassword);

});

test('POST /share-dashboard returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc';
  const DashBody = {dashboardId:wrong_dash_id}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

test('POST /share-dashboard returns correct response when shared successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const DashBody = {dashboardId:dash._id}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  
  t.assert(body.success);
  t.assert(body.shared);
});

test('POST /share-dashboard returns correct response when dashboard stops being shared successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToCheckPassword',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 1,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const DashBody = {dashboardId:dash._id}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  
  t.assert(body.success);
  t.assert(!body.shared);
});

test('POST /change-password returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToClone',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const new_password='123NewPassword'
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc';
  const DashBody = {dashboardId:wrong_dash_id,password:new_password}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/change-password?token=${token}`,{json:DashBody});
  
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

test('POST /change-password returns correct response when dashboard password changes successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});

 dash = await Dashboard({
    name: 'DashToClone',
    layout:[],
    items:{},
    nextId: 6,
    password: '',
    shared: 0,
    views: 15,
    owner: user._id,
    createdAt:'',
  }).save();

  const new_password='123NewPassword'
  const DashBody = {dashboardId:dash._id,password:new_password}; 

  const {body,statusCode} = await t.context.got.post(`dashboards/change-password?token=${token}`,{json:DashBody});
  
  t.assert(body.success);
});