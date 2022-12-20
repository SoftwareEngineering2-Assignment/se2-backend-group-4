/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const User = require('../src/models/user');
const db_connect = require('../src/config/mongoose.js');

async function userWithoutUsername(){
    try {
        await new User().save();
        return 0;
    }
    catch(e){
        //console.log('%s',e);
        return Promise.reject(reason=e);
    }
}
test('Create user without username',async t => {
    var conn = await db_connect;
    const result =  await t.throwsAsync(userWithoutUsername());
    t.is(result.message,'users validation failed: password: User password is required, username: Username is required, email: User email is required')
    
  });

