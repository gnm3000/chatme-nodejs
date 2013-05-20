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



 app.get('/', function(req,res){

  if(req.isAuthenticated()){
    res.redirect('/talks');
    
  } else{


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

 }
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
app.get('/explore', function(req, res){
  if(req.isAuthenticated()){

var callback1 = function(db,items,members){
  db.collection("promotions",function(er,collection){
    collection.find().toArray(function(er,promotions){
        ;
        res.render('explore_nico', { 

            user:req.user,followers:items,users_online:members,promotions:promotions});
    });
    
  });
}

    mongo.Db.connect(mongoUri, function (err, db) {
      db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
      collection.find().toArray(function(err, items) {
        rClient.smembers("users_online",function(err,members){
          console.log("users_online_for_home:"+members);
          callback1(db,items,members);
          // res.render('explore_nico', { 
          //   user:req.user,followers:items,users_online:members});
        })


      });
    });
    });

    
  } else{
    res.redirect('/');
  }

  


});

app.get('/pagar-regalo', function(req,res){
  res.render('allopass', {});

});


app.get('/pagar-regalo/acceso', function(req,res){
  var code = req.query["code"];
  var trxid = req.query["trxid"];
  var transaction_id = req.query["transaction_id"];

  console.log(code+trxid);
  var callback1 = function(db,user){
    db.collection('promotions', function(er, collection) {
                                    collection.insert({username: user.username,picture:user.picture,code:code,transaction_id:transaction_id,start:new Date()}, {safe: true}, function(er,rs) {
                                        
                                        if(er){
                                          console.log("mongoDB"+er);
                                          //aca hay que hacer algo, como mandar un mail, o guardar en un log
                                        }
                                        console.log("redirect to explore");
                                        res.redirect("/explore");
                                    });
    });
  }
  //
  mongo.Db.connect(mongoUri, function (err, db) {

    db.collection('users',function(er,collection){
        collection.findOne({username:req.user.username},function(er,user){
          callback1(db,user);
        });
    });
      
    });
  //
      /*
      Aca se tiene que acreditar la promocion al usuario. */
      //res.render('allopass_acceso', {});
    });


app.get('/promote', function(req, res){
 if(req.isAuthenticated()){
  res.render('allopass', {});
} else{
  res.redirect('/');
}


});
app.get('/profile', function(req, res){
  if(req.isAuthenticated()){
   res.redirect("/"+req.user.username);
 } else{
  res.redirect('/');
}

});

app.get("/mongo",function(req,res){

  function insertElemento(collection,item){
    var criteria = {id:item.id};
    var picture = "https://graph.facebook.com/"+item.id+"/picture?width=140&height=140";

    var objNew = {'$set':{location: picture}};
    collection.update(criteria,objNew, {},function(er,rs) {
      if(er){console.log("mongoDB"+er);res.send("Error:"+er,400)}
      console.log("se hizo update en:"+item.displayName);
                                        //res.send("OK",200);
                                      });
  }

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
    console.log("mongoDB");
    collection.find().toArray(function(err, items) {
      items.forEach(function(el,index){
        if(typeof(el.location)=="undefined"){
          console.log("Es undefined,"+el.displayName);
                                       // insertElemento(collection,el);
                                     }else{

                                      console.log("No es undefined");
                                    }
                                  });
    });
  });

  });
});

