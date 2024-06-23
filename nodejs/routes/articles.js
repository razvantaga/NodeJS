const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// bring in article model
let Article = require('../models/article');

// bring in user model
let User = require('../models/user');

// add route
router.get('/add', ensureAuthenticated, function(req, res) {
    res.render('add_article', {
        title: 'Add Article'
    });
});

// add submit POST route
router.post('/add', [
    body('title').notEmpty().withMessage('Title is required'),
    // body('author').notEmpty().withMessage('Author is required'),
    body('body').notEmpty().withMessage('Body is required')
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        res.render('add_article', {
            title: 'Add Article',
            errors: validationErrors
        });
    } else {
        let article = new Article({
            title: req.body.title,
            author: req.user._id,
            body: req.body.body
        });
        try {
            await article.save();
            req.flash('success', 'Article Added');
            res.redirect('/');
        } catch (err) {
            console.log(err);
            res.status(500).send('Server Error');
        }
    }
});

// load edit form
router.get('/edit/:id', ensureAuthenticated, async function(req, res) {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send('Article not found');
        }
        
        // Check authorization
        if (article.author.toString() !== req.user._id.toString()) {
            req.flash('danger', 'Not Authorized');
            return res.redirect('/');
        }
        
        res.render('edit_article', {
            title: 'Edit Article',
            article: article
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


// update submit post route
router.post('/edit/:id', [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('body').notEmpty().withMessage('Body is required')
], async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        try {
            const article = await Article.findById(req.params.id);
            res.render('edit_article', {
                title: 'Edit Article',
                article: article,
                errors: validationErrors
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        let articleId = req.params.id;
        let updatedArticle = {
            title: req.body.title,
            author: req.body.author,
            body: req.body.body
        };
        try {
            const result = await Article.findByIdAndUpdate(articleId, updatedArticle, { new: true });
            if (!result) {
                return res.status(404).send('Article not found');
            }
            req.flash('success', 'Article Updated');
            res.redirect('/');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

// delete article
router.delete('/:id', async function(req, res) {
    let articleId = req.params.id;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
        return res.status(500).send();
    }

    try {
        const article = await Article.findById(articleId);
        
        if (!article) {
            return res.status(404).send('Article not found');
        }

        // Check if the user is authorized to delete the article
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).send('Not Authorized');
        }

        const result = await Article.deleteOne({ _id: articleId });
        
        if (result.deletedCount === 0) {
            return res.status(404).send('Article not found');
        }

        res.send('Success');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// get single article
router.get('/:id', async function(req, res) {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send('Article not found');
        }

        const user = await User.findById(article.author);
        if (!user) {
            return res.status(404).send('Author not found');
        }

        res.render('article', {
            article: article,
            author: user.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// access control
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } else {
        req.flash('danger', 'Please login');
        res.redirect('/users/login');
    }
}

module.exports = router;