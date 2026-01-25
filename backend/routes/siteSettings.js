const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/siteSettings');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get site settings (public for landing page)
// @route   GET /api/site-settings
// @access  Public
router.get('/', async (req, res) => {
    try {
        const settings = await SiteSettings.getSettings();
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        console.error('Get site settings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Update site settings
// @route   PUT /api/site-settings
// @access  Private (Super Admin only)
router.put('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const { companyName, tagline, primaryColor, secondaryColor, logoUrl } = req.body;

        let settings = await SiteSettings.findOne();

        if (!settings) {
            settings = new SiteSettings({});
        }

        // Update fields if provided
        if (companyName !== undefined) settings.companyName = companyName;
        if (tagline !== undefined) settings.tagline = tagline;
        if (primaryColor !== undefined) settings.primaryColor = primaryColor;
        if (secondaryColor !== undefined) settings.secondaryColor = secondaryColor;
        if (logoUrl !== undefined) settings.logoUrl = logoUrl;

        settings.updatedBy = req.user.id;
        settings.updatedAt = new Date();

        await settings.save();

        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        console.error('Update site settings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