app.get('/friends', function(req, res){

  


  if(req.isAuthenticated()){

    mongo.Db.connect(mongoUri, function (err, db) {
      db.collection('followers', function(er, followers_collection) {
        followers_collection.findOne({user:req.user.username},function(err,followers){
          if(err){
            console.log(err);

          }
          console.log("los amigos de "+followers.user+" son "+followers.follow);
                                                    //return followers.follow;
                                                      //
                                                      db.collection('users', function(er, collection) {
                                                        var condition = {username: {'$in':followers.follow}};
                                                        collection.find(condition).toArray(function(err, items_users) {
                                                          //return items;
                                                                //BEGIN
                                                                //console.log(items_users);
                                                                rClient.smembers("users_online",function(err,members){
                                                                  console.log("users_online_for_home:"+members);
                                                                      //var items = ;
                                                                      res.render('friends_nico', {user:req.user,followers:items_users,users_online:members});
                                                                    });
                                                                //END 

                                                              });


                                                      });
                                                      //
                                                    //followers.follow
                                                  });

});
});










} else{
  res.redirect('/');
}

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
app.get('/getGEONAMES', function(req, res) {

  res.json([
   "John",
   "Jane",
   "Alfredo",
   "Giovanni",
   "Superman"
   ]);
});
app.get('/channel', function(req, res) {
  res.render('channel', {});
});
app.post('/post', function (req, res) {
    //req.session.user = .user;

    mongo.Db.connect(mongoUri, function (err, db) {
      db.collection('users', function(er, collection) {
        var criteria = {username:req.body.pk};

        var objNew = '';
        if(req.body.name=="intereses_select2"){
                                      // aca hay que eliminar el interes undefined
                                      var intereses_lista = req.body.value;
                                      var intereses_lista_new =[];
                                      intereses_lista.forEach(function(p){
                                        if(p!='undefined'){
                                          intereses_lista_new.push(p);
                                        }
                                      });
                                      objNew = {'$set':{intereses: intereses_lista_new}};
                                    }
                                    if(req.body.name=="displayName"){
                                     objNew = {'$set':{displayName: req.body.value}};
                                   }
                                   if(req.body.name=="age"){
                                     objNew = {'$set':{birthday: req.body.value}};
                                   }
                                   console.log(JSON.stringify(criteria)+"|"+JSON.stringify(objNew));
                                   collection.update(criteria,objNew, {},function(er,rs) {
                                    if(er){console.log("mongoDB"+er);res.send("Error:"+er,400)}
                                    console.log("fin del socket");
                                    res.send("OK",200);
                                  });

                                 });
});

    //res.json(req.body.value);
  });
app.post('/post_username', function (req, res) {
    //req.session.user = .user;
    res.send("The function is not implemented",400);
    //res.json({"errors": {"username": "username already exist"} });
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
  console.log("user_anon post="+req.session.user_anon);
  res.json({"error": ""});
});
 function include(arr, obj) {
  for(var i=0; i<arr.length; i++) {
    if (arr[i] == obj) return true;
  }
  return false;
}




app.get('/:nick', function (req, res) {
    //save user from previous session (if it exists)
    var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
    // if(!req.cookies.nick){
         //var nick_rand = "user-"+Math.floor((Math.random()*10000)+1);
    //      res.cookie('nick', nick_rand, {maxAge: 900000, httpOnly: true});
    // }
    if(!req.session.user_anon || req.session.user_anon==req.params.nick){
      req.session.user_anon="user-"+Math.floor((Math.random()*10000)+1);
    }

    if(req.user){
      var user_logged =req.user.username;
      var user_logged_id =req.user.id;
    } else{
      var user_logged ='';
      var user_logged_id ='';
    }

    var user_anon = req.session.user_anon;
    var follower = false;
    //regenerate new session & store user from previous session (if it exists)
    //req.session.regenerate(function (err) {

      /*
     
      */
      req.session.user_anon = user_anon;
      console.log("el user_anon en /:nick es:"+req.session.user_anon);
      mongo.Db.connect(mongoUri, function (err, db) {
        db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
collection.findOne({username:req.params.nick},function(err,doc){
  if(!doc){
    res.send("UPs! el usuario no se encuentra <a href='/'>Volver a Chatme.fm</a>");}
    else{

      if(req.user){
        console.log("yo soy user logueado:"+req.user.username);
                                        //si el usuario esta logueado hay que mirar si es follower.
                                        db.collection('followers', function(er, followers_collection) {
                                          console.log("Busco a que usuarios le sigue el usuario:"+req.user.username);
                                          followers_collection.findOne({user:req.user.username},function(err,followers){
                                            if(err){
                                              console.log(err);

                                            }else{
                                              var follower=false;
                                              if(followers){
                                                console.log("el usuario "+req.user.username+" le sigue a:"+followers.follow);
                                                var follower = include(followers.follow,req.params.nick);
                                                console.log("el usuario "+req.user.username+" es seguidor de "+doc.username+"?="+follower);

                                              }


                                                        //no es seguidor
                                                        //console.log("follower=false"+req.user.username);
                                                        //var follower = false;
                                                        //req.params.nick
                                                        
                                                        rClient.smembers("users_online",function(err,members){
                                                          if(err){console.log("error users_online"+err);}
                                                          if(members.indexOf(req.params.nick) != -1){

                                                            console.log("encontrado");
                                                            var user_online = true;
                                                          }else{
                                                            var user_online = false;
                                                          }
                                                          console.log("VARIABLE USER_ONLINE para "+req.params.nick+"="+user_online);

                                                          res.render('anonimo_nico', { title:'Chat anonimo con '+req.params.nick, 
                                                            server:serverName, user:user_anon,user_anon:req.session.user_anon, fb_user:doc
                                                            ,nick:req.params.nick,user_logged:user_logged,follower:follower,user_online:user_online});
                                                        });





}
});

});
                                      //});

}else{

  rClient.smembers("users_online",function(err,members){
    if(err){console.log("error users_online"+err);}
    if(members.indexOf(req.params.nick) != -1){

      console.log("encontrado");
      var user_online = true;
    }else{
      var user_online = false;
    }
    console.log("VARIABLE USER_ONLINE para "+req.params.nick+"="+user_online);

    res.render('anonimo_nico', { title:'Chat anonimo con '+req.params.nick, 
      server:serverName, user:user_anon,user_anon:req.session.user_anon, fb_user:doc
      ,nick:req.params.nick,user_logged:user_logged,follower:false,user_online:user_online});
  });



}


}

})
                                  }); //mongo connect cerrado
});


   // });

});