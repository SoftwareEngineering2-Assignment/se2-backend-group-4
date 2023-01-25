/* eslint-disable import/no-unresolved */
require('dotenv').config();
const {mongoose} = require('../src/config');
const {http,test,got,listen,app,User} = require('../src/RouteImport');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const sinon = require('sinon');
let user;
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
      //delete test sources created , after test is over
    User.deleteMany({}, 
      function(err){
          if(err) console.log(err);
              console.log("Successful deletion");
      });
  });
  
//test creating and then authenticating a user
test('POST /create new user then POST/authenticate creates and then authenticates new user', async (t) => {
    mongoose();
    //Create existing test user
    const NewUserEmail =   'notabot12345@gmail.com' //new user email
    const NewUserName = 'PeterGriffin1' ; //new user username
    const NewUserPassword = '12345'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    var {body,statusCode} = await t.context.got.post(`users/create?`,{json:UserBody});
    t.is(statusCode,200);
    const authenticateUser= {username:UserBody.username,password:UserBody.password}
    var {body,statusCode} = await t.context.got.post(`users/authenticate?`,{json:authenticateUser});
    //check response
    t.is(statusCode,200);
    t.is(body.user.username,UserBody.username);
    t.is(body.user.email,UserBody.email);
  });
