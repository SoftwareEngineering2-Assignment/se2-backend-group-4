const password = require('./password');
const send = require('./send');

//export module with mail and send function
module.exports = {
  mail: password,
  send
};
