/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const Dashboard = require('../src/models/dashboard');
const {mongoose} = require('../src/config');

//test that a dashboard cant be created without a name
test('Create dashboard without name',async t => {
    mongoose();
    const dashboard =  await t.throwsAsync(Dashboard.create({}));
    t.is(dashboard.message,'dashboards validation failed: name: Dashboard name is required')
    Dashboard.deleteOne({});
});

//test that a dashboard with name and password can be created
test('Create dashboard with name and password',async t => {
    mongoose();
    const dashboard =  await new Dashboard({name:'DashName',password:'password1'}).save();
    t.is(dashboard.name,'DashName');
    t.is(dashboard.npassword),('password1')
    Dashboard.deleteOne({});
});

//test comparePassword method
test('Compare dashboard passwords',async t => {
    mongoose();
    const dashboard = await new Dashboard({name:'DashName',password:'password1'}).save(); 
    const cmp1 = dashboard.comparePassword('password1');
    const cmp2 = dashboard.comparePassword('password2');
    t.is((cmp1,cmp2),(true,false));
    Dashboard.deleteOne({});
});




