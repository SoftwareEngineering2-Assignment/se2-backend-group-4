//Functions related with dashboards Password
/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Dashboard = require('../models/dashboard');

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
    return next(err);
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
    return next(err);
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
    return next(err);
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
  return next(err);
}
}); 

module.exports = router;