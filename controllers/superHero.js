const SuperHero = require('../models/SuperHero').SuperHeroes;
const SuperPower = require('../models/SuperHero').SuperPower;
const AuditEvent = require('../models/AuditEvent');
const mongoose = require('mongoose');

/**
 * GET /listPowers
 */
exports.listPowers = function (req, res) {
  const itensPerPage = 2;
  SuperPower.find({}).skip(req.params.page * itensPerPage).limit(itensPerPage)
  .exec(function (err, powers){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of heroes' });
      return res.redirect('/listHeroes/0');
    }
    SuperPower.count({}, function(errr, countPower) {
      if (err){
        req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of heroes' });
        return res.redirect('/listHeroes/0');
      }
      const pages = [];
      for(i=0; i< Math.ceil(countPower / itensPerPage); i++){
        pages.push({page: i});
      }
      res.render('superHero/listPowers', {
        title: 'Powers',
        superPowers: powers,
        pages: pages,
        lastPage: pages[pages.length - 1],
        actualPage: req.params.page
      });
    });
  });
}

/**
 * GET /addSuperPowers
 */
exports.addSuperPowerGet = function (req, res) {
  res.render('superHero/createPower', {
    title: 'Create Power '
  });
}

/**
 * POST /addSuperPowers
 */
exports.addSuperPowerPost = function (req, res, next) {
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  console.log(req.user.username);
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  console.log('+++++++++++++++++');
  req.assert('name', 'Username cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/addPower');
  }

  SuperPower.findOne({ name: req.body.name }, function (err, power) {
    if (power) {
      req.flash('error', { msg: 'The power you have entered already exist.' });
      return res.redirect('/addPower');
    }
    power = new SuperPower({
      name: req.body.name,
      description: req.body.description
    });
    power.save(function (err, id) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/addPower');
      }
      let auditEvent = new AuditEvent({
        entity: 'SuperPower',
        entityId: id._id,
        username: req.user.username,
        action: 'CREATE'
      });
      auditEvent.save(function(errr){
        if(errr){
          req.flash('error', errr)
        }
        req.flash('success', { msg: 'Power ' + req.body.name + ' created successfully.' });
        res.redirect('/addPower');
        req.msg = 'SuperPower ' + req.body.name + ' Created by: ' + req.user.username;
        next();
      });
    });
  });
};

/**
 * GET /viewPower
 */
exports.viewPower = function (req, res){
  SuperPower.find({_id: req.params.power}, function (err, power){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get that power' });
      return res.redirect('/listPowers/0');
    }
      res.render('superHero/showPower', {
        title: power[0].name,
        superPower: power[0],
      });
  });
};

/**
 * GET /editPower
 */
exports.editPowerGet = function (req, res){
  SuperPower.find({_id: req.params.power}, function (err, power){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to edit that power' });
      return res.redirect('/listPowers/0');
    }
    res.render('superHero/editPower', {
      title: power[0].name,
      superPower: power[0]
    });
  });
};

/**
 * POST /editPower
 */
exports.editPowerPost = function (req, res, next) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/editPower/' + req.params.power);
  }
  SuperPower.findById( req.body.powerid, function (err, power) {
    if (err) {
      req.flash('error', { msg: 'Error trying to edit that power.' });
      return res.redirect('/viewPower/' + req.body.powerid);
    }
    power.name = req.body.name;
    power.description = req.body.description;
    power.save(function (err, id) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/viewPower/' + req.body.powerid);
      }
      let auditEvent = new AuditEvent({
        entity: 'SuperPower',
        entityId: id._id,
        username: req.user.username,
        action: 'UPDATE'
      });
      auditEvent.save(function(errr){
        if(errr){
          req.flash('error', errr)
        }
        req.flash('success', { msg: 'Power ' + req.body.name + ' edited successfully.' })
        res.redirect('/viewPower/' + req.body.powerid);
        req.msg = 'SuperPower ' + req.body.name + ' Modified by: ' + req.user.username;
        next();
      });
    });
  });
};

/**
 * POST /rmPower
 */
