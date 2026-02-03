const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    category: {
        type: String,
        default: 'General'
    },
    tags: [{
        type: String
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
ArticleSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// Index for efficient queries
ArticleSchema.index({ category: 1, status: 1 });
ArticleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', ArticleSchema);
