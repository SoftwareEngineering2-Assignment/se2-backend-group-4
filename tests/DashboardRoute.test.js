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

//test that GET /dashboards returns correct statusCode=200 and body got an authenticate user
test('GET /dashboards returns correct response and status code', async (t) => {
    mongoose();
    const token = jwtSign({id: user._id});
    //Create 2 new test dashboards for the authenticated user
    dash1 = await Dashboard({name: 'Dashboard1',layout:[],items:{},nextId: 1,password: '',shared: 0,views: 5,owner: user._id,createdAt:'',
    }).save();

    dash2 = await Dashboard({name: 'Dashboard2',layout:[],items:{},nextId: 2,password: '',shared: 1,views: 7,owner: user._id,createdAt:'',
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
    //const dashboard1 =  await new Dashboard({name:'DashName',password:'password1'}).save();
    dashboard1 = await Dashboard({name: 'DashName',layout:[],items:{},nextId: 6,password: 'password1',shared: 0,views: 15,
                                    owner: user._id,createdAt:'',
    }).save();

    const new_name = 'DiffDashName' ;  //dashboard name different from the existing one
    const dashBody = {name:new_name};
    //send POST request with authenticated user's token in query and new dashboard name in body
    const {body,statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{json:dashBody});;
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
})

//test that POST /create-dashboard successfully doesn't create new dashboard,when another dashboard with same name already exist
 test('POST /create-dashboard returns correct response and status code for dupl dashboard', async (t) => {
    //mongoose();
    const token = jwtSign({id: user._id});
    //Create dashboard with name=Dash1 
    await Dashboard.create({name: 'Dash1',layout:[],items:{},nextId: 1,password: '',shared: 0,views: 5, owner: user._id,createdAt:'',
    });

    //create new dashboard with same name as the existing one
    const NewDash = new Dashboard({name:'Dash1',nextId:2});

    //send POST request with authenticated user's token in query and new dashboard name in body
    const {body} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`,{ json :NewDash});
    //check response
    t.is(body.status, 409);   
    t.is( body.message, 'A dashboard with that name already exists.');
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
 dash = await Dashboard({name: 'DashToDel',layout:[],items:{},nextId: 1,password: '',shared: 0,views: 5,owner: user._id,createdAt:'',
  }).save();
  
  const id = {id:dash._id}; //id of dashboard created above
  //send POST request with authenticated user's token in query and dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`,{ json :id});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);

});

//test that GET /dashboard returns correct response when an existing dashboard's id is given
test('GET /dashboard returns correct response when selected dashboard exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Create test dashboard 
 dash = await Dashboard({name: 'DashToGet',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',
  }).save();

  const id = dash._id; //id of dashboard created above
  //send GET request with authenticated user's token and dashboard's id in query
  const {body,statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
  //check response
  t.is(statusCode,200);
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
 dash = await Dashboard({name: 'DashToSave',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',
  }).save();

  const id = {id:dash._id}; //id of dashboard created above
  //send POST request with authenticated user's token in query and dashboard id in body
  const {body,statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`,{ json :id});
  //check response
  t.is(statusCode,200);
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
 dash = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',
  }).save();
  //Name of clone dashboard
  const new_name='DashSuccessClone';
  const DashBody = {dashboardId:dash._id, name:new_name}; //Body of new dashboard with new ,non existing name

 //send POST request with authenticated user's token in query and dashboard id and new_name in body
  const {body,statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test POST/clone-dashboard returns correct response when correct in is given but new Dashboard name already exists 
test('POST /clone-dashboard returns correct response when dashboard with same name already exists', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
 //Creat dashboard we want to clone
 dash1 = await Dashboard({name: 'DashToClone',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 15,owner: user._id,createdAt:'',
  }).save();

  //Create dashboard with sane name as the one ,we want the cloned dashboard to have
  dash2 = await Dashboard({name: 'DashNameExisting',layout:[],items:{},nextId: 6,password: '',shared: 0,views: 4,
                            owner: user._id,createdAt:'',
  }).save();

  const DashBody = {dashboardId:dash1._id,name:'DashNameExisting'}; //Dashboard body with same name as the one created above
  //send POST request with authenticated user's token in query and dashboard id and new_name in body
  const {body} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`,{json:DashBody});
  //check response
  t.is(body.status, 409);
  t.is(body.message, 'A dashboard with that name already exists.');
});

