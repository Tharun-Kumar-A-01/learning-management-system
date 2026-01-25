const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'LMS Platform'
    },
    tagline: {
        type: String,
        default: 'Learn. Grow. Succeed.'
    },
    primaryColor: {
        type: String,
        default: '#5f82f3'
    },
    secondaryColor: {
        type: String,
        default: '#2a2580'
    },
    logoUrl: {
        type: String,
        default: ''
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

// Ensure only one document exists (singleton pattern)
SiteSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Update the updatedAt field on save
SiteSettingsSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
