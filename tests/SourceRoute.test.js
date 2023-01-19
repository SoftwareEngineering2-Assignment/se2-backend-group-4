/* eslint-disable import/no-unresolved */
require('dotenv').config();
const {mongoose} = require('../src/config');
const {http,test,got,listen,app,User} = require('../src/RouteImport');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const Source = require('../src/models/source');
const sinon = require('sinon');


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
  //delete test user, after test is over
  User.findByIdAndDelete(user._id);
  //delete test sources created , after test is over
  Source.deleteMany({}, 
    function(err){
      if(err) console.log(err);
      console.log("Successful deletion");
    });
});


//test that GET /sources returns correct statusCode=200 and body given an authenticated user
test('GET /sources returns correct response and status code for authenticated user ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'source1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  //send GET request with authenticated user's token in query
  const {body, statusCode} = await t.context.got(`sources/sources?token=${token}`);
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test that GET /sources returns correct response given an wrong user authentication
test('GET /sources returns correct response and status code for wrong user authentication ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'source1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const wrong_token ='63ac2df45d195c3c6c93c338'; //wrong authentication token
  //send GET request with wrong user's token in query
  const {body} = await t.context.got(`sources/sources?token=${wrong_token}`);
  //check response
  t.is(body.status,403);
  t.is(body.message,'Authorization Error: Failed to verify token.');
});


//test that POST /sources returns correct response given an authenticated user and a source with a name that already exists
test('POST /create-source returns correct response and status code when trying to create a new source with a name that already exists ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const newName = 'sourceName' ; //new source name same as existing one
  const sourceBody={name:newName} ;
  //send POST request with authenticated user's token in query , and new source name in body
  const {body} = await t.context.got.post(`sources/create-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(body.status,409);
  t.is(body.message,'A source with that name already exists.');
});

//test that POST /sources returns correct statusCode=200 and body given an authenticated user and a valid new source name
test('POST /create-source returns correct response and status code when successfully creates a new source ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const newName = 'DifferentsourceName' ; //new source name same as existing one
  const sourceBody={name:newName} ;
  //send POST request with authenticated user's token in query , and new source name in body
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test that POST /sources returns correct response when error is caught.Example wrong user authentiation token
test('POST /create-source returns correct response and status code when error is caught ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const wrong_token ='63ac2df45d195c3c6c93c338'; //wrong authentication token
  const newName = 'DifferentsourceName' ; //new source name same as existing one
  const sourceBody={name:newName} ;
  //send POST request with wrong user's token in query , and new source name in body
  const {body} = await t.context.got.post(`sources/create-source?token=${wrong_token}`,{json:sourceBody});
  //check response
  t.is(body.status,403);
  t.is(body.message,'Authorization Error: Failed to verify token.');
});

//test that POST /change-source returns correct response given a source id that doesnt belong to an existing source
test('POST /change-source returns correct response and status code when wrong source id is given ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const source_id ='63ac3989dd4ed355bcb8c991'; //non existing source id
  const sourceBody={id:source_id} ; //POST body
  //send POST request with authenticated user's token in query , and non existing source id in body
  const {body} = await t.context.got.post(`sources/change-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(body.status,409);
  t.is(body.message,'The selected source has not been found.');
});

