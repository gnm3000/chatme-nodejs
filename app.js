var options = {
  // time in ms when the event loop is considered blocked
  blockThreshold: 10
};
var nodefly = require('nodefly').profile(
    '6c2a8a36142a74532463a7f19454d715',
    [APPLICATION_NAME,'Heroku'],
    options // optional
);
var express = require('express')

    
    , http = require('http')
    , path = require('path')
    , redis = require('redis')
    ,mongo = require('mongodb')
    , amqp = require('amqp')
    , passport = require('passport')
  , config = require('./config.json');


var mongoUri = exports.mongoUri =  'mongodb://heroku_app12042861:clfom3dnopr5phrqi94n22kgd7@dbh75.mongolab.com:27757/heroku_app12042861'; 
/*
 Setup Express & Socket.io
 */
 var app = exports.app = express();
//var app = express();
var server = exports.server = http.createServer(app);


//var REDISCLOUD_URL = exports.REDISCLOUD_URL = "redis://rediscloud:5A4TCCPOGwU3K3vP@pub-redis-17092.us-east-1-4.3.ec2.garantiadata.com:17092";
//process.env.REDISCLOUD_URL = REDISCLOUD_URL;

/*
 Also use Redis for Session Store. Redis will keep all Express sessions in it.
 */
var RedisStore = require('connect-redis')(express);
if(process.env.REDISCLOUD_URL){
  console.log("USO REDISCLOUD_URL");
    var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
var rClient = exports.rClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
rClient.auth(redisURL.auth.split(":")[1]);
var rClient2 = exports.rClient2 = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
rClient2.auth(redisURL.auth.split(":")[1]);
var rClient3 = exports.rClient3= redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
rClient3.auth(redisURL.auth.split(":")[1]);
}else{
  console.log("NO USO REDISCLOUD_URL");
    rClient = exports.rClient = redis.createClient();
    rClient2 = exports.rClient2 = redis.createClient();
    rClient3 = exports.rClient3 = redis.createClient();
}

var sessionStore = exports.sessionStore =  new RedisStore({client: rClient});

 rClient.keys('sockets:users_online:*', function(err, keys) {
    if(keys.length) rClient.del(keys);
    console.log('Deletion of sockets reference for each user >> ', err || "Done!");
  });
 rClient.del("users_online",function(err,result){
    console.log('Deletion of set users_online >> ', err || "Done!");
 });
/*
 * Passportjs auth strategy
 */
require('./strategy');
var cookieParser = exports.cookieParser = express.cookieParser(config.session.secret);




app.configure(function () {
    app.set('port', process.env.PORT || 5000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
     app.use(express.static(path.join(__dirname, 'public')));
    app.use(cookieParser);
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    /*
     Use cookieParser and session middlewares together.
     By default Express/Connect app creates a cookie by name 'connect.sid'.But to scale Socket.io app,
     make sure to use cookie name 'jsessionid' (instead of connect.sid) use Cloud Foundry's 'Sticky Session' feature.
     W/o this, Socket.io won't work if you have more than 1 instance.
     If you are NOT running on Cloud Foundry, having cookie name 'jsessionid' doesn't hurt - it's just a cookie name.
     */
    

    app.use(express.session({
      store: sessionStore,
      cookie: {secure: false,maxAge: 86400000, expires : new Date(Date.now() + 86400000)},
     
      key: 'jsession_chatmefm_'+86400000, 
      secret: config.session.secret
    }));
    

    
    app.use(passport.initialize());
    app.use(passport.session());

   
    app.use(app.router);
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

/*
 * Routes
 */

require('./routes');

/*
 * Socket.io
 */

require('./sockets');



server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
