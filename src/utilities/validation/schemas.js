const {isNil} = require('ramda');

const yup = require('yup');
const {min} = require('./constants');

//Validator for email input
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

//Validator for username input
const username = yup
  .string()
  .trim();

//Validator for password input
const password = yup
  .string()
  .trim()
  .min(min);

/*
* Validator for forgot password form
* Checks for username input
*/
const request = yup.object().shape({username: username.required()});

/*
* Validator for sign in form
* Checks for username and password input
*/
const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});

/*
* Validator for sign up form
* Checks for username , password and email input
*/
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

/*
* Validator for forgot update form
* Checks for username and password input
*/
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

/*
* Validator for change password form
* Checks for password input
*/
const change = yup.object().shape({password: password.required()});

//export functions
module.exports = {
  authenticate, register, request, change, update
};
