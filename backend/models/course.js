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
        enum: ['video', 'document', 'link', 'text', 'quiz'],
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
    }
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
