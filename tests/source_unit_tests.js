/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const Source = require('../src/models/source');
const db_connect = require('../src/config/mongoose.js');
const {mongoose} = require('../src/config');

async function createSource(name='',type='' , url='', login='',passcode='' , vhost='' ,owner,createdAt  ){
    try {
        const source = await new Source({name,type, url, login,passcode , vhost,owner,createdAt }).save();
        return source;
    }
    catch(e){
        return Promise.reject(reason=e);
    }
}

//test that source can't be created without name
test('Create Source without a name',async t => {
    mongoose();
    const source =  await t.throwsAsync(createSource());
    t.is(source.message,'sources validation failed: name: Source name is required')
});

//test that source can't be created without name
test('Create Source with a name',async t => {
    mongoose();
    const source =  await new Source({name:'SourceName'});
    t.is(source.name,'SourceName');
});