exports.deletePower = function (req, res, next) {
  SuperHero.find({SuperPower: req.body.id}, (err, heroes) => {
    if(err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get delete this power' });
      return res.redirect('/listPowers/0');
    }
    if(heroes.length > 0){
      let heroList = [];
      for(e of heroes){
        heroList.push(e.alias);
      }
      req.flash('error', { msg: 'You cant remove that power beucase it seems this power is associated with ' + heroList});
      return res.redirect('/listPowers/0');
    }

    SuperPower.findOneAndRemove({_id: req.body.id}, function(err, power) {
      if(!err){
        let auditEvent = new AuditEvent({
          entity: 'SuperPower',
          entityId: req.body.id,
          username: req.user.username,
          action: 'Remove'
        });
        auditEvent.save(function(errr){
          if(errr){
            req.flash('error', errr)
          }
          req.flash('success', { msg: 'Power removed. ' });
          res.redirect('/listPowers/0');
          req.msg = 'SuperPower ' + power.name + ' Removed by: ' + req.user.username;
          next();
        });
      } else{
        req.flash('error', err);
        res.redirect('/listPowers/0');
      }
    });
  });
};

/**
 * GET / and /listHeroes
 */
exports.listHeroes = function (req, res) {
  const itensPerPage = 2;
  SuperHero.find({}).skip(req.params.page * itensPerPage).limit(itensPerPage)
  .populate('SuperPower')
  .exec(function (err, heroes){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of heroes' });
      return res.redirect('/listHeroes/0');
    }
    SuperHero.count({}, function(errr, heroCount){
      if (errr){
        req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of heroes' });
        return res.redirect('/listHeroes/0');
      }
      const pages = [];
      for(i=0; i< Math.ceil(heroCount / itensPerPage); i++){
        pages.push({page: i});
      }
      res.render('superHero/listHeroes', {
        title: 'Heroes',
        superHeroes: heroes,
        pages: pages,
        lastPage: pages[pages.length - 1],
        actualPage: req.params.page
      });
    })
  });
};

/**
 * GET /addHero
 */
exports.addSuperHeroGet = function (req, res) {
  SuperPower.find({}, (err, power) => {
    if (err) {
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of powers' });
      return res.redirect('/addHero');
    }
    res.render('superHero/createHero', {
      title: 'Create Hero',
      powers: power.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)}),
    });
  })
};

/**
 * POST /addHero
 */
exports.addSuperHeroPost = function (req, res, next) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('alias', 'Alias cannot be blank').notEmpty();
  req.assert('protectName', 'Protection Area Name cannot be blank').notEmpty();
  req.assert('latitude', 'Latitude cannot be blank').notEmpty();
  req.assert('longitude', 'Longitude cannot be blank').notEmpty();
  req.assert('radius', 'Radius cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/addHero');
  }
  SuperHero.findOne({ name: req.body.name }, function (err, hero) {
    if (hero) {
      req.flash('error', { msg: 'The hero you have entered already exist.' });
      return res.redirect('/addHero');
    }
    hero = new SuperHero({
      name: req.body.name,
      alias: req.body.alias,
      ProtectionArea: {
        name: req.body.protectName,
        lat: req.body.latitude,
        long: req.body.longitude,
        radius: req.body.radius
      },
      SuperPower: req.body.superPowers
    });
    hero.save(function (err, id) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/addHero');
      }
      let auditEvent = new AuditEvent({
        entity: 'SuperHero',
        entityId: id._id,
        username: req.user.username,
        action: 'CREATE'
      });
      auditEvent.save(function(errr){
        if(errr){
          req.flash('error', errr)
        }
        req.flash('success', { msg: 'Hero ' + req.body.alias + ' created successfully.' })
        res.redirect('/addHero');
        req.msg = 'SuperHero ' + req.body.alias + ' Created by: ' + req.user.username;
        next();
      });
    });
  });
};

/**
 * GET /viewHero
 */
