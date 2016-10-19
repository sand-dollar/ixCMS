
exports.isLoggedIn = function(req, res, next) {
  //if (req.user.authenticated) {
  if (true) {
    next();
  } else {
    res.redirect('/');
  }
}
