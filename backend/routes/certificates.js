const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');
const Certificate = require('../models/certificate');

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:id
// @access  Public
router.get('/verify/:id', async (req, res) => {
    try {
        const certificateId = req.params.id;

        const certificate = await Certificate.findOne({ certificateId })
            .populate('user', 'name email')
            .populate('course', 'title createdBy')
            .populate({
                path: 'course',
                populate: {
                    path: 'createdBy',
                    select: 'name'
                }
            });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found. Please check the ID and try again.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                certificateId: certificate.certificateId,
                userName: certificate.user?.name,
                userEmail: certificate.user?.email,
                courseTitle: certificate.course?.title,
                instructorName: certificate.course?.createdBy?.name || 'LMS Platform',
                completedAt: certificate.issueDate
                    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : 'Unknown Date',
                isValid: true
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
