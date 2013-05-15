/*
 * Module dependencies
 */

var app = module.parent.exports.app
    , http = require('http')
    , path = require('path')
    , redis = require('redis')
    ,mongo = require('mongodb')
    , amqp = require('amqp')
  , passport = require('passport')
, config = require('../config')
  , passport = require('passport')
  ,rest = require('restler')
  , config = require('../config.json'),
  mongoUri = module.parent.exports.mongoUri;
var rClient = module.parent.exports.rClient;
app.get('/*', function(req, res, next) {
  if (req.headers.host.match(/^www/) !== null ) {
    res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
  } else {
    next();     
  }
});


app.get('/pagar-regalo', function(req,res){

     res.render('allopass', {});
});
app.get('/pagar-regalo/acceso', function(req,res){

     res.render('allopass_acceso', {});
});
app.get('/', function(req,res){

if(req.isAuthenticated()){
  res.redirect('/talks');
    
  } 
  
     
         mongo.Db.connect(mongoUri, function (err, db) {
                                  db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
                                  collection.find().toArray(function(err, items) {
                                    rClient.smembers("users_online",function(err,members){
            console.log("users_online_for_home:"+members);
            res.render('index_nico', { title:'Express',
                                            user:'',users:items,users_online:members});
        })
                                         
                                 
                                    });
                                  });
                                });
        
   
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

/*
 * Authentication routes
 */

if(config.auth.twitter.consumerkey.length) {
  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: '/twitter/successRedirect',
      failureRedirect: '/twitter/failureRedirect'
    })
  );
}

if(config.auth.facebook.clientid.length) {
  app.get('/auth/facebook', passport.authenticate('facebook', { display: 'touch',scope: ['email', 'user_birthday','user_likes'] }));

  app.get('/auth/facebook/callback', 

    passport.authenticate('facebook', {
      successRedirect: '/auth/facebook/successRedirect',
      failureRedirect: '/auth/facebook/failureRedirect'
    })
  );

  app.get('/auth/facebook/successRedirect', 
    function(req,res){
      //res.send(req.user.nuevo+";cumpleanos:"+req.user._json.email);
      if(req.user.nuevo==1){
        //entonces le envio al perfil
        res.redirect('/profile');
      }else{
        //entonces le envio a conversaciones
         res.redirect('/talks');
      }

    });



}
app.get('/profile', function(req, res){
  //req.logout();
  //res.render('')
  res.send('profile-perfil donde puede editar');
});
app.get('/talks', function(req, res){
  if(req.isAuthenticated()){
    res.render("talks_nico",{user:req.user});
  } else{
    res.redirect('/');
  }
  //req.logout();
  //res.send(req.user.username);
  
  //res.send('talks-conversaciones');
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// app.get('/logout', function(req, res) {
//     req.session.destroy();
//     res.redirect('/');
// });
 
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