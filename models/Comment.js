// models/Comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Creates a reference to the User model
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Blog' // Creates a reference to the Blog model
    }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);