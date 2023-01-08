/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');
const router = express.Router();
const Source = require('../models/source');

//Router function to view sources
router.get('/sources',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.decoded;
      //find all sources of a user given his id
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(id)});
      const sources = [];
      //append each found source
      foundSources.forEach((s) => {
        sources.push({id: s._id,name: s.name,type: s.type,url: s.url,login: s.login,passcode: s.passcode,vhost: s.vhost,active: false
        });
      });
      //return body for success
      return res.json({
        success: true,
        sources
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  });

//Route function for creating a new source
router.post('/create-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {name, type, url, login, passcode, vhost} = req.body;
      const {id} = req.decoded;
      //check if user already has a source with given name
      const foundSource = await Source.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundSource) {
        //return body if user already has a source with given name
        return res.json({
          status: 409,
          message: 'A source with that name already exists.'
        });
      }
      //creating new source
      await new Source({name,type,url,login,passcode,vhost,owner: mongoose.Types.ObjectId(id)
      }).save();
      //return body fo successful source creation
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Route function for updating a source
router.post('/change-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id, name, type, url, login, passcode, vhost} = req.body;
      //find the source if the users given it's id
      const foundSource = await Source.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        //return body if the user does not own a source with given id
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }

      //check if the user owns another source with given name
      const sameNameSources = await Source.findOne({_id: {$ne: mongoose.Types.ObjectId(id)}, owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (sameNameSources) {
        //return body if the user owns another source with given name
        return res.json({
          status: 409,
          message: 'A source with the same name has been found.'
        });
      }
      //update source
      foundSource.name = name;
      foundSource.type = type;
      foundSource.url = url;
      foundSource.login = login;
      foundSource.passcode = passcode;
      foundSource.vhost = vhost;
      await foundSource.save();
      //return body for successful update
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

  //Router function for deleting a source
router.post('/delete-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;
      ////find the source if the users given it's id
      const foundSource = await Source.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        //return body if the user does not own a source with given id
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      //return body for successful delete
      return res.json({success: true});
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  }); 

//Router function that searches for a source given it's name and owner and returns an object with it's data
router.post('/source',
  async (req, res, next) => {
    try {
      const {name, owner, user} = req.body;
      const userId = (owner === 'self') ? user.id : owner;
      //check for a source with given name and owner=userId
      const foundSource = await Source.findOne({name, owner: mongoose.Types.ObjectId(userId)});
      if (!foundSource) {
        //return body if no source was found with given name and owner
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      //create object with found soruce's data
      const source = {};
      source.type = foundSource.type;
      source.url = foundSource.url;
      source.login = foundSource.login;
      source.passcode = foundSource.passcode;
      source.vhost = foundSource.vhost;
      //return body for success
      return res.json({
        success: true,
        source
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  });

//Router fuction that checks if user owns given sources and creates them if he does not
router.post('/check-sources',
  authorization,
  async (req, res, next) => {
    try {
      const {sources} = req.body;
      const {id} = req.decoded;
      const newSources = [];

      for (let i = 0; i < sources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        //check if user owns given sources
        const result = await Source.findOne({name: sources[i], owner: mongoose.Types.ObjectId(id)});
        if (!result) {
          newSources.push(sources[i]);
        }
      }
      //create sources user does not own
      for (let i = 0; i < newSources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Source({name: newSources[i],type: 'stomp',url: '',login: '',passcode: '',vhost: '',owner: mongoose.Types.ObjectId(id)
        }).save();
      } 
      //return the sources created
      return res.json({
        success: true,
        newSources
      });
    } 
    //error handling
    catch (err) {
      return next(err.body);
    }
  });

module.exports = router;
