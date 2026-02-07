const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    grade: {
        type: Number
    }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
