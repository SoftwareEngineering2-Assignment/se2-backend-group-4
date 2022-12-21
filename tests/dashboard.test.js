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

test('Create dashboard without name',async t => {
    mongoose();
    const result =  await t.throwsAsync(createDashboard());
    t.is(result.message,'dashboards validation failed: name: Dashboard name is required')
});

test('Create dashboard with name nas password',async t => {
    mongoose();
    const result =  await new Dashboard({name:'DashName',password:'password1'}).save();
    t.is(result.name,'DashName');
    t.is(result.npassword),('password1')
});

test('Compare dashboard asswords',async t => {
    mongoose();
    const result = await new Dashboard({name:'DashName',password:'password1'}).save(); 
    const cmp1 = result.comparePassword('password1');
    const cmp2 = result.comparePassword('password2');
    t.is((cmp1,cmp2),(true,false));
});




