/* eslint-disable import/no-unresolved */
require('dotenv').config();

const test = require('ava').default;
const Source = require('../src/models/source');
const {mongoose} = require('../src/config');

//test that source can't be created without name
test('Create Source without a name',async t => {
    mongoose();
    const source =  await t.throwsAsync(Source.create({}));
    t.is(source.message,'sources validation failed: name: Source name is required')
    Source.deleteOne({});
});

//test that source can't be created without name
test('Create Source with a name',async t => {
    mongoose();
    const source =  await new Source({name:'SourceName'});
    t.is(source.name,'SourceName');
    Source.deleteOne({});
});