const mongoose = require('mongoose')
, Schema = mongoose.Schema;

const superHeroesSchema = new mongoose.Schema({
  name: { type: String, unique: true},
  alias: { type: String, unique: true},
  ProtectionArea: {
    name: String,
    lat: Number,
    long: Number,
    radius: Number
  },
  SuperPower: [{ type: Schema.Types.ObjectId, ref: 'SuperPower' }]
});

const superPowerSchema = new mongoose.Schema({
  name: { type: String, ref: 'SuperHeroes'},
  description: { type: String, ref: 'SuperHeroes'}
});

const SuperHeroes = mongoose.model('SuperHeroes', superHeroesSchema);
const SuperPower = mongoose.model('SuperPower', superPowerSchema);

exports.SuperHeroes = SuperHeroes;
exports.SuperPower = SuperPower;