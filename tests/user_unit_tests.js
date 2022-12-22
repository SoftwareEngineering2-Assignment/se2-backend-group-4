/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const User = require('../src/models/user');
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');

async function createUser(username='',password='',email=''){
    try {
        const usr = await new User({username,password,email}).save();
        return usr;
    }
    catch(e){
        return Promise.reject(reason=e);
    }
}
test('Create user without username/password/email',async t => {
    mongoose();
    const result =  await t.throwsAsync(createUser());
    t.is(result.message,'users validation failed: username: Username is required, password: User password is required, email: User email is required')
});

test('Create user with password less than minimum length',async t => {
    mongoose();
    const result2 =  await t.throwsAsync(createUser('bot','beep','notabot@gmail.com'));
    t.is(result2.message,'users validation failed: password: Path `password` (`beep`) is shorter than the minimum allowed length (5).')
});

test('Create user',async t => {
    mongoose();
    const result3 = await new User({username:'bot',password:'beepbop',email:'notabot@gmail.com'}).save(); 
    t.is(result3.username,'bot');
});

test('Compare password',async t => {
    mongoose();
    const result4 = await new User({username:'bot',password:'beepbop',email:'notabot@gmail.com'}).save(); 
    const cmp1 = result4.comparePassword('beep');
    const cmp2 = result4.comparePassword('beepbop');
    t.is((cmp1,cmp2),(false,true));
});
