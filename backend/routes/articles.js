const express = require('express');
const router = express.Router();
const Article = require('../models/article');
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all articles
// @route   GET /api/articles
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { category, tag, status, search, savedOnly } = req.query;
        let query = {};

        // Learners can only see published articles
        if (req.user.role === 'learner') {
            query.status = 'published';
        } else if (status) {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        if (tag) {
            query.tags = tag;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        let articles = await Article.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        // If savedOnly, filter to only saved articles
        if (savedOnly === 'true') {
            const user = await User.findById(req.user.id);
            const savedIds = user.savedArticles.map(id => id.toString());
            articles = articles.filter(a => savedIds.includes(a._id.toString()));
        }

        // Add isSaved flag for each article
        const user = await User.findById(req.user.id);
        const savedIds = user.savedArticles ? user.savedArticles.map(id => id.toString()) : [];

        const articlesWithSaved = articles.map(article => ({
            ...article.toObject(),
            isSaved: savedIds.includes(article._id.toString())
        }));

        res.status(200).json({ success: true, data: articlesWithSaved });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get single article
// @route   GET /api/articles/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('author', 'name email');

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Learners can only see published articles
        if (req.user.role === 'learner' && article.status !== 'published') {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Check if saved
        const user = await User.findById(req.user.id);
        const isSaved = user.savedArticles && user.savedArticles.some(id => id.toString() === article._id.toString());

        res.status(200).json({
            success: true,
            data: { ...article.toObject(), isSaved }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Create article
// @route   POST /api/articles
// @access  Private (Trainer, Admin, Super Admin)
router.post('/', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { title, content, category, tags, status } = req.body;

        const article = await Article.create({
            title,
            content,
            category: category || 'General',
            tags: tags || [],
            status: status || 'draft',
            author: req.user.id
        });

        res.status(201).json({ success: true, data: article });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private (Owner, Admin, Super Admin)
router.put('/:id', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        let article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Check ownership for trainers
        if (req.user.role === 'trainer' && article.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this article' });
        }

        article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('author', 'name');

        res.status(200).json({ success: true, data: article });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private (Owner, Admin, Super Admin)
router.delete('/:id', protect, authorize('trainer', 'admin', 'super_admin'), async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Check ownership for trainers
        if (req.user.role === 'trainer' && article.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this article' });
        }

        await article.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Toggle save article for later
// @route   PUT /api/articles/:id/save
// @access  Private
router.put('/:id/save', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const user = await User.findById(req.user.id);
        const savedIndex = user.savedArticles.findIndex(id => id.toString() === req.params.id);

        if (savedIndex > -1) {
            // Remove from saved
            user.savedArticles.splice(savedIndex, 1);
            await user.save();
            res.status(200).json({ success: true, message: 'Article removed from saved', isSaved: false });
        } else {
            // Add to saved
            user.savedArticles.push(req.params.id);
            await user.save();
            res.status(200).json({ success: true, message: 'Article saved', isSaved: true });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get all categories
// @route   GET /api/articles/meta/categories
// @access  Private
router.get('/meta/categories', protect, async (req, res) => {
    try {
        const categories = await Article.distinct('category');
        res.status(200).json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get all tags
// @route   GET /api/articles/meta/tags
// @access  Private
router.get('/meta/tags', protect, async (req, res) => {
    try {
        const tags = await Article.distinct('tags');
        res.status(200).json({ success: true, data: tags });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
