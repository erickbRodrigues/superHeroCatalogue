const mongoose = require('mongoose');

const eventAuditSchema = new mongoose.Schema({
  entity: String,
  entityId: String,
  datetime: { type: Date, default: Date.now },
  username: String,
  action: String
});

const EventAudit = mongoose.model('EventAudit', eventAuditSchema);

module.exports = EventAudit;