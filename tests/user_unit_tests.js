/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const User = require('../src/models/user');
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');
const { UnsupportedProtocolError } = require('got/dist/source');


test('Create user without username/password/email',async t => {
    mongoose();
    const result =  await t.throwsAsync(User.create({}));
    t.is(result.message,'users validation failed: password: User password is required, username: Username is required, email: User email is required')
});

test('Create user with password less than minimum length',async t => {
    mongoose();
    const result2 =  await t.throwsAsync(User.create({username:'bot',password:'beep',email:'notabot@gmail.com'}));
    t.is(result2.message,'users validation failed: password: Path `password` (`beep`) is shorter than the minimum allowed length (5).')
    User.deleteOne({username:'bot'});
});

test('Create user',async t => {
    mongoose();
    const result3 = await User.create({username:'bot',password:'beepbop',email:'notabot@gmail.com'}); 
    t.is(result3.username,'bot');
    User.deleteOne({username:'bot'});
});

test('Compare password',async t => {
    mongoose();
    const result4 = await User.create({username:'bot',password:'beepbop',email:'notabot@gmail.com'}); 
    const cmp1 = result4.comparePassword('beep');
    const cmp2 = result4.comparePassword('beepbop');
    t.is((cmp1,cmp2),(false,true));
    User.deleteOne({username:'bot'});
});
