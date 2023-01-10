const express = require('express');
const {validation, authorization} = require('../middlewares');
const {helpers: {jwtSign}} = require('../utilities/authentication');
const {mailer: {mail, send}} = require('../utilities');
const router = express.Router();
const User = require('../models/user');
const Reset = require('../models/reset');

//Router function for creating new users
router.post('/create',
  (req, res, next) => validation(req, res, next, 'register'),
  async (req, res, next) => {
    const {username, password, email} = req.body;
    try {
      //find one user with given username or email
      const user = await User.findOne({$or: [{username}, {email}]});
      if (user) {
        //return body if user with given e-mail ot username already exists
        return res.json({
          status: 409,
          message: 'Registration Error: A user with that e-mail or username already exists.'
        });
      }
      const newUser = await new User({
        username,
        password,
        email
      }).save();
      //return body for success
      return res.json({
        success: true, 
        id: newUser._id
      });
    } 
    //error handling
    catch (error) {
      return next(error);
    }
  });

//Router function for authenticanting user
router.post('/authenticate',
  (req, res, next) => validation(req, res, next, 'authenticate'),
  async (req, res, next) => {
    const {username, password} = req.body;
    try {
      //find one user with given username
      const user = await User.findOne({username}).select('+password');
      if (!user) {
        //return body if user with given username was not found
        return res.json({
          status: 401,
          message: 'Authentication Error: User not found.'
        });
      }
      if (!user.comparePassword(password, user.password)) {
        //return body if given password does not match the username
        return res.json({
          status: 401,
          message: 'Authentication Error: Password does not match!'
        });
      }
      //successful authentication return body
      return res.json({
        user: {
          username, 
          id: user._id, 
          email: user.email
        },
        token: jwtSign({username, id: user._id, email: user.email})
      });
    } 
    //error handling
    catch (error) {
      return next(error);
    }
  });

//Router function for resetting password
router.post('/resetpassword',
  (req, res, next) => validation(req, res, next, 'request'),
  async (req, res, next) => {
    const {username} = req.body;
    try {
      //find one user with given username
      const user = await User.findOne({username});
      if (!user) {
        //return body if user with given username was not found
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      const token = jwtSign({username});
      await Reset.findOneAndRemove({username});
      await new Reset({
        username,
        token,
      }).save();
      //send user e-mail to reset passwrod
      const email = mail(token);
      send(user.email, 'Forgot Password', email);
      //return body for success
      return res.json({
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
    } 
    //error handling
    catch (error) {
      return next(error);
    }
  });

//Router function for changing password
router.post('/changepassword',
  (req, res, next) => validation(req, res, next, 'change'),
  authorization,
  async (req, res, next) => {
    const {password} = req.body;
    //decode username given in jwt Token
    const {username} = req.decoded;
    try {
      //find one user with username given in token after it's decoded
      const user = await User.findOne({username});
      if (!user) {
        //return body if user with given username was not found 
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      const reset = await Reset.findOneAndRemove({username});
      if (!reset) {
        //return body if jwt Token has expired
        return res.json({
          status: 410,
          message: ' Resource Error: Reset token has expired.'
        });
      }
      user.password = password;
      await user.save();
      //return body for successful password change
      return res.json({
        ok: true,
        message: 'Password was changed.'
      });
    } 
    //error handling
    catch (error) {
      return next(error);
    }
  });

module.exports = router;
