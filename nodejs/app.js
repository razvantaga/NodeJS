const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const port = 3001;
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database')

// connect to database
const mongoose = require('mongoose');
mongoose.connect(config.database, { });

// check connection
let db = mongoose.connection;
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// check for db errors
db.on('error', function(err) {
    console.log(err);
});

// init App
const app = express();

// bring in Model
let Article = require('./models/article');

// load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','pug');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// set public folder
app.use(express.static(path.join(__dirname, 'public')));

// express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secret: true }
}));

// express messages middleware
app.use(flash());
app.use(function(req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

//passport config
require('./config/passport')(passport);
// passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
});

// Home route
app.get('/', async (req, res) => {
    try {
        const articles = await Article.find({});
        res.render('index', {
            title: 'Articles',
            articles: articles
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// route file
let articles = require('./routes/articles');
app.use('/articles', articles);
let users = require('./routes/users');
app.use('/users', users);

// Start server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
