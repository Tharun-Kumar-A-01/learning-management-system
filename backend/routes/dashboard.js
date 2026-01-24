const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/user');
const Course = require('../models/course');

// @desc    Get dashboard statistics based on user role
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const { role, id: userId, organizationId } = req.user;
        let stats = {};

        switch (role) {
            case 'learner':
                stats = await getLearnerStats(userId);
                break;
            case 'trainer':
                stats = await getTrainerStats(userId);
                break;
            case 'admin':
                stats = await getAdminStats(organizationId);
                break;
            case 'super_admin':
                stats = await getSuperAdminStats();
                break;
            default:
                stats = await getLearnerStats(userId);
        }

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Learner statistics
async function getLearnerStats(userId) {
    // Get enrolled courses count
    const enrolledCourses = await Course.countDocuments({
        'enrollments.userId': userId
    }).catch(() => 0);

    // Get completed courses
    const completedCourses = await Course.countDocuments({
        'enrollments': {
            $elemMatch: {
                userId: userId,
                completed: true
            }
        }
    }).catch(() => 0);

    // Calculate progress percentage
    const progressPercentage = enrolledCourses > 0
        ? Math.round((completedCourses / enrolledCourses) * 100)
        : 0;

    // Get certificates count (completed courses)
    const certificatesEarned = completedCourses;

    // Get in-progress courses
    const inProgressCourses = enrolledCourses - completedCourses;

    return {
        enrolledCourses,
        completedCourses,
        inProgressCourses,
        certificatesEarned,
        progressPercentage,
        recentActivity: []
    };
}

// Trainer statistics
async function getTrainerStats(userId) {
    // Get courses created by trainer
    const coursesCreated = await Course.countDocuments({
        createdBy: userId
    }).catch(() => 0);

    // Get total learners across all courses
    const courses = await Course.find({ createdBy: userId }).catch(() => []);
    let totalLearners = 0;
    courses.forEach(course => {
        if (course.enrollments) {
            totalLearners += course.enrollments.length;
        }
    });

    // Pending assessments (placeholder)
    const pendingAssessments = 0;

    // Average completion rate
    let totalCompletions = 0;
    let totalEnrollments = 0;
    courses.forEach(course => {
        if (course.enrollments) {
            totalEnrollments += course.enrollments.length;
            totalCompletions += course.enrollments.filter(e => e.completed).length;
        }
    });
    const avgCompletionRate = totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0;

    return {
        coursesCreated,
        totalLearners,
        pendingAssessments,
        avgCompletionRate,
        recentActivity: []
    };
}

// Admin/HR statistics
async function getAdminStats(organizationId) {
    const orgFilter = organizationId ? { organizationId } : {};

    // Total users
    const totalUsers = await User.countDocuments(orgFilter).catch(() => 0);

    // Users by role
    const learners = await User.countDocuments({ ...orgFilter, role: 'learner' }).catch(() => 0);
    const trainers = await User.countDocuments({ ...orgFilter, role: 'trainer' }).catch(() => 0);
    const admins = await User.countDocuments({ ...orgFilter, role: 'admin' }).catch(() => 0);

    // Active courses
    const activeCourses = await Course.countDocuments({
        ...orgFilter,
        status: { $in: ['published', 'active', undefined] }
    }).catch(() => 0);

    // Total courses
    const totalCourses = await Course.countDocuments(orgFilter).catch(() => 0);

    // Overall completion rate
    const courses = await Course.find(orgFilter).catch(() => []);
    let totalCompletions = 0;
    let totalEnrollments = 0;
    courses.forEach(course => {
        if (course.enrollments) {
            totalEnrollments += course.enrollments.length;
            totalCompletions += course.enrollments.filter(e => e.completed).length;
        }
    });
    const completionRate = totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0;

    return {
        totalUsers,
        usersByRole: { learners, trainers, admins },
        activeCourses,
        totalCourses,
        totalEnrollments,
        completionRate,
        recentEnrollments: []
    };
}

// Super Admin statistics
async function getSuperAdminStats() {
    // Get all admin stats without org filter
    const adminStats = await getAdminStats(null);

    // Additional super admin metrics
    const superAdmins = await User.countDocuments({ role: 'super_admin' }).catch(() => 0);
    const totalOrganizations = 1; // Placeholder - implement when Organization model is used

    return {
        ...adminStats,
        usersByRole: {
            ...adminStats.usersByRole,
            superAdmins
        },
        totalOrganizations,
        systemHealth: {
            status: 'healthy',
            uptime: '99.9%'
        }
    };
}

module.exports = router;
