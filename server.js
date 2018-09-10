const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const expressValidator = require('express-validator');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');

// Load environment variables from .env file
dotenv.load();

// Controllers
const userController = require('./controllers/user');
const superHeroController = require('./controllers/superHero');

// Passport OAuth strategies
require('./config/passport');

const app = express();
const server = require('http').createServer(app).listen(4555);
const io = require('socket.io').listen(server);

// mongodb Connection
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true });
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

// Notify
let notify = (req, res, next) => {
  io.emit('notify', req.msg);
  next();
}

// Conf
const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    ifeq: function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    plusOne: function(page, lastPage){
      if(page == lastPage.page){
        return page
      }
      return parseInt(page)+1
    },
    minusOne: function(page){
      if(page == 0){
        return 0
      }
      return parseInt(page)-1
    },
    fixRole: function(role){
      return role[0].name
    },
    toJSON : function(object) {
      return JSON.stringify(object);
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(logger('combined'));
app.use(expressValidator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', userController.ensureAuthenticated, (req, res) => res.redirect('/listHeroes/0'));
app.get('/account', userController.ensureAuthenticated, userController.accountGet);
app.post('/account', userController.ensureAuthenticated, userController.accountPut);
app.get('/signup', userController.signupGet);
app.post('/signup', userController.signupPost);
app.get('/login', userController.loginGet);
app.post('/login', userController.loginPost);
app.get('/logout', userController.ensureAuthenticated, userController.logout);
app.get('/users/:page', userController.ensureAuthenticated, userController.ensureAdmin, userController.userPanel);
app.post('/users', userController.ensureAuthenticated, userController.ensureAdmin, userController.createUser);
app.post('/rmUsers', userController.ensureAuthenticated, userController.ensureAdmin, userController.deleteUser);

app.get('/listPowers/:page', userController.ensureAuthenticated, superHeroController.listPowers);
app.get('/addPower', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.addSuperPowerGet);
app.post('/addPower', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.addSuperPowerPost, notify);
app.get('/viewPower/:power', userController.ensureAuthenticated, superHeroController.viewPower);
app.get('/editPower/:power', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.editPowerGet);
app.post('/editPower/:power', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.editPowerPost, notify);
app.post('/rmPower', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.deletePower, notify);

app.get('/listHeroes/:page', userController.ensureAuthenticated, superHeroController.listHeroes);
app.get('/addHero', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.addSuperHeroGet);
app.post('/addHero', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.addSuperHeroPost, notify);
app.get('/viewHero/:hero', userController.ensureAuthenticated, superHeroController.viewHero);
app.get('/editHero/:hero', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.editHeroGet);
app.post('/editHero/:hero', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.editHeroPost, notify);
app.post('/rmHero', userController.ensureAuthenticated, userController.ensureAdmin, superHeroController.deleteHero, notify);

// Start app
app.listen(8080, () => {
    console.log('app up and running')
});