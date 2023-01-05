/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const User = require('../src/models/user');
const {mongoose} = require('../src/config');

//test that user cant be crated without username ,password and email
test('Create user without username/password/email',async t => {
    mongoose();
    const result =  await t.throwsAsync(User.create({}));
    t.is(result.message,'users validation failed: password: User password is required, username: Username is required, email: User email is required')
});

//test that user can't be created with password length shorter than 5 characters
test('Create user with password less than minimum length',async t => {
    mongoose();
    const result2 =  await t.throwsAsync(User.create({username:'bot',password:'beep',email:'notabot@gmail.com'}));
    t.is(result2.message,'users validation failed: password: Path `password` (`beep`) is shorter than the minimum allowed length (5).')
});

//test that a user can be created successfully with valid inputs
test('Create user',async t => {
    mongoose();
    const result3 = await new User({username:'bot',password:'beepbop',email:'notabot@gmail.com'}).save(); 
    t.is(result3.username,'bot');
});

//test comparePassword function
test('Compare password',async t => {
    mongoose();
    const result4 = await new User({username:'bot',password:'beepbop',email:'notabot@gmail.com'}).save(); 
    const cmp1 = result4.comparePassword('beep');
    const cmp2 = result4.comparePassword('beepbop');
    t.is((cmp1,cmp2),(false,true));
});
