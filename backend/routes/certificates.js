const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:id
// @access  Public
router.get('/verify/:id', async (req, res) => {
    try {
        const certificateId = req.params.id;

        // Certificate ID format: courseId-userId-timestamp
        // For simplicity, we use course ID and search for completion

        // Find course with this ID
        const course = await Course.findById(certificateId).populate('createdBy', 'name');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found. Please check the ID and try again.'
            });
        }

        // Find completed enrollments
        const completedEnrollments = course.enrollments.filter(e => e.completed);

        if (completedEnrollments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid certificate found for this ID.'
            });
        }

        // Get the first completed enrollment (can be extended to support specific user)
        const enrollment = completedEnrollments[0];
        const user = await User.findById(enrollment.userId).select('name email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Certificate holder not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                certificateId: course._id,
                userName: user.name,
                userEmail: user.email,
                courseTitle: course.title,
                instructorName: course.createdBy?.name || 'Unknown Instructor',
                completedAt: enrollment.completedAt
                    ? new Date(enrollment.completedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : 'Unknown Date',
                isValid: true
            }
        });
    } catch (err) {
        // If the ID format is invalid
        if (err.name === 'CastError') {
            return res.status(404).json({
                success: false,
                message: 'Invalid certificate ID format.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
