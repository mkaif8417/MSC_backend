const mongoose = require('mongoose');

// Single global counter for student registration numbers.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true, default: 'studentRegNo' },
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);