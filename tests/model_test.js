/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const User = require('../src/models/user');
const db_connect = require('../src/config/mongoose.js');

async function createUser(username='',password='',email=''){
    try {
        await new User({username,password,email}).save();
        return 0;
    }
    catch(e){
        return Promise.reject(reason=e);
    }
}
test('Create user without username/password/email',async t => {
    var conn = await db_connect;
    const result =  await t.throwsAsync(createUser());
    t.is(result.message,'users validation failed: username: Username is required, password: User password is required, email: User email is required')
});

test('Create user with password less than minimum length',async t => {
    var conn = await db_connect;
    const result2 =  await t.throwsAsync(createUser('bot','beep','notabot@gmail.com'));
    t.is(result2.message,'users validation failed: password: Path `password` (`beep`) is shorter than the minimum allowed length (5).')
});
