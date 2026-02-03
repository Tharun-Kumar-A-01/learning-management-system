const nodemailer = require('nodemailer');

// Create reusable transporter object using GMAIL
const createTransporter = () => {
    // Gmail configuration is required
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
};

/**
 * Send an email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('Email not configured - skipping email send');
            return false;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.GMAIL_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.to}: ${options.subject}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
};

/**
 * Send notification email for various events
 * @param {Object} user - User object with email
 * @param {string} type - Notification type
 * @param {Object} data - Additional data for the notification
 */
const sendNotificationEmail = async (user, type, data) => {
    // Check if user has email alerts enabled
    if (!user.emailAlertsEnabled) {
        return false;
    }

    let subject = '';
    let text = '';

    switch (type) {
        case 'enrollment':
            subject = `You've been enrolled in: ${data.courseName}`;
            text = `Hello ${user.name},\n\nYou have been enrolled in the course "${data.courseName}".`;
            if (data.deadline) {
                text += `\n\nDeadline: ${new Date(data.deadline).toLocaleDateString()}`;
            }
            if (data.isMandatory) {
                text += '\n\nThis is a mandatory course.';
            }
            text += '\n\nLog in to start learning!';
            break;

        case 'deadline':
            subject = `Deadline Reminder: ${data.courseName}`;
            text = `Hello ${user.name},\n\nThis is a reminder that your course "${data.courseName}" has a deadline on ${new Date(data.deadline).toLocaleDateString()}.\n\nPlease complete the course before the deadline.`;
            break;

        case 'appeal_update':
            subject = `Appeal ${data.status}: ${data.courseName}`;
            text = `Hello ${user.name},\n\nYour appeal for "${data.lessonTitle}" in course "${data.courseName}" has been ${data.status}.\n\n${data.comment ? 'Comment: ' + data.comment : ''}`;
            break;

        case 'grading':
            subject = `Assessment Graded: ${data.courseName}`;
            text = `Hello ${user.name},\n\nYour assessment for "${data.lessonTitle}" in course "${data.courseName}" has been graded.\n\nScore: ${data.score}%\nStatus: ${data.passed ? 'Passed' : 'Failed'}\n\n${data.feedback ? 'Feedback: ' + data.feedback : ''}`;
            break;

        case 'submission':
            subject = `New Submission: ${data.courseName}`;
            text = `Hello ${user.name},\n\nA new assessment submission has been received from ${data.studentName} for "${data.lessonTitle}" in course "${data.courseName}".\n\nPlease review and grade the submission.`;
            break;

        default:
            subject = data.title || 'LMS Notification';
            text = data.message || 'You have a new notification.';
    }

    return await sendEmail({
        to: user.email,
        subject,
        text
    });
};

module.exports = {
    sendEmail,
    sendNotificationEmail
};
