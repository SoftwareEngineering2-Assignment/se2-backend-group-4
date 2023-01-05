/* eslint-disable import/no-unresolved */
require('dotenv').config();
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');
const { ObjectId } = require('mongodb');
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
const User = require('../src/models/user');
const { getMaxListeners } = require('node:process');
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
  //delete test user, after test is over
  User.findByIdAndDelete(user._id);
    //delete test sources created , after test is over
  User.deleteMany({}, 
    function(err){
        if(err) console.log(err);
            console.log("Successful deletion");
    });
});

//test that POST /user/create returns correct response when a user with same e-mail already exists
test('POST /create returns correct response and status code when trying to create a new user with an email that is already used ', async (t) => {
    mongoose();
    //Create existing test user
    user = await User({
        email: 'User1@gmail.com',
        username: 'User1',
        password: '13434UserExists',
    }).save();
  
    const NewUserEmail =   'User1@gmail.com' //new user email
    const NewUserName = 'User2' ; //new user username
    const NewUserPassword = 'Pass1234'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    const {body} = await t.context.got.post(`users/create?`,{json:UserBody});
    //check response
    t.is(body.status,409);
    t.is(body.message,'Registration Error: A user with that e-mail or username already exists.');
  });


//test that POST /user/create returns correct response when a user with same username already exists
test('POST /create returns correct response and status code when trying to create a new user with a username that is already used ', async (t) => {
    mongoose();
    //Create existing test user
    user = await User({
        email: 'ExistingUser@gmail.com',
        username: 'ExistingUsername',
        password: 'UserExists12345',
    }).save();
  
    const NewUserEmail =   'NewUser@gmail.com' //new user email
    const NewUserName = 'ExistingUsername' ; //new user username
    const NewUserPassword = 'Pass1234'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    const {body} = await t.context.got.post(`users/create?`,{json:UserBody});
    //check response
    t.is(body.status,409);
    t.is(body.message,'Registration Error: A user with that e-mail or username already exists.');
  });

  //test that POST /user/create returns correct response when a new user is created successfully
test('POST /create returns correct response and status code when valid email and username are given ', async (t) => {
    mongoose();

    const NewUserEmail =   'NewEmail3804@gmail.com' //new user email
    const NewUserName = 'NewUser9403' ; //new user username
    const NewUserPassword = '584960689'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    const {body,statusCode} = await t.context.got.post(`users/create?`,{json:UserBody});
    //check response
    t.is(statusCode,200);
    t.assert(body.success);
  });

//test that POST /user/create returns statuscode=400 and error message when given e-mail is not valid
test('POST /create returns correct response and status code when email-address is not valid ', async (t) => {
    mongoose();

    const NewUserEmail =   'NewEmail3804.com' //new user email
    const NewUserName = 'NewUser20939' ; //new user username
    const NewUserPassword = '53580gn'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    const {body} = await t.context.got.post(`users/create?`,{json:UserBody});
    //check response
    t.is(body.status,400);
    t.is(body.message,'Validation Error: email must be a valid email');
  });

//test that POST /user/create returns statuscode=400 and error message when given password is shorter than 5 characters
test('POST /create returns correct response and status code when password is too short ', async (t) => {
    mongoose();

    const NewUserEmail =   'NewEmail3456@yahoo.com' //new user email
    const NewUserName = 'NewUser346' ; //new user username
    const NewUserPassword = '12'; //new user password
    const UserBody={email:NewUserEmail , username:NewUserName , password:NewUserPassword} ;
    //send POST request with New user email ,username and password in body
    const {body} = await t.context.got.post(`users/create?`,{json:UserBody});
    //check response
    t.is(body.status,400);
    t.is(body.message,'Validation Error: password must be at least 5 characters');
  });

  //test that POST /user/authenticate returns statusCode=401 and error message when user gives wrong username
test('POST /authenticate returns correct response when username is wrong', async (t) => {
    mongoose();
    //Create existing test user
    user = await User({
        email: 'User1@gmail.com',
        username: 'User1',
        password: 'CorrectPassword',
    }).save();
  
    const WrongUserName = 'WrongUsername' ; //wrong username
    const UserBody={username:WrongUserName , password:'CorrectPassword'} ;
    //send POST request with username and password in body
    const {body} = await t.context.got.post(`users/authenticate?`,{json:UserBody});
    //check response

    t.is(body.status,401);
    t.is(body.message,'Authentication Error: User not found.');
  });

