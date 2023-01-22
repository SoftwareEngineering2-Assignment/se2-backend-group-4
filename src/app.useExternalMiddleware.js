//File for external middlewares
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const appExternal= express();
appExternal.use(cors());
appExternal.use(helmet());
// App configuration
appExternal.use(compression());

if (process.env.NODE_ENV !== 'test') {
    appExternal.use(logger('dev'));
}
appExternal.use(bodyParser.json({limit: '50mb'}));
appExternal.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

module.exports = appExternal;