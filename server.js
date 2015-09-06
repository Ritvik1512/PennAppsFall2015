
var PORT_NUMBER = process.env.PORT || 8888;

// DEPENDENCIES, NODE MODULE LOAD IN
// FOR PARSING AND AUTHORIZATION
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var methodOverride = require('method-override');
var flash = require('connect-flash');

// SWIG TEMPLATING ENGINE
var swig = require('swig');

// FOR OBJECT ORIENTATED MODELS 
var mongoose = require('mongoose');
var User = require('./models/user');

// FOR AUTHORIZATION OF LOCAL ACCOUNTS
var passport = require('passport');
var passportlocal = require('passport-local');
var LocalStrategy   = require('passport-local').Strategy;

// SOUNDCLOUD NODE MODULE
var SC = require('soundclouder');

// LINKING SECRET FILES FOR SOUNDCLOUD AUTH
var SCAuthInfo = require('./config/soundcloud');

SC.init(SCAuthInfo.CLIENT_ID, SCAuthInfo.CLIENT_SECRET, '/');

// ROUTING ENGINE
var express = require('express');
var app = express();


// LINKING MongoDB DATABASE INFO
var configDB = require('./config/database')

//CONFIGURATION
mongoose.connect(configDB.url); // connect to our database
app.engine('html', swig.renderFile);

app.set('port', PORT_NUMBER);
app.set('view engine', 'html');
app.use(morgan('combined'));
app.use('/bower_components',
        express.static(__dirname + '/bower_components'));
app.use('/static',
        express.static(__dirname + '/static'));

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(methodOverride());
app.use(session({secret: 'hello'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//ROUTING
app.get('/', function(request, response) {
  response.render('index.html', {user: request.user});
});

app.get('/profile', isLoggedIn, function(request, response) {
  response.render('profile.html', {user: request.user});
});

app.get('/login', function(request, response) {
  response.render('login.html', { message: request.flash('loginMessage')});
});

app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.get('/register', function(request, response) {
  response.render('register.html', { message: request.flash('signupMessage')});
})

app.post('/register', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/register', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.get('/sc', isLoggedIn, function(request, response) {
  response.render('sc.html');
})

app.get('/logout', isLoggedIn, function(request, response) {
  request.logout();
  response.redirect('/');
})

//METHODS
function isLoggedIn(request, response, next) {

    // if user is authenticated in the session, carry on
    if (request.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    response.render('register.html', { message: "You are not authorized to access that page." });
}

//SERVER LAUNCH
var server = require('http').Server(app);
server.listen(PORT_NUMBER, function() {
  console.log('Listening to port ' + PORT_NUMBER);
});