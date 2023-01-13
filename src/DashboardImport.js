//imports for DashboardRoute.test.js and DashboardPasswordRoute.test.js
require('dotenv').config();
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('./index');
const User = require('./models/user');
const Dashboard = require('./models/dashboard');

//function to delete test users and dashboards
function DeleteUsersAndDashboards() {
  //delete test user, after test is over
  User.findByIdAndDelete(user._id);
  //delete test dashboards created , after test is over
  Dashboard.deleteMany({}, 
    function(err){
      if(err) console.log(err);
      console.log("Successful deletion");
    });
};

module.exports = {http,test,got,listen,app,User,Dashboard,DeleteUsersAndDashboards};