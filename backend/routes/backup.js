const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create database backup
// @route   POST /api/backup
// @access  Private (Super Admin only)
router.post('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../backups');

        // Create backups directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Generate filename with date and time
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backup = {
            createdAt: now.toISOString(),
            createdBy: req.user.id,
            collections: {}
        };

        // Export each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            backup.collections[collectionName] = data;
        }

        // Write backup to file
        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

        // Get file size
        const stats = fs.statSync(filepath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: {
                filename,
                path: filepath,
                size: `${fileSizeInMB} MB`,
                createdAt: now.toISOString(),
                collectionsCount: collections.length
            }
        });
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    List all backups
// @route   GET /api/backup
// @access  Private (Super Admin only)
router.get('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../backups');

        if (!fs.existsSync(backupDir)) {
            return res.status(200).json({ success: true, data: [] });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.json'))
            .map(filename => {
                const filepath = path.join(backupDir, filename);
                const stats = fs.statSync(filepath);
                return {
                    filename,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                    createdAt: stats.birthtime
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: files });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Download specific backup
// @route   GET /api/backup/:filename
// @access  Private (Super Admin only)
router.get('/:filename', protect, authorize('super_admin'), async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        const filepath = path.join(backupDir, req.params.filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        res.download(filepath);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Delete specific backup
// @route   DELETE /api/backup/:filename
// @access  Private (Super Admin only)
router.delete('/:filename', protect, authorize('super_admin'), async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        const filepath = path.join(backupDir, req.params.filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        fs.unlinkSync(filepath);

        res.status(200).json({ success: true, message: 'Backup deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
