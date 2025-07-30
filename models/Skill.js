// models/Skill.js

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // e.g., 'Intermediate', 'Advanced', 'Expert'
  level: {
    type: String,
    required: true
  },
  // e.g., 'Frontend', 'Backend', 'Database'
  category: {
    type: String,
    required: true
  }
});

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;