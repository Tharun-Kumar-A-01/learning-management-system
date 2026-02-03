const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // Seed Super Admin
        const User = require('./models/user');
        const superAdminExists = await User.findOne({ role: 'super_admin' });

        if (!superAdminExists) {
            await User.create({
                name: 'Super Admin',
                email: 'super_admin@lms.com',
                password: 'ADMIN123', // Will be hashed by pre-save hook
                role: 'super_admin'
            });
            console.log('Default super admin created: super_admin@lms.com');
        }

        // Initialize deadline reminder scheduler
        require('./utils/deadlineScheduler');
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/courses', require('./routes/course'));
app.use('/api/users', require('./routes/users'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/learning-policies', require('./routes/learningPolicies'));
app.use('/api/site-settings', require('./routes/siteSettings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/backup', require('./routes/backup'));

app.get('/', (req, res) => {
    res.send('LMS API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
