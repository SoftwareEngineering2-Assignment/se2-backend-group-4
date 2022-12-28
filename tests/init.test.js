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

  // t.is(body.sources,0); Remove because we add sources during testing,so body.sources doesn't have a fixed value

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

//test that GET /dashboards returns correct statusCode=200 and body got an authenticate user
test('GET /dashboards returns correct response and status code', async (t) => {
    const token = jwtSign({id: user._id});
    //Create 2 new test dashboards for the authenticated user
    dash1 = await Dashboard({
      name: 'Dashboard1',
      layout:[],
      items:{},
      nextId: 1,
      password: '',
      shared: 0,
      views: 5,
      owner: user._id,
      createdAt:'',
    }).save();

    dash2 = await Dashboard({
      name: 'Dashboard2',
      layout:[],
      items:{},
      nextId: 2,
      password: '',
      shared: 1,
      views: 7,
      owner: user._id,
      createdAt:'',
    }).save();

    //send GET request with authenticated user's token in query
    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    //check response
    t.is(statusCode, 200);
    t.assert(body.success);
  });

//test that POST /create-dashboard successfully creates new dashboard when user is authenticated and dashboard name doesn't already exist
 test('POST /create-dashboard returns correct response and status code', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
    //create new dashboard for user with name=Dashname
    const dashboard1 =  await new Dashboard({name:'DashName',password:'password1'}).save();
    const name = dashboard1.name ;
    //send POST request with authenticated user's token in query and new dashboard name in body
    const body = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :{name}}).json();
    //check response
    t.assert(body.success);
})

//test that POST /create-dashboard successfully doesn't create new dashboard,when another dashboard with same name already exist
 test('POST /create-dashboard returns correct response and status code for dupl dashboard', async (t) => {
    //mongoose();
    const token = jwtSign({id: user._id});
    //Create dashboard with name=Dash1 
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

    //create new dashboard with same name as the existing one
    const NewDash = new Dashboard({name:'Dash1',nextId:2});
  
    //send POST request with authenticated user's token in query and new dashboard name in body
    const {body} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :NewDash});
    //check response
    t.is(body.status, 409);   
});

//test that POST /delete-dashboard returns correct response when then given id doesn't belong to an existing dashboard
test('POST /delete-dashboard returns correct response when selected dashboard is not found ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  
  const body_del= {id:0} //dashboard id not existing
  //send POST request with authenticated user's token in query and dashboard id in body
  const {body} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{ json :body_del});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');

});

//test that POST /delete-dashboard successfully deletes a dashboard when given a correct dashboard id
test('POST /delete-dashboard returns correct response when selected dashboard is found and deleted', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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
  //send POST request with authenticated user's token in query and dashboard id in body
  const {body} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{ json :id});
  //check response
  t.assert(body.success);

});

//test that GET /dashboard returns correct response when an existing dashboard's id is given
test('GET /dashboard returns correct response when selected dashboard exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Create test dashboard 
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
  //send GET request with authenticated user's token and dashboard's id in query
  const {body,statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
  //check response
  t.assert(body.success);

});

//test that GET /dashboard returns correct response when the id given doesn't belong to an existing dashboard
test('GET /dashboard returns correct response when selected dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id:user._id});
    
  const id = '67ab17187c66d60ad82cf6cc'; //id of non existing dashboard
  //send GET request with authenticated user's token and dashboard's id in query
  const {body} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
  
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');
});

//test that POST /save-dashboard updates dashboard successfully when an existing dashboard's id is given
test('POST /save-dashboard returns correct response when selected dashboard exists and is updated successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Create test dashboard    
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
  //send POST request with authenticated user's token in query and dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{ json :id});
  //check response
  t.assert(body.success);

});

//test that POST /save-dashboard returns correct response when given id doesn't belong to an existing dashboard
test('POST /save-dashboard returns correct response when selected dashboard is not found ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  
  const body_id= {id:0} //dashboard id not existing
//send POST request with authenticated user's token in query and dashboard id in body
  const {body} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{ json :body_id});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The selected dashboard has not been found.');

});

//test POST/clone-dashboard clones the dashboard successfully when correct dashboard id and name are given
test('POST /clone-dashboard returns correct response when dashboard clones successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Create test dashboard 
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
  //Name of clone dashboard
  const new_name='DashSuccessClone';
  const DashBody = {dashboardId:dash._id, name:new_name}; //Body of new dashboard with new ,non existing name

 //send POST request with authenticated user's token in query and dashboard id and new_name in body
  const {body,statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  
  //check response
  t.assert(body.success);

});