exports.viewHero = function (req, res){
  SuperHero.find({_id: req.params.hero})
  .populate('SuperPower')
  .exec(function (err, hero){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get that hero' });
      return res.redirect('/listHeroes/0');
    }
      res.render('superHero/showHero', {
        title: hero[0].alias,
        superHero: hero[0],
      });
  });
};

/**
 * GET /editHero
 */
exports.editHeroGet = function (req, res){
  SuperHero.find({_id: req.params.hero})
  .populate('SuperPower')
  .exec(function (err, hero){
    if (err){
      req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to edit that hero' });
      return res.redirect('/listHeroes/0');
    }
    SuperPower.find({}, (errr, superPowers) => {
      if (errr){
        req.flash('error', { msg: 'Whoops ! Something wrong happened while trying to get the list of available super powers' });
        return res.redirect('/listHeroes/0');
      }
      let i = 0;
      let powerList = [];
      for(e of superPowers){
        let needAdd = true;
        for(subE of hero[0].SuperPower){
          if(e.name === subE.name){
            powerList.push({
              _id: e._id,
              name:e.name,
              description: e.description,
              checked: true
            });
            needAdd = false;
          }
        }
        if(needAdd){
          powerList.push({
            _id: e._id,
            name:e.name,
            description: e.description
          });
        }
        i++
      }
      res.render('superHero/editHero', {
        title: hero[0].alias,
        superHero: hero[0],
        powerList: powerList
      });
    });
  });
};

/**
 * POST /editHero
 */
exports.editHeroPost = function (req, res, next) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('alias', 'Alias cannot be blank').notEmpty();
  req.assert('protectName', 'Protection Area Name cannot be blank').notEmpty();
  req.assert('latitude', 'Latitude cannot be blank').notEmpty();
  req.assert('longitude', 'Longitude cannot be blank').notEmpty();
  req.assert('radius', 'Radius cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/editHero/' + req.params.hero);
  }
  SuperHero.findById( req.body.heroid, function (err, hero) {
    if (err) {
      req.flash('error', { msg: 'Error trying to edit that hero.' });
      return res.redirect('/viewHero/' + req.body.heroid);
    }
    let powers = [];
    if(req.body.superPowers){
      if(req.body.superPowers.constructor === Array){
        for (e of req.body.superPowers){
          console.log(e);
          powers.push(mongoose.Types.ObjectId(e))
        }
      }else{
        powers.push(mongoose.Types.ObjectId(req.body.superPowers));
      }
    }
    hero.name = req.body.name;
    hero.alias = req.body.alias;
    hero.ProtectionArea.name = req.body.protectName;
    hero.ProtectionArea.lat = req.body.latitude;
    hero.ProtectionArea.long = req.body.longitude;
    hero.ProtectionArea.radius = req.body.radius;
    hero.SuperPower = powers;
    hero.save(function (err, id) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/viewHero/' + req.body.heroid);
      }
      let auditEvent = new AuditEvent({
        entity: 'SuperHero',
        entityId: id._id,
        username: req.user.username,
        action: 'UPDATE'
      });
      auditEvent.save(function(errr, event){
        if(errr){
          req.flash('error', errr)
        }
        req.flash('success', { msg: 'Hero ' + req.body.alias + ' edited successfully.' })
        res.redirect('/viewHero/' + req.body.heroid);
        req.msg = 'SuperHero ' + req.body.alias + ' Modified by: ' + req.user.username;
        next();
      });
    });
  });
};

/**
 * POST /rmHero
 */
exports.deleteHero = function (req, res, next) {
  SuperHero.findOneAndRemove({_id: req.body.id}, function(err, hero) {
    if(!err){
      let auditEvent = new AuditEvent({
        entity: 'SuperHero',
        entityId: req.body.id,
        username: req.user.username,
        action: 'Remove'
      });
      auditEvent.save(function(errr){
        if(errr){
          req.flash('error', errr)
        }
        req.flash('success', { msg: 'Hero removed. ' });
        res.redirect('/listHeroes/0');
        req.msg = 'SuperHero ' + hero.alias + ' Removed by: ' + req.user.username;
        next();
      });
    } else{
      req.flash('error', err);
      res.redirect('/listHeroes/0');
    }
  });
};