/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

//Router function for viewing Dashboards
router.get('/dashboards',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.decoded;
      //find all Dashboards with owner id same as token id
      const foundDashboards = await Dashboard.find({owner: mongoose.Types.ObjectId(id)});
      const dashboards = [];
      //append id, name and views for each found Dashboard
      foundDashboards.forEach((s) => {
        dashboards.push({id: s._id,name: s.name,views: s.views});
      });
      //return body for success
      return res.json({
        success: true,
        dashboards
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  });

//Router function for creating Dashboard
router.post('/create-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {name} = req.body;
      const {id} = req.decoded;
      //find one Dashboard with owner id same as token id , and name same as the one given in body
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(id), name});
      //return body if user already has another Dashboard with the given name
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }
      //create new Dashboard
      await new Dashboard({name,layout: [],items: {},nextId: 1,owner: mongoose.Types.ObjectId(id)}).save();
      //return body for success
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for deleting Dashboard
router.post('/delete-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;
      //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in body
      const foundDashboard = await Dashboard.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      //return body if Dashboard matching the given id was not found
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      //return body for success
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for viewing specific Dashboard
router.get('/dashboard',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.query;
      //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in query
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      //return body if Dashboard matching the given id was not found
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }

      const dashboard = {};
      dashboard.id = foundDashboard._id;
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      dashboard.nextId = foundDashboard.nextId;
      //find user's sources and append their their name
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(req.decoded.id)});
      const sources = [];
      foundSources.forEach((s) => {
        sources.push(s.name);
      });
    
      //return body for success
      return res.json({
        success: true,
        dashboard,
        sources
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  });

//Router function for saving Dashboard
router.post('/save-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id, layout, items, nextId} = req.body;
      //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in req.body and update it
      const result = await Dashboard.findOneAndUpdate({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)}, {
        $set: {layout,items,nextId}
      }, {new: true});
      //return body if Dashboard matching the given id was not found
      if (result === null) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      //return body for success
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for Dashboard cloning
router.post('/clone-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {dashboardId, name} = req.body;
      //find one Dashboard with owner id same as token id, and Dashboard name same as the name given in req.body
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(req.decoded.id), name});
      //return body if Dashboard matching the given name was not found
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }
      //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in req.body 
      const oldDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(req.decoded.id)});
      //new clone Dashboard with name given in req.body
      await new Dashboard({name,layout: oldDashboard.layout,items: oldDashboard.items,nextId: oldDashboard.nextId,owner: mongoose.Types.ObjectId(req.decoded.id)
      }).save();
      //return body for success
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for checking if Dashboard password is needed to view it
router.post('/check-password-needed', 
  async (req, res, next) => {
    try {
      const {user, dashboardId} = req.body;
      const userId = user.id;
      //find one Dashboard with  Dashboard id same as the id given in req.body
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      //return body if no Dashboard with given id was found
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }

      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      
      if (userId && foundDashboard.owner.equals(userId)) {
        foundDashboard.views += 1;
        await foundDashboard.save();
        //return body if authenticated user is the Dashboard's owner
        return res.json({
          success: true,
          owner: 'self',
          shared: foundDashboard.shared,
          hasPassword: foundDashboard.password !== null,
          dashboard
        });
      } 
      if (!(foundDashboard.shared)) {
        //return body if authenticated user is NOT the Dashboard's owner and Dahboard is not shared
        return res.json({
          success: true,
          owner: '',
          shared: false
        });
      }
      if (foundDashboard.password === null) {
        foundDashboard.views += 1;
        await foundDashboard.save();
        //return body if authenticated user is NOT the Dashboard's owner and Dahboard is shared and has no password
        return res.json({
          success: true,
          owner: foundDashboard.owner,
          shared: true,
          passwordNeeded: false,
          dashboard
        });
      }
      //return body if authenticated user is NOT the Dashboard's owner and Dahboard is shared and has password
      return res.json({
        success: true,
        owner: '',
        shared: true,
        passwordNeeded: true
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for checking Dashboard passwords
router.post('/check-password', 
  async (req, res, next) => {
    try {
      const {dashboardId, password} = req.body;
      //find one Dashboard with Dashboard id same as the id given in req.body
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      //return body if no Dashboard with given id was found
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      if (!foundDashboard.comparePassword(password, foundDashboard.password)) {
        //return body when given passowrd was wrong
        return res.json({
          success: true,
          correctPassword: false
        });
      }

      foundDashboard.views += 1;
      await foundDashboard.save();

      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;

      //return body when given passowrd was wrong
      return res.json({
        success: true,
        correctPassword: true,
        owner: foundDashboard.owner,
        dashboard
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for Dashboard sharing
router.post('/share-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {dashboardId} = req.body;
      const {id} = req.decoded;
      //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in req.body
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      //return body if no Dashboard with given id was found
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      foundDashboard.shared = !(foundDashboard.shared);
      
      await foundDashboard.save();
      //return body for successful clone
      return res.json({
        success: true,
        shared: foundDashboard.shared
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function for Dashboard password change
router.post('/change-password', 
authorization,
async (req, res, next) => {
  try {
    const {dashboardId, password} = req.body;
    const {id} = req.decoded;
    //find one Dashboard with owner id same as token id, and Dashboard id same as the id given in req.body
    const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
    //return body if no Dashboard with given id was found
    if (!foundDashboard) {
      return res.json({
        status: 409,
        message: 'The specified dashboard has not been found.'
      });
    }
    foundDashboard.password = password;
    
    await foundDashboard.save();
    //return body for successful password change
    return res.json({success: true});
  } 
  //error handling
  catch (err) {
    return next(err.body);
  }
}); 

module.exports = router;