const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/emailService');
const { createNotification } = require('../models/notification');
const Certificate = require('../models/certificate');
const crypto = require('crypto');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, category, search } = req.query;
        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // For learners, only show published courses
        if (req.user.role === 'learner') {
            query.status = 'published';
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Search by title
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // For trainers, show only their courses
        if (req.user.role === 'trainer') {
            query.createdBy = req.user.id;
        }

        const courses = await Course.find(query)
            .populate('createdBy', 'name email')
            .populate('enrollments.userId', 'name email')
            .sort({ createdAt: -1 });

        // Add enrollment info for learners
        const coursesWithEnrollment = courses.map(course => {
            const courseObj = course.toObject();
            courseObj.enrolledCount = course.enrollments.length;
            courseObj.totalModules = course.modules.length;

            // Check if current user is enrolled
            const enrollment = course.enrollments.find(
                e => e.userId?._id?.toString() === req.user.id || e.userId?.toString() === req.user.id
            );
            courseObj.isEnrolled = !!enrollment;
            courseObj.progress = enrollment ? enrollment.progress : 0;
            courseObj.deadline = enrollment ? enrollment.deadline : null;
            courseObj.isMandatory = enrollment ? enrollment.isMandatory : false;

            // Hide sensitive content for non-enrolled/non-owners
            const canSeeSensitive = courseObj.isEnrolled ||
                ['admin', 'super_admin'].includes(req.user.role) ||
                course.createdBy?._id?.toString() === req.user.id ||
                course.createdBy?.toString() === req.user.id;

            if (!canSeeSensitive && courseObj.modules) {
                courseObj.modules = courseObj.modules.map(module => ({
                    ...module,
                    lessons: (module.lessons || []).map(lesson => {
                        const l = { ...lesson };
                        if (l.type === 'quiz') delete l.questions;
                        else delete l.content; // Also mask content for other lessons for safety
                        return l;
                    })
                }));
            }

            // Include enrollments for trainers/admins, remove for learners
            if (req.user.role !== 'trainer' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
                delete courseObj.enrollments;
            }

            return courseObj;
        });

        res.status(200).json({ success: true, data: coursesWithEnrollment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get enrolled courses for current user
// @route   GET /api/courses/enrolled
// @access  Private
router.get('/enrolled', protect, async (req, res) => {
    try {
        const { completedOnly } = req.query;
        const courses = await Course.find({
            'enrollments.userId': req.user.id
        }).populate('createdBy', 'name');

        let enrolledCourses = courses.map(course => {
            const courseObj = course.toObject();
            const enrollment = course.enrollments.find(
                e => e.userId.toString() === req.user.id
            );
            courseObj.progress = enrollment ? enrollment.progress : 0;
            courseObj.completed = enrollment ? enrollment.completed : false;
            courseObj.enrolledAt = enrollment ? enrollment.enrolledAt : null;
            courseObj.totalModules = course.modules.length;
            delete courseObj.enrollments;
            return courseObj;
        });

        // Filter by completion if requested
        if (completedOnly === 'true') {
            enrolledCourses = enrolledCourses.filter(course => (course.completed || course.progress === 100) && course.certificateEnabled !== false);
        }

        res.status(200).json({ success: true, data: enrolledCourses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const courseObj = course.toObject();

        // Check enrollment
        const enrollment = course.enrollments.find(
            e => e.userId.toString() === req.user.id
        );
        courseObj.isEnrolled = !!enrollment;
        courseObj.progress = enrollment ? enrollment.progress : 0;
        courseObj.completedLessons = enrollment ? enrollment.completedLessons : [];
        courseObj.quizResults = enrollment ? enrollment.quizResults : [];
        courseObj.assessmentResults = enrollment ? enrollment.assessmentResults : [];
        courseObj.deadline = enrollment ? enrollment.deadline : null;
        courseObj.isMandatory = enrollment ? enrollment.isMandatory : false;

        // Hide sensitive content for non-enrolled/non-owners
        const canSeeSensitive = courseObj.isEnrolled ||
            ['admin', 'super_admin'].includes(req.user.role) ||
            course.createdBy?._id?.toString() === req.user.id ||
            course.createdBy?.toString() === req.user.id;

        if (!canSeeSensitive && courseObj.modules) {
            courseObj.modules = courseObj.modules.map(module => ({
                ...module,
                lessons: (module.lessons || []).map(lesson => {
                    const l = { ...lesson };
                    if (l.type === 'quiz') delete l.questions;
                    else delete l.content;
                    return l;
                })
            }));
        }

        res.status(200).json({ success: true, data: courseObj });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Trainer, Admin, Super Admin)
router.post('/', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        req.body.createdBy = req.user.id;
        req.body.organizationId = req.user.organizationId;

        // Clean up empty modules and lessons
        if (req.body.modules && Array.isArray(req.body.modules)) {
            req.body.modules = req.body.modules
                .filter(m => m.title && m.title.trim() !== '')
                .map(module => ({
                    ...module,
                    lessons: (module.lessons || []).filter(l => l.title && l.title.trim() !== '')
                }));
        }

        const course = await Course.create(req.body);

        res.status(201).json({ success: true, data: course });
    } catch (err) {
        console.error('Course creation error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Owner, Admin, Super Admin)
router.put('/:id', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check ownership for trainers
        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
// @access  Private (Owner, Admin, Super Admin)
router.put('/:id/publish', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check ownership for trainers
        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to publish this course' });
        }

        // Update status to published
        course = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'published' },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        res.status(200).json({ success: true, data: course, message: 'Course published successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Owner, Admin, Super Admin)
router.delete('/:id', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check ownership for trainers
        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private (Learners only)
router.post('/:id/enroll', protect, authorize('learner'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if already enrolled
        const existingEnrollment = course.enrollments.find(
            e => e.userId.toString() === req.user.id
        );

        if (existingEnrollment) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        course.enrollments.push({ userId: req.user.id });
        await course.save();

        res.status(200).json({ success: true, message: 'Enrolled successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Manual enrollment by admin (with deadline)
// @route   POST /api/courses/:id/manual-enroll
// @access  Private (Admin, Super Admin)
router.post('/:id/manual-enroll', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { userIds, deadline, deadlineDays, isMandatory = true } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide user IDs' });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const results = {
            enrolled: [],
            alreadyEnrolled: [],
            failed: []
        };

        // Calculate deadline date if provided
        let deadlineDate = null;
        if (deadline) {
            deadlineDate = new Date(deadline);
        } else if (deadlineDays && deadlineDays >= 1) {
            deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + parseInt(deadlineDays));
        }

        for (const userId of userIds) {
            try {
                // Check if already enrolled
                const existingEnrollment = course.enrollments.find(
                    e => e.userId.toString() === userId
                );

                if (existingEnrollment) {
                    results.alreadyEnrolled.push(userId);
                    continue;
                }

                // Add enrollment with deadline
                course.enrollments.push({
                    userId,
                    deadline: deadlineDate,
                    isMandatory,
                    enrolledBy: req.user.id
                });

                results.enrolled.push(userId);
            } catch (err) {
                results.failed.push({ userId, reason: err.message });
            }
        }

        await course.save();

        // Send response immediately - don't wait for notifications/emails
        res.status(200).json({
            success: true,
            data: results,
            deadline: deadlineDate,
            message: `Enrolled ${results.enrolled.length} users, ${results.alreadyEnrolled.length} already enrolled, ${results.failed.length} failed`
        });

        // Send notifications and emails in background (non-blocking)
        const { createNotification } = require('./notifications');
        setImmediate(async () => {
            for (const userId of results.enrolled) {
                try {
                    const deadlineMsg = deadlineDate ? ` Deadline: ${deadlineDate.toLocaleDateString()}.` : '';
                    // Create inbox notification
                    await createNotification(
                        userId,
                        'enrollment',
                        `Enrolled in: ${course.title}`,
                        `You have been enrolled in "${course.title}".${deadlineMsg} ${isMandatory ? 'This is a mandatory course.' : ''}`,
                        `/courses/${course._id}`
                    );

                    // Send email with proper course data
                    const enrolledUser = await User.findById(userId);
                    if (enrolledUser) {
                        await sendNotificationEmail(enrolledUser, 'enrollment', {
                            courseName: course.title,
                            deadline: deadlineDate,
                            isMandatory
                        });
                    }
                } catch (err) {
                    console.error(`Failed to send notification/email to user ${userId}:`, err.message);
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Update course progress
// @route   PUT /api/courses/:id/progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
    try {
        const { lessonId, progress } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const enrollment = course.enrollments.find(
            e => e.userId.toString() === req.user.id
        );

        if (!enrollment) {
            return res.status(400).json({ success: false, message: 'Not enrolled in this course' });
        }

        // Add completed lesson
        if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
            enrollment.completedLessons.push(lessonId);
        }

        // Update progress
        if (progress !== undefined) {
            enrollment.progress = Math.round(progress);
        }

        // Check for completion
        if (enrollment.progress >= 100) {
            enrollment.completed = true;
            enrollment.completedAt = new Date();
        }

        await course.save();

        res.status(200).json({ success: true, data: enrollment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Submit quiz attempt
// @route   POST /api/courses/:id/quiz/:lessonId/submit
// @access  Private
router.post('/:id/quiz/:lessonId/submit', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        const lessonId = req.params.lessonId;

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
        if (!enrollment) {
            return res.status(400).json({ success: false, message: 'Not enrolled in this course' });
        }

        // Find module index and lesson index
        let targetLesson;
        course.modules.some(m => {
            const found = m.lessons.find(l => l._id.toString() === lessonId);
            if (found) {
                targetLesson = found;
                return true;
            }
            return false;
        });

        if (!targetLesson || targetLesson.type !== 'quiz') {
            return res.status(404).json({ success: false, message: 'Quiz lesson not found' });
        }

        // Check attempts
        let quizResult = enrollment.quizResults.find(r => r.lessonId === lessonId);
        if (!quizResult) {
            enrollment.quizResults.push({ lessonId, attempts: [], bestScore: 0, isPassed: false });
            quizResult = enrollment.quizResults[enrollment.quizResults.length - 1];
        }

        let maxAllowed = targetLesson.maxAttempts || 0;
        // If appeal is approved, add 3 attempts
        if (quizResult.appeal?.status === 'approved') {
            maxAllowed += 3;
        }

        if (maxAllowed > 0 && quizResult.attempts.length >= maxAllowed) {
            return res.status(400).json({ success: false, message: 'Max attempts reached for this quiz' });
        }

        // Calculate Score
        let score = 0;
        let totalPoints = 0;

        targetLesson.questions.forEach((q, index) => {
            totalPoints += q.points || 1;
            const userAnswer = answers[index];
            if (userAnswer !== undefined && parseInt(userAnswer) === q.correctAnswer) {
                score += q.points || 1;
            }
        });

        const rawPercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        const percentage = Math.round(rawPercentage * 100) / 100; // Round to 2 decimal places
        const passed = percentage >= (targetLesson.passingPercentage || 70);

        // Record Attempt
        quizResult.attempts.push({
            score,
            totalPoints,
            percentage,
            passed
        });

        // Update Best Score
        if (percentage > quizResult.bestScore) {
            quizResult.bestScore = percentage;
        }

        // Update Passed Status (if passed once, stays passed)
        if (passed) {
            quizResult.isPassed = true;
            if (!enrollment.completedLessons.includes(lessonId)) {
                enrollment.completedLessons.push(lessonId);
            }
        }

        // Update Enrollment Progress
        const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        if (totalLessons > 0) {
            enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
        }

        if (enrollment.progress >= 100) {
            enrollment.completed = true;
            enrollment.completedAt = new Date();
        }

        await course.save();

        res.status(200).json({
            success: true,
            data: {
                passed,
                score,
                totalPoints,
                percentage,
                attemptsLeft: targetLesson.maxAttempts > 0 ? Math.max(0, targetLesson.maxAttempts - quizResult.attempts.length) : null,
                bestScore: quizResult.bestScore,
                attempts: quizResult.attempts.length,
                isCompleted: enrollment.completed,
                appealStatus: quizResult.appeal?.status || 'none'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Appeal for extra quiz attempts
// @route   POST /api/courses/:id/quiz/:lessonId/appeal
// @access  Private (Learner)
router.post('/:id/quiz/:lessonId/appeal', protect, authorize('learner'), async (req, res) => {
    try {
        const { reason } = req.body;
        const lessonId = req.params.lessonId;

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
        if (!enrollment) return res.status(400).json({ success: false, message: 'Not enrolled' });

        const quizResult = enrollment.quizResults.find(r => r.lessonId === lessonId);
        if (!quizResult) return res.status(404).json({ success: false, message: 'Quiz not found' });

        // Ensure status is none or rejected before allow new appeal
        if (quizResult.appeal && quizResult.appeal.status === 'pending') {
            return res.status(400).json({ success: false, message: 'Appeal already pending' });
        }

        quizResult.appeal = {
            status: 'pending',
            reason,
            date: new Date()
        };

        await course.save();
        res.json({ success: true, data: quizResult.appeal });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get all quiz appeals for trainer/admin
// @route   GET /api/courses/appeals/all
// @access  Private (Trainer, Admin, Super Admin)
router.get('/appeals/manage', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'trainer') {
            query.createdBy = req.user.id;
        }

        const courses = await Course.find(query).populate('enrollments.userId', 'name email');

        const appeals = [];
        courses.forEach(course => {
            course.enrollments.forEach(enrollment => {
                enrollment.quizResults.forEach(qr => {
                    if (qr.appeal && qr.appeal.status !== 'none') {
                        appeals.push({
                            courseId: course._id,
                            courseTitle: course.title,
                            userId: enrollment.userId._id,
                            userName: enrollment.userId.name,
                            userEmail: enrollment.userId.email,
                            lessonId: qr.lessonId,
                            appeal: qr.appeal,
                            bestScore: qr.bestScore,
                            attempts: qr.attempts.length,
                            type: 'quiz'
                        });
                    }
                });

                enrollment.assessmentResults?.forEach(ar => {
                    if (ar.appeal && ar.appeal.status !== 'none') {
                        appeals.push({
                            courseId: course._id,
                            courseTitle: course.title,
                            userId: enrollment.userId._id,
                            userName: enrollment.userId.name,
                            userEmail: enrollment.userId.email,
                            lessonId: ar.lessonId,
                            appeal: ar.appeal,
                            score: ar.score,
                            submissionFile: ar.submissionFile,
                            type: 'assessment'
                        });
                    }
                });
            });
        });

        res.json({ success: true, data: appeals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Action a quiz appeal
// @route   PUT /api/courses/:id/quiz/:lessonId/appeal/:userId
// @access  Private (Trainer/Admin)
router.put('/:id/quiz/:lessonId/appeal/:userId', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { status, comment } = req.body;
        const { id, lessonId, userId } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        // Check ownership
        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const enrollment = course.enrollments.find(e => e.userId.toString() === userId);
        if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

        const quizResult = enrollment.quizResults.find(r => r.lessonId === lessonId);
        if (!quizResult) return res.status(404).json({ success: false, message: 'Quiz Result not found' });

        quizResult.appeal.status = status;
        quizResult.appeal.comment = comment;
        quizResult.appeal.reviewedBy = req.user.id;
        quizResult.appeal.reviewedAt = new Date();

        // If approved, effectively "reset" or extend attempts?
        // User said: "when appeal is approved the learner gains 3 more attempts"
        // But how do we track this? Maybe we just need to know they ARE granted extra.
        // Let's modify the Lesson schema or track it in quizResult.
        // Actually, let's just use a counter or something.
        // For simplicity, let's add `extraAttempts` to quizResult in the model if needed.
        // Re-read: "gains 3 more attempts".
        // Let's stick to modifying the logic in the submit route to check for "approved appeal".

        await course.save();

        // Send notification to learner
        const { createNotification } = require('./notifications');
        try {
            await createNotification(
                enrollment.userId,
                'appeal_update',
                `Appeal Status Update: ${course.title}`,
                `Your appeal for quiz "${lessonId}" in course "${course.title}" has been ${status}. ${comment ? `Comment: ${comment}` : ''}`,
                `/courses/${course._id}`
            );

            // Send Email
            const user = await User.findById(userId);
            if (user) {
                // Find lesson title if possible, otherwise use ID
                let lessonTitle = lessonId;
                course.modules.forEach(m => {
                    const l = m.lessons.find(l => l._id.toString() === lessonId);
                    if (l) lessonTitle = l.title;
                });

                await sendNotificationEmail(user, 'appeal_update', {
                    courseName: course.title,
                    lessonTitle: lessonTitle,
                    status: status,
                    comment: comment
                });
            }

        } catch (err) {
            console.error('Failed to send appeal notification:', err);
        }
        res.json({ success: true, data: quizResult.appeal });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get user's own appeals
// @route   GET /api/courses/my-appeals
// @access  Private (Learner)
router.get('/appeals/my', protect, authorize('learner'), async (req, res) => {
    try {
        const courses = await Course.find({ 'enrollments.userId': req.user.id });
        const appeals = [];
        courses.forEach(course => {
            const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
            enrollment.quizResults.forEach(qr => {
                if (qr.appeal && qr.appeal.status !== 'none') {
                    appeals.push({
                        courseId: course._id,
                        courseTitle: course.title,
                        lessonId: qr.lessonId,
                        appeal: qr.appeal,
                        bestScore: qr.bestScore,
                        attempts: qr.attempts?.length || 0,
                        type: 'quiz'
                    });
                }
            });

            // Add assessment appeals
            enrollment.assessmentResults.forEach(ar => {
                if (ar.appeal && ar.appeal.status !== 'none') {
                    appeals.push({
                        courseId: course._id,
                        courseTitle: course.title,
                        lessonId: ar.lessonId,
                        appeal: ar.appeal,
                        score: ar.score,
                        type: 'assessment'
                    });
                }
            });
        });
        res.json({ success: true, data: appeals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Submit assessment
// @route   POST /api/courses/:id/assessment/:lessonId/submit
// @access  Private (Learner)
router.post('/:id/assessment/:lessonId/submit', protect, authorize('learner'), async (req, res) => {
    try {
        const { submissionFile } = req.body; // Base64 PDF
        const lessonId = req.params.lessonId;

        if (!submissionFile) {
            return res.status(400).json({ success: false, message: 'Please provide a submission file' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
        if (!enrollment) return res.status(400).json({ success: false, message: 'Not enrolled' });

        let assessmentResult = enrollment.assessmentResults.find(r => r.lessonId === lessonId);
        if (assessmentResult) {
            // Strictly only one submission allowed unless an appeal was approved for resubmission
            if (assessmentResult.status !== 'approved_for_resubmission') {
                return res.status(400).json({ success: false, message: 'Assessment already submitted. Only one submission allowed.' });
            }
            assessmentResult.submissionFile = submissionFile;
            assessmentResult.submissionDate = new Date();
            assessmentResult.status = 'submitted';
        } else {
            enrollment.assessmentResults.push({
                lessonId,
                submissionFile,
                status: 'submitted'
            });
        }

        await course.save();
        res.json({ success: true, message: 'Assessment submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Grade assessment
// @route   PUT /api/courses/:id/assessment/:lessonId/grade/:userId
// @access  Private (Trainer/Admin)
router.put('/:id/assessment/:lessonId/grade/:userId', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        let { score, feedback } = req.body;
        const { id, lessonId, userId } = req.params;

        // Validation: Score must be an integer between 0 and 100
        score = parseInt(score);
        if (isNaN(score) || score < 0 || score > 100) {
            return res.status(400).json({ success: false, message: 'Invalid score. Must be between 0 and 100.' });
        }

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        // Check ownership
        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const enrollment = course.enrollments.find(e => e.userId.toString() === userId);
        if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

        const assessmentResult = enrollment.assessmentResults.find(r => r.lessonId === lessonId);
        if (!assessmentResult) return res.status(404).json({ success: false, message: 'Submission not found' });

        // Get lesson to check passing score
        let targetLesson = null;
        course.modules.forEach(m => {
            const l = m.lessons.find(l => l._id.toString() === lessonId);
            if (l) targetLesson = l;
        });

        // Grading Lock Check
        // If already passed or failed, prevent re-grading unless there is an active appeal (approved or pending)
        // If appeal is 'approved', it means they are allowed to be re-graded.
        if ((assessmentResult.status === 'passed' || assessmentResult.status === 'failed') &&
            (!assessmentResult.appeal || (assessmentResult.appeal.status !== 'approved' && assessmentResult.appeal.status !== 'pending'))) {
            return res.status(400).json({ success: false, message: 'Assessment already graded. Cannot overwrite unless appealed.' });
        }

        const passingPercentage = targetLesson?.passingPercentage || 70;
        const isPassed = score >= passingPercentage;

        assessmentResult.score = score;
        assessmentResult.feedback = feedback;
        assessmentResult.isPassed = isPassed;
        assessmentResult.status = isPassed ? 'passed' : 'failed';

        // If re-graded due to appeal, update appeal status to resolved
        if (assessmentResult.appeal && (assessmentResult.appeal.status === 'approved' || assessmentResult.appeal.status === 'pending')) {
            assessmentResult.appeal.status = 'resolved';
            assessmentResult.appeal.resolvedAt = new Date();
        }

        // If passed, mark lesson as complete
        if (isPassed && !enrollment.completedLessons.includes(lessonId)) {
            enrollment.completedLessons.push(lessonId);

            // Mark course complete if all lessons done
            let totalLessons = 0;
            course.modules.forEach(m => totalLessons += m.lessons.length);
            enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
            if (enrollment.progress === 100) {
                enrollment.completed = true;
                enrollment.completedAt = new Date();

                // Generate Certificate
                try {
                    const existingCert = await Certificate.findOne({ user: enrollment.userId, course: course._id });
                    if (!existingCert) {
                        const certificateId = crypto.randomBytes(8).toString('hex').toUpperCase();
                        await Certificate.create({
                            certificateId,
                            user: enrollment.userId,
                            course: course._id,
                            issueDate: new Date(),
                            grade: score // Tracking final assessment score as the "grade" for now
                        });
                        // Could add a notification for certificate here too
                    }
                } catch (certErr) {
                    console.error('Error generating certificate:', certErr);
                }
            }
        }

        await course.save();

        // Send notification to learner
        const { createNotification } = require('./notifications');
        try {
            await createNotification(
                enrollment.userId,
                'grading',
                `Assessment Graded: ${course.title}`,
                `Your assessment for "${targetLesson ? targetLesson.title : 'lesson'}" in course "${course.title}" has been graded. Status: ${isPassed ? 'Passed' : 'Failed'} (${score}%). ${feedback ? `Feedback: ${feedback}` : ''}`,
                `/courses/${course._id}`
            );

            // Send Email
            const user = await User.findById(userId);
            if (user) {
                await sendNotificationEmail(user, 'grading', {
                    courseName: course.title,
                    lessonTitle: targetLesson ? targetLesson.title : 'Assessment',
                    score: score,
                    passed: isPassed,
                    feedback: feedback
                });
            }

        } catch (err) {
            console.error('Failed to send grading notification:', err);
        }
        res.json({ success: true, data: assessmentResult });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Appeal for failed assessment
// @route   POST /api/courses/:id/assessment/:lessonId/appeal
// @access  Private (Learner)
router.post('/:id/assessment/:lessonId/appeal', protect, authorize('learner'), async (req, res) => {
    try {
        const { reason } = req.body;
        const lessonId = req.params.lessonId;

        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
        if (!enrollment) return res.status(400).json({ success: false, message: 'Not enrolled' });

        const assessmentResult = enrollment.assessmentResults.find(r => r.lessonId === lessonId);
        if (!assessmentResult) return res.status(404).json({ success: false, message: 'Assessment submission not found' });

        if (assessmentResult.status !== 'failed') {
            return res.status(400).json({ success: false, message: 'Can only appeal failed assessments' });
        }

        if (assessmentResult.appeal && assessmentResult.appeal.status === 'pending') {
            return res.status(400).json({ success: false, message: 'Appeal already pending' });
        }

        assessmentResult.appeal = {
            status: 'pending',
            reason,
            date: new Date()
        };

        await course.save();
        res.json({ success: true, data: assessmentResult.appeal });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Admin/Trainer action on assessment appeal
// @route   PUT /api/courses/:id/assessment/:lessonId/appeal/:userId
// @access  Private (Trainer/Admin)
router.put('/:id/assessment/:lessonId/appeal/:userId', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { status, comment } = req.body;
        const { id, lessonId, userId } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        if (req.user.role === 'trainer' && course.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const enrollment = course.enrollments.find(e => e.userId.toString() === userId);
        if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

        const assessmentResult = enrollment.assessmentResults.find(r => r.lessonId === lessonId);
        if (!assessmentResult) return res.status(404).json({ success: false, message: 'Assessment result not found' });

        assessmentResult.appeal.status = status;
        assessmentResult.appeal.comment = comment;
        assessmentResult.appeal.reviewedBy = req.user.id;
        assessmentResult.appeal.reviewedAt = new Date();

        // If approved, maybe allow re-submission by changing status?
        if (status === 'approved') {
            assessmentResult.status = 'approved_for_resubmission';
        }

        await course.save();

        // Send notification to learner
        const { createNotification } = require('./notifications');
        try {
            await createNotification(
                enrollment.userId,
                'appeal_update',
                `Appeal Status Update: ${course.title}`,
                `Your appeal for assessment "${lessonId}" in course "${course.title}" has been ${status}. ${comment ? `Comment: ${comment}` : ''}`,
                `/courses/${course._id}`
            );

            // Send Email
            const user = await User.findById(userId);
            if (user) {
                let lessonTitle = lessonId;
                course.modules.forEach(m => {
                    const l = m.lessons.find(l => l._id.toString() === lessonId);
                    if (l) lessonTitle = l.title;
                });

                await sendNotificationEmail(user, 'appeal_update', {
                    courseName: course.title,
                    lessonTitle: lessonTitle,
                    status: status,
                    comment: comment
                });
            }
        } catch (err) {
            console.error('Failed to send assessment appeal notification:', err);
        }
        res.json({ success: true, data: assessmentResult.appeal });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get all assessment submissions for management
// @route   GET /api/courses/assessments/manage
// @access  Private (Trainer/Admin)
router.get('/assessments/manage', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const courses = await Course.find(
            req.user.role === 'trainer' ? { createdBy: req.user.id } : {}
        ).populate('enrollments.userId', 'name email');

        const allSubmissions = [];
        courses.forEach(course => {
            course.enrollments.forEach(enrollment => {
                enrollment.assessmentResults.forEach(result => {
                    allSubmissions.push({
                        courseId: course._id,
                        courseTitle: course.title,
                        userId: enrollment.userId._id,
                        userName: enrollment.userId.name,
                        userEmail: enrollment.userId.email,
                        lessonId: result.lessonId,
                        submissionFile: result.submissionFile,
                        score: result.score,
                        status: result.status,
                        feedback: result.feedback,
                        date: result.submissionDate || result.date,
                        appeal: result.appeal
                    });
                });
            });
        });

        // Sort by date desc
        allSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: allSubmissions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get current user's assessments
// @route   GET /api/courses/assessments/my
// @access  Private (Learner)
router.get('/assessments/my', protect, authorize('learner'), async (req, res) => {
    try {
        const courses = await Course.find({ 'enrollments.userId': req.user.id });
        const allSubmissions = [];
        courses.forEach(course => {
            const enrollment = course.enrollments.find(e => e.userId.toString() === req.user.id);
            if (enrollment && enrollment.assessmentResults) {
                enrollment.assessmentResults.forEach(result => {
                    allSubmissions.push({
                        courseId: course._id,
                        courseTitle: course.title,
                        lessonId: result.lessonId,
                        submissionFile: result.submissionFile,
                        score: result.score,
                        status: result.status,
                        feedback: result.feedback,
                        date: result.submissionDate || result.date,
                        appeal: result.appeal
                    });
                });
            }
        });

        // Sort by date desc
        allSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: allSubmissions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Unenroll from course
// @route   DELETE /api/courses/:id/enroll
// @access  Private (Learners only)
router.delete('/:id/enroll', protect, authorize('learner'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const enrollmentIndex = course.enrollments.findIndex(
            e => e.userId.toString() === req.user.id
        );

        if (enrollmentIndex === -1) {
            return res.status(400).json({ success: false, message: 'Not enrolled in this course' });
        }

        const enrollment = course.enrollments[enrollmentIndex];

        // Prevent unenroll if course is completed
        if (enrollment.completed || enrollment.progress >= 100) {
            return res.status(400).json({ success: false, message: 'Cannot unenroll from a completed course' });
        }

        // Prevent unenroll if course is mandatory
        if (enrollment.isMandatory) {
            return res.status(400).json({ success: false, message: 'Cannot unenroll from a mandatory course' });
        }

        course.enrollments.splice(enrollmentIndex, 1);
        await course.save();

        res.status(200).json({ success: true, message: 'Unenrolled successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
