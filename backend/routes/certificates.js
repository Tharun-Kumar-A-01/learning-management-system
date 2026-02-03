const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:id
// @access  Public
router.get('/verify/:id', async (req, res) => {
    try {
        const fullId = req.params.id;

        // Handle unique ID format: courseId-userId
        const [courseId, userId] = fullId.split('-');

        if (!courseId || (fullId.includes('-') && !userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid certificate ID format.'
            });
        }

        // Find course
        const course = await Course.findById(courseId).populate('createdBy', 'name');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found. Please check the ID and try again.'
            });
        }

        // Find specific target user
        let targetUserId = userId;

        // Fallback for older certificates that only had courseId (if any exist)
        if (!userId) {
            const completedEnrollments = course.enrollments.filter(e => e.completed);
            if (completedEnrollments.length === 0) {
                return res.status(404).json({ success: false, message: 'No valid certificate found for this ID.' });
            }
            targetUserId = completedEnrollments[0].userId;
        }

        const enrollment = course.enrollments.find(e =>
            e.userId.toString() === targetUserId && e.completed
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'No completed enrollment found for this certificate ID.'
            });
        }

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
                certificateId: fullId,
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
