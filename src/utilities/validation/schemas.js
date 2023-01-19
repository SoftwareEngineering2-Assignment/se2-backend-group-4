const {isNil} = require('ramda');

const yup = require('yup');
const {min} = require('./constants');

//define email
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

//define username
const username = yup
  .string()
  .trim();

//define password
const password = yup
  .string()
  .trim()
  .min(min);

//define request object
const request = yup.object().shape({username: username.required()});

//define authenticate object
const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});

//define register object
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

//define update object
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

//define change object
const change = yup.object().shape({password: password.required()});

//export functions
module.exports = {
  authenticate, register, request, change, update
};
