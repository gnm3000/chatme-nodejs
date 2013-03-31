var express = require('express')
    
    , http = require('http')
    , path = require('path')
    , redis = require('redis')
    ,mongo = require('mongodb')
    , amqp = require('amqp');

var url_rabbit = process.env.CLOUDAMQP_URL || "amqp://localhost"; // default to localhost
var rabbitConn = amqp.createConnection({url: url_rabbit});
var chatExchange;
rabbitConn.on('ready', function () {
    chatExchange = rabbitConn.exchange('chatExchange', {'type': 'fanout'});
});
var mongoUri = 'mongodb://heroku_app12042861:clfom3dnopr5phrqi94n22kgd7@dbh75.mongolab.com:27757/heroku_app12042861'; 
/*
 Setup Express & Socket.io
 */
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

//Set xhr-polling as WebSocket is not supported by CF
io.set("transports", ["xhr-polling"]);

//Set Socket.io's log level to 1 (info). Default is 3 (debugging)
io.set('log level', 1);


/*
 Also use Redis for Session Store. Redis will keep all Express sessions in it.
 */
var RedisStore = require('connect-redis')(express);
if(process.env.REDISCLOUD_URL){
    var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
var rClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
rClient.auth(redisURL.auth.split(":")[1]);
}else{
    rClient = redis.createClient();
}

var sessionStore = new RedisStore({client: rClient});

var cookieParser = express.cookieParser('your secret here');

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    /*
     Use cookieParser and session middlewares together.
     By default Express/Connect app creates a cookie by name 'connect.sid'.But to scale Socket.io app,
     make sure to use cookie name 'jsessionid' (instead of connect.sid) use Cloud Foundry's 'Sticky Session' feature.
     W/o this, Socket.io won't work if you have more than 1 instance.
     If you are NOT running on Cloud Foundry, having cookie name 'jsessionid' doesn't hurt - it's just a cookie name.
     */
    app.use(cookieParser);
    app.use(express.session({store: sessionStore, key: 'jsessionid', secret: 'your secret here'}));

    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});
app.get('/*', function(req, res, next) {
  if (req.headers.host.match(/^www/) !== null ) {
    res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
  } else {
    next();     
  }
})
app.get('/', function(req,res){

    var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
 //save user from previous session (if it exists)
 if(req.query["request_ids"]){
    var request_ids = req.query["request_ids"];
}else{
    var request_ids = '';
}
    
    var user = req.session.user;
    //regenerate new session & store user from previous session (if it exists)
    //req.session.regenerate(function (err) {
        req.session.user = user;
         mongo.Db.connect(mongoUri, function (err, db) {
                                  db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
                                  collection.find().toArray(function(err, items) {
                                         res.render('index', { title:'Express', server:serverName, 
                                            user:req.session.user,users:items,request_ids:request_ids});
                                 
                                    });
                                  });
                                });
        
    //});
});
app.get('/nick/:nick', function (req, res) {
    //save user from previous session (if it exists)
    var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
    // if(!req.cookies.nick){
         //var nick_rand = "user-"+Math.floor((Math.random()*10000)+1);
    //      res.cookie('nick', nick_rand, {maxAge: 900000, httpOnly: true});
    // }
    if(!req.session.user_anon){
        req.session.user_anon="user-"+Math.floor((Math.random()*10000)+1);
    }
   
    

    var user_anon = req.session.user_anon;

    //regenerate new session & store user from previous session (if it exists)
    req.session.regenerate(function (err) {
        req.session.user_anon = user_anon;
                                 mongo.Db.connect(mongoUri, function (err, db) {
                                  db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
                                  collection.findOne({username:req.params.nick},function(err,doc){
                                    res.render('anonimo', { title:'Chat anonimo con '+req.params.nick, 
                                    server:serverName, user:user_anon, fb_user:doc
                                    ,nick:req.params.nick});
                                  })
                                  });
                                });
                                
        
    });
        
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});
 
app.get('/channel', function(req, res) {
    res.render('channel', {});
});

/*
 When the user logs in (in our case, does http POST w/ user name), store it
 in Express session (which in turn is stored in Redis)
 */
app.post('/user', function (req, res) {
    req.session.user = req.body.user;
    res.json({"error": ""});
});
app.post('/user_anon', function (req, res) {
    req.session.user_anon = req.body.user_anon;
    res.json({"error": ""});
});
/*
 Use SessionSockets so that we can exchange (set/get) user data b/w sockets and http sessions
 Pass 'jsessionid' (custom) cookie name that we are using to make use of Sticky sessions.
 */
var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');

sessionSockets.on('connection', function (err, socket, session) {
    /**
     * When a user sends a chat message, publish it to chatExchange w/o a Routing Key (Routing Key doesn't matter
     * because chatExchange is a 'fanout').
     *
     * Notice that we are getting user's name from session.
     */
     socket.on('disconnect', function (data) {
        console.log("el usuario se desconecto"+data);
     });
    socket.on('chat', function (data) {
        var msg = JSON.parse(data);
        if(msg.anon=='1'){chat_from = msg.chat_from;}else{chat_from=session.user;}
        var reply = {action: 'message', 
                    user: chat_from,
                    chat_form:chat_from, 
                    msg: msg.msg, 
                    chat_to:msg.chat_to };
        chatExchange.publish('', reply);
    });

    /**
     * When a user joins, publish it to chatExchange w/o Routing key (Routing doesn't matter
     * because chatExchange is a 'fanout').
     *
     * Note: that we are getting user's name from session.
     */
    socket.on('join', function (data) {
        var msg = JSON.parse(data);
         if(msg.anon=='1'){chat_from = msg.chat_from;}else{chat_from=session.user;}
        var reply = {action: 'control', user: chat_from, msg: ' joined the channel' };
        chatExchange.publish('', reply);
    });
/*para saber quien esta online*/
socket.on('notification_online', function (data) {
        var msg = JSON.parse(data);
        var user = msg.user;
         
        var reply = {action: 'notification_online', user: user };
        socket.broadcast.emit('notification_online', reply);
        //chatExchange.publish('', reply);
    });
    /**
     * Initialize subscriber queue.
     * 1. First create a queue w/o any name. This forces RabbitMQ to create new queue for every socket.io connection w/ a new random queue name.
     * 2. Then bind the queue to chatExchange  w/ "#" or "" 'Binding key' and listen to ALL messages
     * 3. Lastly, create a consumer (via .subscribe) that waits for messages from RabbitMQ. And when
     * a message comes, send it to the browser.
     *
     * Note: we are creating this w/in sessionSockets.on('connection'..) to create NEW queue for every connection
     */
    rabbitConn.queue('', {exclusive: true}, function (q) {
        //Bind to chatExchange w/ "#" or "" binding key to listen to all messages.
        q.bind('chatExchange', "");

        //Subscribe When a message comes, send it back to browser
        q.subscribe(function (message) {
            socket.emit('chat', JSON.stringify(message));
            console.log("mensaje:"+JSON.stringify(message));
        });
    });
});

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
