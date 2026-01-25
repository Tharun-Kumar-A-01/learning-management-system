const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const { protect, authorize } = require('../middleware/auth');

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
        const courses = await Course.find({
            'enrollments.userId': req.user.id
        }).populate('createdBy', 'name');

        const enrolledCourses = courses.map(course => {
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

        // Only include full enrollment data for trainers/admins
        if (req.user.role !== 'trainer' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            delete courseObj.enrollments;
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
            enrollment.progress = progress;
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

        course.enrollments.splice(enrollmentIndex, 1);
        await course.save();

        res.status(200).json({ success: true, message: 'Unenrolled successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
