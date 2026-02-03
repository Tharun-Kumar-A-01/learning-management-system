const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get learner analytics
// @route   GET /api/analytics/learner
// @access  Private (Learner)
router.get('/learner', protect, authorize('learner'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all enrolled courses
        const courses = await Course.find({ 'enrollments.userId': userId });

        let totalQuizzes = 0;
        let passedQuizzes = 0;
        let totalAssessments = 0;
        let passedAssessments = 0;
        let totalQuizScore = 0;
        let totalAssessmentScore = 0;
        let completedCourses = 0;
        let totalProgress = 0;

        const courseAnalytics = courses.map(course => {
            const enrollment = course.enrollments.find(e => e.userId.toString() === userId);
            if (!enrollment) return null;

            const courseQuizzes = enrollment.quizResults.length;
            const coursePassedQuizzes = enrollment.quizResults.filter(q => q.isPassed).length;
            const courseAssessments = enrollment.assessmentResults.length;
            const coursePassedAssessments = enrollment.assessmentResults.filter(a => a.isPassed).length;

            // Calculate average quiz score
            const quizScores = enrollment.quizResults.map(q => q.bestScore || 0);
            const avgQuizScore = quizScores.length > 0
                ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
                : 0;

            // Calculate average assessment score
            const assessmentScores = enrollment.assessmentResults
                .filter(a => a.score !== undefined)
                .map(a => a.score);
            const avgAssessmentScore = assessmentScores.length > 0
                ? assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length
                : 0;

            // Accumulate totals
            totalQuizzes += courseQuizzes;
            passedQuizzes += coursePassedQuizzes;
            totalAssessments += courseAssessments;
            passedAssessments += coursePassedAssessments;
            totalQuizScore += avgQuizScore * courseQuizzes;
            totalAssessmentScore += avgAssessmentScore * courseAssessments;
            totalProgress += enrollment.progress || 0;
            if (enrollment.completed) completedCourses++;

            return {
                courseId: course._id,
                courseTitle: course.title,
                progress: enrollment.progress || 0,
                completed: enrollment.completed || false,
                enrolledAt: enrollment.enrolledAt,
                deadline: enrollment.deadline,
                isMandatory: enrollment.isMandatory,
                quizzes: {
                    total: courseQuizzes,
                    passed: coursePassedQuizzes,
                    averageScore: Math.round(avgQuizScore * 100) / 100
                },
                assessments: {
                    total: courseAssessments,
                    passed: coursePassedAssessments,
                    averageScore: Math.round(avgAssessmentScore * 100) / 100
                }
            };
        }).filter(Boolean);

        const overallAnalytics = {
            totalCourses: courses.length,
            completedCourses,
            inProgressCourses: courses.length - completedCourses,
            averageProgress: courses.length > 0 ? Math.round(totalProgress / courses.length) : 0,
            quizzes: {
                total: totalQuizzes,
                passed: passedQuizzes,
                averageScore: totalQuizzes > 0
                    ? Math.round((totalQuizScore / totalQuizzes) * 100) / 100
                    : 0
            },
            assessments: {
                total: totalAssessments,
                passed: passedAssessments,
                averageScore: totalAssessments > 0
                    ? Math.round((totalAssessmentScore / totalAssessments) * 100) / 100
                    : 0
            }
        };

        res.status(200).json({
            success: true,
            data: {
                overall: overallAnalytics,
                courses: courseAnalytics
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get trainer analytics
// @route   GET /api/analytics/trainer
// @access  Private (Trainer)
router.get('/trainer', protect, authorize('trainer'), async (req, res) => {
    try {
        const trainerId = req.user.id;

        // Get courses created by this trainer
        const courses = await Course.find({ createdBy: trainerId })
            .populate('enrollments.userId', 'name email');

        let totalEnrollments = 0;
        let totalCompletions = 0;
        let allQuizScores = [];
        let allAssessmentScores = [];
        let pendingSubmissions = 0;
        let pendingAppeals = 0;

        const courseAnalytics = courses.map(course => {
            const enrollments = course.enrollments.length;
            const completions = course.enrollments.filter(e => e.completed).length;

            let courseQuizScores = [];
            let courseAssessmentScores = [];
            let coursePendingSubmissions = 0;
            let coursePendingAppeals = 0;

            course.enrollments.forEach(enrollment => {
                // Collect quiz scores
                enrollment.quizResults.forEach(qr => {
                    if (qr.bestScore !== undefined) {
                        courseQuizScores.push(qr.bestScore);
                        allQuizScores.push(qr.bestScore);
                    }
                    if (qr.appeal?.status === 'pending') {
                        coursePendingAppeals++;
                        pendingAppeals++;
                    }
                });

                // Collect assessment scores
                enrollment.assessmentResults.forEach(ar => {
                    if (ar.score !== undefined) {
                        courseAssessmentScores.push(ar.score);
                        allAssessmentScores.push(ar.score);
                    }
                    if (ar.status === 'submitted') {
                        coursePendingSubmissions++;
                        pendingSubmissions++;
                    }
                    if (ar.appeal?.status === 'pending') {
                        coursePendingAppeals++;
                        pendingAppeals++;
                    }
                });
            });

            totalEnrollments += enrollments;
            totalCompletions += completions;

            return {
                courseId: course._id,
                courseTitle: course.title,
                status: course.status,
                enrollments,
                completions,
                completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
                averageQuizScore: courseQuizScores.length > 0
                    ? Math.round(courseQuizScores.reduce((a, b) => a + b, 0) / courseQuizScores.length * 100) / 100
                    : 0,
                averageAssessmentScore: courseAssessmentScores.length > 0
                    ? Math.round(courseAssessmentScores.reduce((a, b) => a + b, 0) / courseAssessmentScores.length * 100) / 100
                    : 0,
                pendingSubmissions: coursePendingSubmissions,
                pendingAppeals: coursePendingAppeals
            };
        });

        const overallAnalytics = {
            totalCourses: courses.length,
            publishedCourses: courses.filter(c => c.status === 'published').length,
            totalEnrollments,
            totalCompletions,
            overallCompletionRate: totalEnrollments > 0
                ? Math.round((totalCompletions / totalEnrollments) * 100)
                : 0,
            averageQuizScore: allQuizScores.length > 0
                ? Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length * 100) / 100
                : 0,
            averageAssessmentScore: allAssessmentScores.length > 0
                ? Math.round(allAssessmentScores.reduce((a, b) => a + b, 0) / allAssessmentScores.length * 100) / 100
                : 0,
            pendingSubmissions,
            pendingAppeals
        };

        res.status(200).json({
            success: true,
            data: {
                overall: overallAnalytics,
                courses: courseAnalytics
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get admin analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin, Super Admin)
router.get('/admin', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { courseId } = req.query;

        let courseQuery = {};
        if (courseId) {
            courseQuery._id = courseId;
        }

        const courses = await Course.find(courseQuery)
            .populate('createdBy', 'name email')
            .populate('enrollments.userId', 'name email');

        const users = await User.find().select('-password');

        // User statistics
        const userStats = {
            total: users.length,
            byRole: {
                learners: users.filter(u => u.role === 'learner').length,
                trainers: users.filter(u => u.role === 'trainer').length,
                admins: users.filter(u => u.role === 'admin').length,
                superAdmins: users.filter(u => u.role === 'super_admin').length
            },
            active: users.filter(u => u.isActive).length,
            inactive: users.filter(u => !u.isActive).length
        };

        // Course statistics
        let totalEnrollments = 0;
        let totalCompletions = 0;
        let allQuizScores = [];
        let allAssessmentScores = [];

        const courseAnalytics = courses.map(course => {
            const enrollments = course.enrollments.length;
            const completions = course.enrollments.filter(e => e.completed).length;

            let courseQuizScores = [];
            let courseAssessmentScores = [];

            course.enrollments.forEach(enrollment => {
                enrollment.quizResults.forEach(qr => {
                    if (qr.bestScore !== undefined) {
                        courseQuizScores.push(qr.bestScore);
                        allQuizScores.push(qr.bestScore);
                    }
                });
                enrollment.assessmentResults.forEach(ar => {
                    if (ar.score !== undefined) {
                        courseAssessmentScores.push(ar.score);
                        allAssessmentScores.push(ar.score);
                    }
                });
            });

            totalEnrollments += enrollments;
            totalCompletions += completions;

            return {
                courseId: course._id,
                courseTitle: course.title,
                createdBy: course.createdBy?.name || 'Unknown',
                status: course.status,
                enrollments,
                completions,
                completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
                averageQuizScore: courseQuizScores.length > 0
                    ? Math.round(courseQuizScores.reduce((a, b) => a + b, 0) / courseQuizScores.length * 100) / 100
                    : 0,
                averageAssessmentScore: courseAssessmentScores.length > 0
                    ? Math.round(courseAssessmentScores.reduce((a, b) => a + b, 0) / courseAssessmentScores.length * 100) / 100
                    : 0
            };
        });

        const courseStats = {
            total: courses.length,
            byStatus: {
                draft: courses.filter(c => c.status === 'draft').length,
                published: courses.filter(c => c.status === 'published').length,
                archived: courses.filter(c => c.status === 'archived').length
            },
            totalEnrollments,
            totalCompletions,
            overallCompletionRate: totalEnrollments > 0
                ? Math.round((totalCompletions / totalEnrollments) * 100)
                : 0,
            averageQuizScore: allQuizScores.length > 0
                ? Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length * 100) / 100
                : 0,
            averageAssessmentScore: allAssessmentScores.length > 0
                ? Math.round(allAssessmentScores.reduce((a, b) => a + b, 0) / allAssessmentScores.length * 100) / 100
                : 0
        };

        res.status(200).json({
            success: true,
            data: {
                users: userStats,
                courses: courseStats,
                courseDetails: courseAnalytics
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