//test that POST /change-source returns correct response when trying to change source name to an existing one
test('POST /change-source returns correct response and status code when correct source id and existing name are given  ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test sources for the authenticated user
  source1 = await Source({name:'sourceName1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  source2 = await Source({name:'sourceName2',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();
  //Try to change name of source1 to that of source2
  const source_id =source1._id; //id of source1 
  const new_name = source2.name; //new name of source1
  const sourceBody={id:source_id , name:new_name} ; //POST body
  //send POST request with authenticated user's token in query , and id and new name in body
  const {body} = await t.context.got.post(`sources/change-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(body.status,409);
  t.is(body.message,'A source with the same name has been found.');
});


//test that POST /change-source returns correct statusCode=200 and body when valid source id and new name are given
test('POST /change-source returns correct response and status code when correct source id and name are given  ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test sources for the authenticated user
  source = await Source({name:'sourceName1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

 
  //Try to change name of source1 to that of source2

  const source_id =source._id; //id of source1 
  const new_name = 'NewSourceName'; //id of source2
  const sourceBody={id:source_id , name:new_name} ; //POST body
  //send POST request with authenticated user's token in query , and id and name in body
  const {body, statusCode} = await t.context.got.post(`sources/change-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test POST /delete-source returns correct response, given a source id that doesnt belong to an existing source
test('POST /delete-source returns correct response and status code when wrong source id is given ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceToDel',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const source_id ='63ac3989dd4ed355bcb8c991'; //non existing source id
  const sourceBody={id:source_id} ; //POST body
  //send POST request with authenticated user's token in query , and non existing source id in body
  const {body} = await t.context.got.post(`sources/delete-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(body.status,409);
  t.is(body.message,'The selected source has not been found.');
});

//test POST /delete-source returns correct statusCode=200 and body given valid source id
test('POST /delete-source returns correct response and status code when source is deleted successfully ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceToDel',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const source_id =source._id; //source id to delete
  const sourceBody={id:source_id} ; //POST body
  //send POST request with authenticated user's token in query , and source id in body
  const {body, statusCode} = await t.context.got.post(`sources/delete-source?token=${token}`,{json:sourceBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test POST /source returns correct response, given a source name that doesnt belong to an existing source of the user
test('POST /source returns correct response and status code when wrong source name is given ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const source_name ='sourceWrongName'; //non existing source name
  const sourceBody={name:source_name , user:source.owner , user:user._id } ; //POST body
  //send POST request with authenticated user's token in query , and wrong source name in body
  const {body} = await t.context.got.post(`sources/source?token=${token}`,{json:sourceBody});
  //check response
  t.is(body.status,409);
  t.is(body.message,'The selected source has not been found.');
});


//test POST /source returns correct response,when given a valid name 
test('POST /source returns correct response and status code when existing source name is given ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const sourceBody={name:'sourceName' , owner:source.owner , user:user._id } ; //POST body
  //send POST request with authenticated user's token in query , and name ,owner_id user_id in body
  const {body, statusCode} = await t.context.got.post(`sources/source?token=${token}`,{json:sourceBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test that POST /check-sources returns correct response when check is successful
test('POST sources/check-sources returns correct response and status code', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test sources for the authenticated user

  source1 = await Source({name:'sourceName1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  source2 = await Source({name:'sourceName2',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  source3 = await Source({name:'sourceName3',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  

  }).save();

  const sourceBody={sources:[source1,source2,source3]} ; //POST body
  //send POST request with authenticated user's token in query , and id and name in body
  const {body, statusCode} = await t.context.got.post(`sources/check-sources?token=${token}`,{json:sourceBody});
  //check response
  t.is(statusCode,200);
  t.assert(body.success);
});

//test that GET /sources returns status code 500 when error is thrown
test('GET /sources handles error correctly', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'source1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();
  //Throw error
  const Stub = sinon.stub(Source, 'find').rejects(new Error('Something went wrong!'))
  //send GET request with authenticated user's token in query
  const {body} = await t.context.got(`sources/sources?token=${token}`);
  //check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
  
  //Restore sub
  Stub.restore();
});

//test that POST /sources returns status code 500 when error is thrown
test('POST /create-source handles error correctly ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();
  const newName = 'DifferentsourceName' ; //new source name same as existing one
  const sourceBody={name:newName} ;
  //Throw error
  const Stub = sinon.stub(Source, 'findOne').rejects(new Error('Something went wrong!'))
  //send POST request with authenticated user's token in query , and new source name in body
  const {body, statusCode} = await t.context.got.post(`sources/create-source?token=${token}`,{json:sourceBody});
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
  
  //Restore sub
  Stub.restore();
});

//test that POST /change-source returns status code 500 when error is thrown
test('POST /change-source handles error correctly ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test sources for the authenticated user
  source = await Source({name:'sourceName1',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();
  //Try to change name of source1 to that of source2
  const source_id =source._id; //id of source1 
  const new_name = 'NewSourceName'; //id of source2
  const sourceBody={id:source_id , name:new_name} ; //POST body
  //Throw error
  const Stub = sinon.stub(Source, 'findOne').rejects(new Error('Something went wrong!'))
  //send POST request with authenticated user's token in query , and id and name in body
  const {body} = await t.context.got.post(`sources/change-source?token=${token}`,{json:sourceBody});
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
  
  //Restore sub
  Stub.restore();
});

//test POST /delete-source returns status code 500 when error is thrown
test('POST /delete-source handles error correctly ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceToDel',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();

  const source_id =source._id; //source id to delete
  const sourceBody={id:source_id} ; //POST body
  //Throw error
  const Stub = sinon.stub(Source, 'findOneAndRemove').rejects(new Error('Something went wrong!'));
  //send POST request with authenticated user's token in query , and source id in body
  const {body} = await t.context.got.post(`sources/delete-source?token=${token}`,{json:sourceBody});
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
  
  //Restore sub
  Stub.restore();
});

//test POST /source returns status code 500 when error is thrown
test('POST /source handles error correctly ', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  //Create test source for the authenticated user
  source = await Source({name:'sourceName',type: '',url:'',login:'',passcode:'',vhost: '',owner: user._id,createdAt:'',
  }).save();
  const sourceBody={name:'sourceName' , owner:source.owner , user:user._id } ; //POST body
  //Throw error
  const Stub = sinon.stub(Source, 'findOne').throws(new Error('Something went wrong!'));
  //send POST request with authenticated user's token in query , and name ,owner_id user_id in body
  const {body} = await t.context.got.post(`sources/source?token=${token}`,{json:sourceBody});
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
    
  //Restore sub
  Stub.restore();
});

//test that POST /check-sources returns status code 500 when error is thrown
test('POST sources/check-sources handles error correctlyhandles error correctly', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id});
  const sourceBody={sources:[source1,source2,source3]} ; //POST body
  //Throw error
  const Stub = sinon.stub(Source, 'findOne').throws(new Error('Something went wrong!'));
  //send POST request with authenticated user's token in query , and id and name in body
  const {body} = await t.context.got.post(`sources/check-sources?token=${token}`,{json:sourceBody});
  //Check response
  t.is(body.status,500);
  t.is(body.message,'Something went wrong!');
    
  //Restore sub
  Stub.restore();
});