// models/Blog.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true,
    default: 'https://via.placeholder.com/400x250' // A default placeholder image
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // ADD THESE TWO FIELDS
  likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
  }],
  comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
  }]
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;