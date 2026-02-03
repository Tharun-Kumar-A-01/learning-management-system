/**
 * Deadline Reminder Scheduler
 * Runs hourly to check for enrollments with approaching deadlines
 * and sends reminders at 3 days and 1 day before deadline
 */

const cron = require('node-cron');
const Course = require('../models/course');
const User = require('../models/user');
const { createNotification } = require('../routes/notifications');

/**
 * Check and send deadline reminders
 */
const checkDeadlineReminders = async () => {
    console.log('[Deadline Scheduler] Running deadline reminder check...');

    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Find all courses with enrollments that have deadlines
        const courses = await Course.find({
            'enrollments.deadline': { $exists: true, $ne: null }
        });

        let remindersSent = 0;

        for (const course of courses) {
            for (const enrollment of course.enrollments) {
                // Skip if no deadline or already completed
                if (!enrollment.deadline || enrollment.completed || enrollment.progress >= 100) {
                    continue;
                }

                const deadline = new Date(enrollment.deadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

                // Initialize remindersSent if not exists
                if (!enrollment.remindersSent) {
                    enrollment.remindersSent = [];
                }

                let shouldSendReminder = false;
                let reminderType = null;

                // Check for 3-day reminder
                if (daysUntilDeadline <= 3 && daysUntilDeadline > 1 && !enrollment.remindersSent.includes('3day')) {
                    shouldSendReminder = true;
                    reminderType = '3day';
                }
                // Check for 1-day reminder  
                else if (daysUntilDeadline <= 1 && daysUntilDeadline >= 0 && !enrollment.remindersSent.includes('1day')) {
                    shouldSendReminder = true;
                    reminderType = '1day';
                }

                if (shouldSendReminder && reminderType) {
                    try {
                        const user = await User.findById(enrollment.userId);
                        if (!user) continue;

                        const daysText = daysUntilDeadline <= 1 ? 'tomorrow' : `in ${daysUntilDeadline} days`;
                        const urgency = reminderType === '1day' ? 'URGENT: ' : 'Reminder: ';

                        // Send inbox notification with email data for proper email formatting
                        await createNotification(
                            enrollment.userId,
                            'deadline',
                            `${urgency}Course deadline ${daysText}`,
                            `Your course "${course.title}" has a deadline ${daysText} (${deadline.toLocaleDateString()}). Please complete it before the deadline.`,
                            `/courses/${course._id}`,
                            { courseName: course.title, deadline: deadline } // emailData for proper email
                        );

                        // Mark reminder as sent
                        enrollment.remindersSent.push(reminderType);
                        remindersSent++;

                        console.log(`[Deadline Scheduler] Sent ${reminderType} reminder to ${user.email} for "${course.title}"`);
                    } catch (err) {
                        console.error(`[Deadline Scheduler] Error sending reminder:`, err.message);
                    }
                }
            }

            // Save course if any reminders were marked as sent
            if (remindersSent > 0) {
                await course.save();
            }
        }

        console.log(`[Deadline Scheduler] Check complete. ${remindersSent} reminders sent.`);
    } catch (err) {
        console.error('[Deadline Scheduler] Error:', err.message);
    }
};

// Schedule to run every minute
cron.schedule('* * * * *', () => {
    checkDeadlineReminders();
});

// Also run immediately on server start (after a short delay)
setTimeout(() => {
    checkDeadlineReminders();
}, 5000);

console.log('[Deadline Scheduler] Initialized - running every minute');

module.exports = { checkDeadlineReminders };