//test POST/clone-dashboard returns correct response when correct in is given but new Dashboard name already exists 
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

  //send POST request with authenticated user's token in query and dashboard id and new_name in body
  const {body,statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'A dashboard with that name already exists.');

});

//test POST/check-password-needed returns correct response when the id given doesn't belong to an existing dashboard
test('POST /check-password-needed returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Create test Dashboard
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

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //wrond dashboard in 
  //post pody
  const DashBody = {user:user._id, dashboardId:wrong_dash_id}; 
 //send POST request with authenticated user's token in query , user id and wrond dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

//test POST/check-password-needed returns correct response when owner's id ad existing dashboard id are given
test('POST /check-password-needed returns correct response when owner wants to access dashboard ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//create test dashboard
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
  const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
  //send POST request with authenticated user's token in query , owner id and correct dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.is(body.owner, 'self');

});

//test POST/check-password-needed returns correct response when a user tries to access another user's dashboard that is not being shared
test('POST /check-password-needed returns correct response when dashboard is not shared ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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
  const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
  //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.is(body.owner, '');
  t.assert(!body.shared);

});

//test POST/check-password-needed returns correct response when a users tries to access another user's dashboard that doesn't have password
test('POST /check-password-needed returns correct response when dashboard shared with no password', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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
  const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
  //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.assert(body.shared);
  t.assert(!body.passwordNeeded);
});

//test POST/check-password-needed returns correct response when a users tries to access another user's dashboard that has a password
test('POST /check-password-needed returns correct response when dashboard shared and password not null', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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
  const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
  //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.is(body.owner, '');
  t.assert(body.shared);
  t.assert(body.passwordNeeded);
});

//test POST/check-password returns correct response the id given doesn't belong to an existing dashboard of the user
test('POST /check-password returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create dashboard
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

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //id not belonging to dashboard
  const DashBody = {dashboardId:wrong_dash_id , password:dash.password}; //POST body
  //send POST request with authenticated user's token in query , password and wrong dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

//test POST/check-password returns correct response when dashboard id is correct but password wrong
test('POST /check-password returns correct response when given password is wrong', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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

  
  const wrong_password = '123wrongpassword123'; //wrong password
  const DashBody = {dashboardId:dash._id , password:wrong_password};  //POST body
//send POST request with authenticated user's token in query , wrong password and existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.assert(!body.correctPassword);

});

//test POST /check-password returns correct response when given dashboard id and password are correct
test('POST /check-password returns correct response when given password is correct', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create dashboard
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

  const DashBody = {dashboardId:dash._id,password:"12345CorrectPassword"}; //POST body
 //send POST request with authenticated user's token in query , correct password and existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/check-password?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.assert(body.correctPassword);

});

//test POST /share-dashboard returns correct response when given dashboard id doesnt match any of the user's dashboard ids
test('POST /share-dashboard returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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

  
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //dashboard id that doesn't exist
  const DashBody = {dashboardId:wrong_dash_id}; //POST body
  //send POST request with authenticated user's token in query , non existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

//test POST /share-dashboard successfully shares a dashboard that was not being shared,when correct id is given
test('POST /share-dashboard returns correct response when shared successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard that is not being shared
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

  const DashBody = {dashboardId:dash._id};  //POST body
  //send POST request with authenticated user's token in query , existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.assert(body.shared);
});

//test POST /share-dashboard successfully stops being shared a dashboard that was not being shared,when correct id is given
test('POST /share-dashboard returns correct response when dashboard stops being shared successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard that is being shared
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

  const DashBody = {dashboardId:dash._id}; //POST body
  //send POST request with authenticated user's token in query , existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
  t.assert(!body.shared);
});

//test POST /change-password returns correct response when given dashboard id doesnt match any of the user's dashboard ids 
test('POST /change-password returns correct response when dashboard does not exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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

  const new_password='123NewPassword' //new password
  const wrong_dash_id = '67ab17187c66d60ad82cf6cc';////dashboard id that doesn't exist
  const DashBody = {dashboardId:wrong_dash_id,password:new_password}; //POST body
  //send POST request with authenticated user's token in query , new password and non existing dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/change-password?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');

});

//test POST /change-password successfully changes password when valid dashboard id and new password are given
test('POST /change-password returns correct response when dashboard password changes successfully', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
//Create test dashboard
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

  const new_password='123NewPassword' //new dashboard passwrod
  const DashBody = {dashboardId:dash._id,password:new_password}; //POST body
  //send POST request with authenticated user's token in query , valid new password and dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/change-password?token=${token}`,{json:DashBody});
  //check response
  t.assert(body.success);
});