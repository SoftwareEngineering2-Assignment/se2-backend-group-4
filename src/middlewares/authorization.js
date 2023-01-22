const jwt = require('jsonwebtoken');
const {path, ifElse, isNil, startsWith, slice, identity, pipe} = require('ramda');

const secret = process.env.SERVER_SECRET;

module.exports = (req, res, next) => {
  /**
     * @name authorization
     * @description Middleware that checks a token's presence and validity in a request
    */
  pipe(
    (r) =>
      //take token from query or headers
      path(['query', 'token'], r)
          || path(['headers', 'x-access-token'], r)
          || path(['headers', 'authorization'], r),
    ifElse(
      //If token not Null or undefined and starts with a beared
      //remove characters form index 0 to 7 ab returb the rest 
      (t) => !isNil(t) && startsWith('Bearer ', t),
      (t) => slice(7, t.length, t).trimLeft(),
      identity
    ),
    //If token null or undefined 
    //return Authentication Error message and statusCode 403
    ifElse(
      isNil,
      () =>
        next({
          message: 'Authorization Error: token missing.',
          status: 403
        }),
      //check the token
      (token) =>
        jwt.verify(token, secret, (e, d) =>
          ifElse(
            (err) => !isNil(err),
            (er) => {
              //if token has expired
              //return error message and statusCode 401
              if (er.name === 'TokenExpiredError') {
                next({
                  message: 'TokenExpiredError',
                  status: 401,
                });
              }
              //If token is wrong
              //return error message and statusCode 403
              next({
                message: 'Authorization Error: Failed to verify token.',
                status: 403
              });
            },
            //if token is correct decode it
            (_, decoded) => {
              req.decoded = decoded;
              return next();
            }
          )(e, d))
    )
  )(req);
};