//test that POST /user/authenticate returns statusCode=401 and error message when password doenst match username
test('POST /authenticate returns correct response when users snters wrong password', async (t) => {
    mongoose();
    //Create existing test user
    user = await User({
        email: 'User1@gmail.com',
        username: 'User1',
        password: 'CorrectPassword',
    }).save();
  
    const WrongPass = 'WrongPassword' ; //wrong username
    const UserBody={username:user.username, password:WrongPass} ;
    //send POST request with username and password in body
    const {body} = await t.context.got.post(`users/authenticate?`,{json:UserBody});
    //check response
    t.is(body.status,401);
    t.is(body.message,'Authentication Error: Password does not match!');
  });

//test that POST /user/authenticate returns correct response and statusCode=200 when user is authenticated correctly
test('POST /authenticate returns correct response username and password match', async (t) => {
    mongoose();
    //Create existing test user
    user = await User({
        email: 'User@gmail.com',
        username: 'User',
        password: 'CorrectPassword',
    }).save();
  
    const UserBody={username:user.username, password:'CorrectPassword'} ;
    //send POST request with username and password in body
    const {body,statusCode} = await t.context.got.post(`users/authenticate?`,{json:UserBody});
    //check response
    t.is(statusCode,200);
    t.is(body.user.username,user.username);
    t.is(body.user.email,user.email);
  });

 //test that POST /user/resetpassword returns correct response when a user with the given username was not found
test('POST /resetpassword returns correct response and status code when trying to reset password with wrong username', async (t) => {
  mongoose();
  const wrongUsename = 'WrongUsername'
  const UserBody={username : wrongUsename} ;
  //send POST request with username  in body
  const {body} = await t.context.got.post(`users/resetpassword?`,{json:UserBody});
  //check response
  t.is(body.status,404);
  t.is(body.message,'Resource Error: User not found.');
});

 //test that POST /user/resetpassword returns correct response and statuscode=200 when email to change password is sent seccessfully
 test('POST /resetpassword returns correct response and status code given a valis username', async (t) => {
  mongoose();
  //Create test user
  user = await User({
      email: 'User1@gmail.com',
      username: 'User1',
      password: '13434UserExists',
  }).save();

  const UserBody={username : user.username} ;
  //send POST request with username  in body
  const {body,statusCode} = await t.context.got.post(`users/resetpassword?`,{json:UserBody});
  //check response
  t.assert(body.ok);
  t.is(statusCode,200);
  t.is(body.message,'Forgot password e-mail sent.');
});

//test that POST /user/changepassword returns correct response when a user with the given username does not match authentication token
test('POST /changepassword returns correct response and status code when trying to reset password with wrong username', async (t) => {
  mongoose();
  const token = jwtSign({id: user._id}); //authenticated user

  const UserBody={password : 'NewPass123'} ; //post body with wrond username and new password
  //send POST request with authentication token in query and username and new password in body
  const {body} = await t.context.got.post(`users/changepassword?token=${token}`,{json:UserBody});
  //check response
  console.log(body)
  t.is(body.status,404);
  t.is(body.message,'Resource Error: User not found.');
});

 //test that POST /user/changepassword returns correct response when username matches authentication token
 test('POST /changepassword returns correct response and status code when password changes successfull', async (t) => {
  mongoose();
  //Create existing test user
  const usertest = await new User({
    username: 'usertest',
    password: 'passwordtest',
   email: 'emailtest@gmail.com',
  }).save();


  const token = jwtSign({id: usertest.id}); //authenticated user
  const usrname = usertest.name ;
  const UserBody={username :usertest.name ,  password : 'NewPass123'} ; //post body with wrong username and new password
  console.log(UserBody);
  console.log(user.username,usertest._id,user._id,user.id,token)
  const names = usertest.name ; 
  const userer = await User.findOne({'63b472979f8d5c29e03b84f0'});
  console.log(userer)
  const userer2 = await User.find({username: 'usertest'});
  console.log(userer2)
  //send POST request with authentication token in query and username and new password in body
  const {body} = await t.context.got.post(`users/changepassword?token=${token}`,{json:UserBody});
  //check response
  console.log(body)
  t.is(body.status,404);
  t.is(body.message,'Resource Error: User not found.');
});

