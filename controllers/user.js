const passport = require('passport');
const User = require('../models/User');

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

/**
 * Ensure is Admin
 */
exports.ensureAdmin = function(req, res, next){
  let isAdmin = false;
  for (e of req.user.role){
    if(e.name === 'Admin'){
        isAdmin = true;
    }
  }
  if(isAdmin){
    next();
  } else {
    req.flash('error', { msg: 'You dont have the permission to do that. '});
    res.redirect('/listHeroes/0');
  }
}

/**
 * GET /login
 */
exports.loginGet = function(req, res) {
  if (req.user) {
    return res.redirect('/listHeroes/0');
  }
  res.render('account/login', {
    title: 'Log in'
  });
};

/**
 * POST /login
 */
exports.loginPost = function(req, res, next) {
  req.assert('username', 'Username cannot be blank').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (!user) {
      req.flash('error', info);
      return res.redirect('/login')
    }
    
    req.logIn(user, function(err) {
      res.redirect('/listHeroes/0');
    });
  })(req, res, next);
};

/**
 * GET /logout
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/listHeroes/0');
};


/**
 * GET /signup
 */
exports.signupGet = function(req, res) {
  res.render('account/signup');
};

/**
 * POST /signup
 */
exports.signupPost = function(req, res, next) {
  req.assert('username', 'Username cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/signup');
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (user) {
      req.flash('error', { msg: 'The username you have entered is already associated with another account.' });
      return res.redirect('/signup');
    }
    user = new User({
      username: req.body.username,
      password: req.body.password,
      role: {name: "Standard"}
    });
    user.save(function(err) {
      if(err){
        req.flash('error', err);
        return res.redirect('/signup');  
      }
      req.flash('success', { msg: 'User '+req.body.username+' created successfully.'})
      res.redirect('/signup');
    });
  });
};

/**
 * GET /users
 */
exports.userPanel = function(req, res){
  const itensPerPage = 2;
  User.find({}).skip(req.params.page * itensPerPage).limit(itensPerPage)
  .exec(function(err, user) {
    if(err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of users' });
      return res.redirect('/users/0');
    }
    User.count({}, function(errr, countUser) {
      if(errr){
        req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of users' });
        return res.redirect('/users/0');
      }
      const pages = [];
      for(i=0; i< Math.ceil(countUser / itensPerPage); i++){
        pages.push({page: i});
      }
      res.render('account/users', {
        title: 'Users',
        users: user,
        pages: pages,
        lastPage: pages[pages.length - 1],
        actualPage: req.params.page
      });
    });
  });
}

/**
 * POST /usersrm
 */
exports.deleteUser = function (req, res) {
  User.remove({username: req.body.usernaame}, function(err) {
    if(!err) {
      req.flash('success', { msg: 'User ' + req.body.usernaame + ' removed. ' });
      res.redirect('/users/0');
    }
    else {
      req.flash('error', err);
      res.redirect('/users/0');
    }
  });
}

/**
 * POST /users
 */
exports.createUser = function(req, res, next) {
  req.assert('username', 'Username cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/users/0');
  }

  User.findOne({ username: req.body.username }, function(err, user) {
    if (user) {
      req.flash('error', { msg: 'The username you have entered is already associated with another account.' });
      return res.redirect('/users/0');
    }
    user = new User({
      username: req.body.username,
      password: req.body.password,
      role: {name: req.body.role}
    });
    user.save(function(err) {
      if(err){
        req.flash('error', err);
        return res.redirect('/users/0');  
      }
      req.flash('success', { msg: 'User '+req.body.username+' created successfully.'})
      res.redirect('/users/0');
    });
  });
};

/**
 * GET /account
 */
exports.accountGet = function(req, res) {
  User.findById(req.user.id, function(err, user) {
    res.render('account/profile', {
      title: 'My Account'
    });
  });
};

/**
 * POST /account
 * Change password.
 */
exports.accountPut = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirm', 'Passwords must match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {

    user.password = req.body.password;
    user.save(function(err) {
      req.flash('success', { msg: 'Your password has been changed.' });
      res.redirect('/account');
    });
  });
};