/* eslint-disable max-len */
const express = require('express');
const got = require('got');
const router = express.Router();
const User = require('../models/user');
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

//Router function for getting the number of users , dashbooards , dashboard views and sources .
router.get('/statistics',
  async (req, res, next) => {
    try {
      //Count the number of users ,ans dashboards
      const users = await User.countDocuments();
      const dashboards = await Dashboard.countDocuments();
      const views = await Dashboard.aggregate([
        {
          $group: {
            _id: null, 
            views: {$sum: '$views'}
          }
        }
      ]);
      //counts sources
      const sources = await Source.countDocuments();
      //count total views
      let totalViews = 0;
      if (views[0] && views[0].views) {
        totalViews = views[0].views;
      }
      //return body
      return res.json({
        success: true,
        users,
        dashboards,
        views: totalViews,
        sources
      });
    } 
    //error hanndling
    catch (err) {
      return next(err.body);
    }
  });

//Router function to get url
router.get('/test-url',
  async (req, res) => {
    try {
      const {url} = req.query;
      const {statusCode} = await got(url);
      //return body if successful
      return res.json({
        status: statusCode,
        active: (statusCode === 200),
      });
    } 
    //error handling
    catch (err) {
      return res.json({
        status: 500,
        active: false,
      });
    }
  });

//Router function for implementing get request for /test-url-request
//Gets url and request type as inputs
router.get('/test-url-request',
  async (req, res) => {
    try {
      const {url, type, headers, body: requestBody, params} = req.query;

      let statusCode;
      let body;
      //assign value to statusCode and response body depending on the type
      switch (type) {
        case 'GET':
          ({statusCode, body} = await got(url, {
            headers: headers ? JSON.parse(headers) : {},
            searchParams: params ? JSON.parse(params) : {}
          }));
          break;
        case 'POST':
          ({statusCode, body} = await got.post(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        case 'PUT':
          ({statusCode, body} = await got.put(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        default:
          statusCode = 500;
          body = 'Something went wrong';
      }
      //return statusCode and response
      return res.json({
        status: statusCode,
        response: body,
      });
    } 
    //error handling
    catch (err) {
      return res.json({
        status: 500,
        response: err.toString(),
      });
    }
  });

module.exports = router;
