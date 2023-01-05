/* eslint-disable import/no-unresolved */
const test = require('ava').default;

//Example tests using ava made in class

test('Test to pass', (t) => {
  t.pass();
});


test('Test value', async (t) => {
  const a = 1;
  //pass test when given value a + 1 = 2
  t.is(a + 1, 2);
});

const sum = (a, b) => a + b;

test('Sum of 2 numbers', (t) => {
  t.plan(2); // check that 2 other assertion are included in the tests
  t.pass('this assertion passed'); //always true assertion
  t.is(sum(1, 2), 3);
});
