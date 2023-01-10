// Import the mongoose module
const mongoose = require('mongoose');

//Setup options to avoid deprecation warnings
const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  poolSize: 100,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

// Set up URI secret mongoose connection
const mongodbUri = process.env.MONGODB_URI;
  
module.exports = () => {
  // eslint-disable-next-line no-console
  mongoose.connect(mongodbUri, mongooseOptions).catch(console.error);
};
