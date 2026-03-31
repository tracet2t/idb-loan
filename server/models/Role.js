const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  permissions: [{ 
    type: String, 
    enum: [
      'CREATE_LOAN', 'VIEW_LOANS', 'APPROVE_LOAN', 
      'REJECT_LOAN', 'UPLOAD_MIGRATION', 'VIEW_ANALYTICS',
      'MANAGE_USERS'
    ] 
  }]
});

module.exports = mongoose.model('Role', roleSchema);