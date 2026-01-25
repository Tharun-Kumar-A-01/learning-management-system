const mongoose = require('mongoose');

const LearningPolicySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['number', 'boolean'],
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
LearningPolicySchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('LearningPolicy', LearningPolicySchema);
