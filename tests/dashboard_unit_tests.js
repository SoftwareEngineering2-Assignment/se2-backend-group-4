/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const Dashboard = require('../src/models/dashboard');
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');



async function createDashboard(name='',layout , items, nextId ,password='' , shared ,views  ){
    try {
        const dashboard = await new Dashboard({name,layout , items, nextId ,password , shared ,views  }).save();
        return dashboard;
    }
    catch(e){
        return Promise.reject(reason=e);
    }
}

//test that a dashboard cant be created without a name
test('Create dashboard without name',async t => {
    mongoose();
    const dashboard =  await t.throwsAsync(createDashboard());
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




