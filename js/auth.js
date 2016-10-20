let session = require('express-session');

/**
 * Middleware to check if the user is logged in.
 */
function isLoggedIn(req, res, next) {
  console.log(req.session);
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/');
  }
};

exports.setAuthentication = function(router) {
  router.use(session({
    secret: '2C44-4D55-WppQ38S', // TODO move to config
    resave: true,
    saveUninitialized: true,
  }));
  router.use(isLoggedIn);
};


exports.logOut = function(req) {
  req.session.destroy();
};

exports.logIn = function(username, password, req) {
  return new Promise((resolve, reject) => {
    if (!username || !password) {
      reject('login failed');
    } else if(username === 'admin' && password === 'admin') {  // TODO move to config (or use web settings from database)
      req.session = {};
      req.session.loggedIn = true;
      resolve('login success!');
    } else {
      reject('login failed');
    }
  });
};
