/* eslint-disable import/no-unresolved */
require('dotenv').config();
const {mongoose} = require('../src/config');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const {http,test,got,listen,app,User,Dashboard,DeleteUsersAndDashboards} = require('../src/RouteImport');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
  user = await User.create({username: 'user',password: 'password',email: 'email',});
  });

test.after.always((t) => {
  t.context.server.close();
  //delete users and dashboards created for testing
  DeleteUsersAndDashboards();
});

//test POST/check-password-needed returns correct response when the id given doesn't belong to an existing dashboard
test('POST /check-password-needed returns correct response when dashboard does not exists', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
   //Create test Dashboard
   dash = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',
    }).save();
    const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //wrond dashboard in 
    //post pody
    const DashBody = {user:user._id, dashboardId:wrong_dash_id}; 
   //send POST request with authenticated user's token in query , user id and wrond dashboard id in body
    const {body} = await t.context.got.post(`dashboardsPassword/check-password-needed?token=${token}`,{json:DashBody});
    //check response
    t.is(body.status, 409);
    t.is(body.message, 'The specified dashboard has not been found.');
  });
  
  //test POST/check-password-needed returns correct response when owner's id ad existing dashboard id are given
  test('POST /check-password-needed returns correct response when owner wants to access dashboard ', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //create test dashboard
   dash = await Dashboard({name: 'DashToView',layout:[],items:{},nextId: 6,password: 'null',shared: 1,views: 15,owner: user._id,createdAt:'',
    }).save();
  
    const test_user = {id: user._id} //test_user with same id as the owner
    const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
    //send POST request with authenticated user's token in query , owner id and correct dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password-needed?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.is(body.owner, 'self');
  });
  
  //test POST/check-password-needed returns correct response when a user tries to access another user's dashboard that is not being shared
  test('POST /check-password-needed returns correct response when dashboard is not shared ', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name: 'DashToView',layout:[],items:{},nextId: 6,password: 'null',shared: 0,views: 15,owner: user._id,createdAt:'',
    }).save();
  
    const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
    const test_user = {id: diffUserId}; //test_user with same id as the owner
    const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
    //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password-needed?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.is(body.owner, '');
    t.assert(!body.shared);
  });
  
  //test POST/check-password-needed returns correct response when a users tries to access another user's dashboard that doesn't have password
  test('POST /check-password-needed returns correct response when dashboard shared with no password', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name: 'DashToView',layout:[],items:{},nextId: 6,// password: null, password sets to default=null
                              shared: 1,views: 15,owner: user._id,createdAt:'',
    }).save();
  
    const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
    const test_user = {id: diffUserId}; //test_user with same id as the owner
    const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
    //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password-needed?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.assert(body.shared);
    t.assert(!body.passwordNeeded);
  });
  
  //test POST/check-password-needed returns correct response when a users tries to access another user's dashboard that has a password
  test('POST /check-password-needed returns correct response when dashboard shared and password not null', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name: 'DashToView',layout:[],items:{},nextId: 6,password: '',shared: 1,views: 15, owner: user._id,createdAt:'',
    }).save();
  
    const diffUserId='63ab2ba0c0fe7142d0f2c003' //User ID different from Owner ID
    const test_user = {id: diffUserId}; //test_user with same id as the owner
    const DashBody = {user: test_user, dashboardId:dash._id}; //POST body
    //send POST request with authenticated user's token in query , user id != owner id and existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password-needed?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
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
   dash = await Dashboard({name:'DashToCheckPassword',layout:[],items:{},nextId: 6,password:'',shared:0,views:15,owner: user._id,createdAt:'',
    }).save();
  
    
    const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //id not belonging to dashboard
    const DashBody = {dashboardId:wrong_dash_id , password:dash.password}; //POST body
    //send POST request with authenticated user's token in query , password and wrong dashboard id in body
    const {body} = await t.context.got.post(`dashboardsPassword/check-password?token=${token}`,{json:DashBody});
    //check response
    t.is(body.status, 409);
    t.is(body.message, 'The specified dashboard has not been found.');
  });
  
  //test POST/check-password returns correct response when dashboard id is correct but password wrong
  test('POST /check-password returns correct response when given password is wrong', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name:'DashToCheckPassword',layout:[],items:{},nextId: 6,password:'',shared: 0,views: 15,owner: user._id,createdAt:'',
    }).save();
   
    const wrong_password = '123wrongpassword123'; //wrong password
    const DashBody = {dashboardId:dash._id , password:wrong_password};  //POST body
  //send POST request with authenticated user's token in query , wrong password and existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.assert(!body.correctPassword);
  });
  
  //test POST /check-password returns correct response when given dashboard id and password are correct
  test('POST /check-password returns correct response when given password is correct', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create dashboard
   dash = await Dashboard({name:'DashToCheckPassword',layout:[],items:{},nextId: 6,password:"12345CorrectPassword",shared: 0,views: 15,
                            owner: user._id,createdAt:'',
    }).save();
  
    const DashBody = {dashboardId:dash._id,password:"12345CorrectPassword"}; //POST body
   //send POST request with authenticated user's token in query , correct password and existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/check-password?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.assert(body.correctPassword);
  });
  
  //test POST /share-dashboard returns correct response when given dashboard id doesnt match any of the user's dashboard ids
  test('POST /share-dashboard returns correct response when dashboard does not exists', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name:'DashToCheckPassword',layout:[],items:{},nextId:6,password:'',shared:0,views:15,owner:user._id,createdAt:'',
    }).save();
  
    const wrong_dash_id = '67ab17187c66d60ad82cf6cc'; //dashboard id that doesn't exist
    const DashBody = {dashboardId:wrong_dash_id}; //POST body
    //send POST request with authenticated user's token in query , non existing dashboard id in body
    const {body} = await t.context.got.post(`dashboardsPassword/share-dashboard?token=${token}`,{json:DashBody});
    //check response
    t.is(body.status, 409);
    t.is(body.message, 'The specified dashboard has not been found.');
  });
  
  //test POST /share-dashboard successfully shares a dashboard that was not being shared,when correct id is given
  test('POST /share-dashboard returns correct response when shared successfully', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard that is not being shared
   dash = await Dashboard({name:'DashToCheckPassword',layout:[],items:{},nextId:6,password:'',shared:0,views:15,owner: user._id,createdAt:'',
    }).save();
  
    const DashBody = {dashboardId:dash._id};  //POST body
    //send POST request with authenticated user's token in query , existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/share-dashboard?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.assert(body.shared);
  });
  
  //test POST /share-dashboard successfully stops being shared a dashboard that was not being shared,when correct id is given
  test('POST /share-dashboard returns correct response when dashboard stops being shared successfully', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard that is being shared
   dash = await Dashboard({name: 'DashToCheckPassword',layout:[],items:{},nextId:6,password:'',shared:1,views:15,owner: user._id,createdAt:'',
    }).save();
  
    const DashBody = {dashboardId:dash._id}; //POST body
    //send POST request with authenticated user's token in query , existing dashboard id in body
    const {body,statusCode} = await t.context.got.post(`dashboardsPassword/share-dashboard?token=${token}`,{json:DashBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
    t.assert(!body.shared);
  });
  
  //test POST /change-password returns correct response when given dashboard id doesnt match any of the user's dashboard ids 
  test('POST /change-password returns correct response when dashboard does not exists', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,
                            owner: user._id,createdAt:'',
    }).save();
  
    const new_password='123NewPassword' //new password
    const wrong_dash_id = '67ab17187c66d60ad82cf6cc';////dashboard id that doesn't exist
    const DashBody = {dashboardId:wrong_dash_id,password:new_password}; //POST body
    //send POST request with authenticated user's token in query , new password and non existing dashboard id in body
    const {body} = await t.context.got.post(`dashboardsPassword/change-password?token=${token}`,{json:DashBody});
    //check response
    t.is(body.status, 409);
    t.is(body.message, 'The specified dashboard has not been found.');
  });
  
  //test POST /change-password successfully changes password when valid dashboard id and new password are given
  test('POST /change-password returns correct response when dashboard password changes successfully', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
  //Create test dashboard
   dash = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,
                            owner: user._id,createdAt:'',
    }).save();
  
    const new_password='123NewPassword' //new dashboard passwrod
    const DashBody = {dashboardId:dash._id,password:new_password}; //POST body
    //send POST request with authenticated user's token in query , valid new password and dashboard id in body
    const {body} = await t.context.got.post(`dashboardsPassword/change-password?token=${token}`,{json:DashBody});
    //check response
    t.assert(body.success);
  });