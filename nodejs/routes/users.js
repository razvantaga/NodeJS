const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

// bring in user model
let User = require('../models/user');

// register form
router.get('/register', function(req, res) {
    res.render('register');
});

// register process
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email is not valid'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('password2').notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
], async function(req, res){
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('register', {
            errors: errors.array()
        });
    }

    const { name, email, username, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        let newUser = new User({
            name,
            email,
            username,
            password: hash
        });

        await newUser.save();
        req.flash('success', 'You are now registered and can log in');
        res.redirect('/users/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// login form
router.get('/login', function(req, res){
    res.render('login');
});

// login process
router.post('/login', function(req, res, next){
    passport.authenticate('local', {
        successRedirect:'/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// logout 
router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You are logged out');
        res.redirect('/users/login');
    });
});


module.exports = router;
