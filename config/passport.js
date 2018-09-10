var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


var User = require('../models/User');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Sign in with Username and Password
passport.use(new LocalStrategy({ usernameField: 'username' }, function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (!user) {
      return done(null, false, { msg: 'The username address ' + username + ' is not associated with any account. ' +
      'Double-check your username address and try again.' });
    }
    user.comparePassword(password, function(err, isMatch) {
      if (!isMatch) {
        return done(null, false, { msg: 'Invalid username or password' });
      }
      return done(null, user);
    });
  });
}));
