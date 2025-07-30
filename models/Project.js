// models/Project.js

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // URL to a screenshot or project image
  imageUrl: {
    type: String,
    required: true
  },
  // URL to the live project or its code repository
  projectUrl: {
    type: String,
    required: true
  },
  // An array to list the technologies used, e.g., ['Node.js', 'React', 'MongoDB']
  technologies: {
    type: [String],
    default: []
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;