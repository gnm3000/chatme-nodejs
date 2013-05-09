
var app = module.parent.exports.app,
server = module.parent.exports.server
    , http = require('http')
    , path = require('path')
    , redis = require('redis')
    ,mongo = require('mongodb')
    , amqp = require('amqp')
  , passport = require('passport')
  , config = require('./config')
    , passport = require('passport')
  , config = require('./config.json');
var sessionStore = module.parent.exports.sessionStore;
var cookieParser = module.parent.exports.cookieParser;

var rClient2 = module.parent.exports.rClient2;
var rClient3 = module.parent.exports.rClient3;
//configuro los sockets para que functione en heroku
var io = require("socket.io").listen(server);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 20); 
  io.set("heartbeat timeout", 120);
  io.set("heartbeat interval", 25);
  //Set Socket.io's log level to 1 (info). Default is 3 (debugging)
  io.set('log level', 1);
});


/*
 Use SessionSockets so that we can exchange (set/get) user data b/w sockets and http sessions
 Pass 'jsessionid' (custom) cookie name that we are using to make use of Sticky sessions.
 */
var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');
 // rClient.get('onlineArray', function(error, result) {
 //            if (error) {
 //                rClient.set('onlineArray', JSON.stringify({}), function(error, result) {
 //                if (error) console.log('onlineArray-Error: ' + error);
 //                else console.log("guardado en redis.");
 //                    });
 //            }
 //            else {console.log('REDIS=Name: ' + JSON.stringify(result));}
 //        });
var sub = rClient2;
var pub = rClient3;
sub.subscribe('chat');
//JSON para controlar que no se repitan nombres
var usuariosConectados = {};
sessionSockets.on('connection', function (err, socket, session) {
    /**
     * When a user sends a chat message, publish it to chatExchange w/o a Routing Key (Routing Key doesn't matter
     * because chatExchange is a 'fanout').
     *
     * Notice that we are getting user's name from session.
     */
    
     socket.on('disconnect', function () 
        {
            //Eliminamos al usuario de lso conectados
            delete usuariosConectados[socket.nickname];
            //Creamos un arreglo con los usuarios y el que se eliminó
            data = [usuariosConectados,socket.nickname];
            console.log("disconnect-nodejs: "+data);
            //Mandamos la información a las Sockets
            socket.broadcast.emit("usuarioDesconectado",data);
           socket.emit("usuarioDesconectado",data);
             
        });
    socket.on('chat', function (data) {
        

        var msg = JSON.parse(data);
        if(msg.anon=='1'){chat_from = msg.chat_from;}else{chat_from=session.user;}
        var reply = {action: 'message', 
                    user: chat_from,
                    chat_form:chat_from, 
                    msg: msg.msg, 
                    
                    chat_to:msg.chat_to };
        //chatExchange.publish('', reply);
        pub.publish('chat', reply);
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
        socket.nickname = session.user;

        usuariosConectados[socket.nickname] = socket.nickname;
        console.log(socket.nickname);
        data = [socket.nickname,usuariosConectados];
         //Enviamos los datos de regreso a las sockets
         socket.broadcast.emit("mensaje",data);
         socket.emit("mensaje",data);
         pub.publish('chat', reply);
         //socket.sockets.emit("mensaje",data);
        //chatExchange.publish('', reply);
    });
sub.on('message', function (channel, message) {
        socket.emit(channel, message);
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
    // rabbitConn.queue('', {exclusive: true}, function (q) {
    //     //Bind to chatExchange w/ "#" or "" binding key to listen to all messages.
    //     q.bind('chatExchange', "");

    //     //Subscribe When a message comes, send it back to browser
    //     q.subscribe(function (message) {
    //         socket.emit('chat', JSON.stringify(message));
    //         console.log("mensaje:"+JSON.stringify(message));
    //     });
    // });
});