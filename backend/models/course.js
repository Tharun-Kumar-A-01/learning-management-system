const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['mcq', 'true_false'],
        default: 'mcq'
    },
    options: [String],
    correctAnswer: {
        type: Number, // Index of correct option
        default: 0
    },
    points: {
        type: Number,
        default: 1
    }
});

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Untitled Lesson'
    },
    type: {
        type: String,
        enum: ['video', 'document', 'link', 'text', 'quiz', 'assessment'],
        default: 'text'
    },
    content: {
        type: String // URL for video/document or text content
    },
    questions: [QuestionSchema], // For quiz type lessons
    duration: {
        type: Number, // in minutes
        default: 0
    },
    passingPercentage: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    maxAttempts: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    timeLimit: {
        type: Number,
        default: 0 // in minutes, 0 means no limit
    },
    order: {
        type: Number,
        default: 0
    }
});

const ModuleSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Untitled Module'
    },
    description: String,
    lessons: [LessonSchema],
    order: {
        type: Number,
        default: 0
    }
});

const EnrollmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedLessons: [{
        type: String // lesson IDs
    }],
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    certificateIssued: {
        type: Boolean,
        default: false
    },
    // Manual enrollment fields
    deadline: {
        type: Date,
        default: null
    },
    isMandatory: {
        type: Boolean,
        default: false
    },
    remindersSent: [{
        type: String,
        enum: ['3day', '1day']
    }],
    enrolledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    quizResults: [{
        lessonId: String,
        attempts: [{
            score: Number,
            totalPoints: Number,
            percentage: Number,
            passed: Boolean,
            date: { type: Date, default: Date.now }
        }],
        bestScore: {
            type: Number,
            default: 0
        },
        isPassed: {
            type: Boolean,
            default: false
        },
        appeal: {
            status: {
                type: String,
                enum: ['none', 'pending', 'approved', 'rejected'],
                default: 'none'
            },
            reason: String,
            date: { type: Date },
            reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: Date,
            comment: String
        }
    }],
    assessmentResults: [{
        lessonId: String,
        submissionFile: String, // Base64 PDF
        submissionDate: { type: Date, default: Date.now },
        score: Number,
        isPassed: { type: Boolean, default: false },
        feedback: String,
        status: {
            type: String,
            enum: ['submitted', 'graded', 'failed', 'passed'],
            default: 'submitted'
        },
        appeal: {
            status: {
                type: String,
                enum: ['none', 'pending', 'approved', 'rejected'],
                default: 'none'
            },
            reason: String,
            date: { type: Date },
            reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: Date,
            comment: String
        }
    }]
});

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    thumbnail: {
        type: String,
        default: null
    },
    category: {
        type: String,
        default: 'General'
    },
    tags: [String],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    duration: {
        type: Number, // Total duration in minutes
        default: 0
    },
    modules: [ModuleSchema],
    enrollments: [EnrollmentSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    certificateEnabled: {
        type: Boolean,
        default: true
    },
    recommendedArticles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
CourseSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// Calculate total duration from modules/lessons
CourseSchema.methods.calculateDuration = function () {
    let total = 0;
    this.modules.forEach(module => {
        module.lessons.forEach(lesson => {
            total += lesson.duration || 0;
        });
    });
    this.duration = total;
    return total;
};

// Get enrollment for a specific user
CourseSchema.methods.getEnrollment = function (userId) {
    return this.enrollments.find(e => e.userId.toString() === userId.toString());
};

// Virtual for total lessons count
CourseSchema.virtual('totalLessons').get(function () {
    let count = 0;
    this.modules.forEach(module => {
        count += module.lessons.length;
    });
    return count;
});

// Virtual for enrolled count
CourseSchema.virtual('enrolledCount').get(function () {
    return this.enrollments.length;
});

module.exports = mongoose.model('Course', CourseSchema);
