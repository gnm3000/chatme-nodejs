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


 function include(arr, obj) {
  for(var i=0; i<arr.length; i++) {
    if (arr[i] == obj) return true;
  }
  return false;
}

app.get('/chatme/css/files-:file', function(req,res){
  res.writeHead(200, {"Content-Type": "text/css"});
  if(req.params.file=="file1" || req.params.file=="file2"){
      mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('configuration', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
    collection.findOne({config:1},function(er,configuration){
      if(configuration){
        if(typeof(req.params.file)!="undefined" && req.params.file=="file1"){
          
          res.end(configuration.file1);
        }
        if(typeof(req.params.file)!="undefined" && req.params.file=="file2"){
          
          res.end(configuration.file2);
        }
         
        //res.send(configuration)
      }else{res.end("Error",200);}
    });
  });
  });

  }else{res.end("Error",200);}

});

app.get('/admin/users',function(req,res){


  var administrators = ["Martinez.German","gnm3000","josechatelet","Fran376","matias.brugnoli","elnicotorre"];
if(req.isAuthenticated() && include(administrators,req.user.username)){

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('users', function(er, collection) {
      collection.find().toArray(function(er,usuarios){
        res.render("admin_users",{usuarios:usuarios});
      });
      
    });
});
}
});
app.get('/admin', function(req,res){
var administrators = ["Martinez.German","gnm3000","josechatelet","Fran376","matias.brugnoli","elnicotorre"];
if(req.isAuthenticated() && include(administrators,req.user.username)){


var callback2 = function(items,db,configuration){

db.collection("promotions",function(er,collection){
  collection.find().toArray(function(er,promotions){
    res.render("admin",{users:items,configuration:configuration,promotions:promotions});
  });
});
  
}
var callback1 = function(items,db){

db.collection("configuration",function(er,collection){
collection.findOne({config:1},function(er,configuration){
   callback2(items,db,configuration);
});

});
         
}
mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
    collection.find().toArray(function(err, items) {
     
       callback1(items,db);
       
     


    });
  });
  });


}else{
  res.send("Acceso no permitido");
}


  
  
});
app.post('/post_config', function(req,res){
  
    //req.session.user = .user;
    //res.send("OK");
    mongo.Db.connect(mongoUri, function (err, db) {
      db.collection('configuration', function(er, collection) {
        var criteria = {config:1};

        var objNew = '';
        if(req.body.name=="users_vip"){
                                      // aca viene la lista de los vip
            var intereses_lista = req.body.value;
            var intereses_lista_new =[];
            intereses_lista.forEach(function(p){
              if(p!='undefined'){
                intereses_lista_new.push(p);
              }
            });
            objNew = {'$set':{users_vip: intereses_lista_new}};
          }


    if(req.body.name=="cantidad_horas"){
     objNew = {'$set':{cantidad_horas: req.body.value}};
   }
     if(req.body.name=="file1"){
     objNew = {'$set':{file1: req.body.value}};
   }
    if(req.body.name=="file2"){
     objNew = {'$set':{file2: req.body.value}};
   }                             
                                  console.log(JSON.stringify(criteria)+"|"+JSON.stringify(objNew));
                                   collection.update(criteria,objNew, {upsert:true},function(er,rs) {
                                    if(er){console.log("mongoDB"+er);res.send("Error:"+er,400)}
                                    console.log("fin del socket");
                                    //aca hay un callback, donde agregue a la lista a los usuarios.

                                    res.send("OK",200);
                                  });

                                 });
});

    //res.json(req.body.value);
  
});
 app.get('/', function(req,res){

  if(req.isAuthenticated()){
    res.redirect('/talks');
    
  } else{
function getRandomNumber(min,max){
  
// and the formula is:
var random = Math.floor(Math.random() * (max - min + 1)) + min;
 return random;
}
function getRandomArrayElements(arr, count) {
    var randoms = [], clone = arr.slice(0);
    for (var i = 0, index; i < count; ++i) {
        index = Math.floor(Math.random() * clone.length);
        randoms.push(clone[index]);
        clone[index] = clone.pop();
    }
    return randoms;
}
   mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
    collection.find().toArray(function(err, items) {
      rClient.smembers("users_online",function(err,members){
        console.log("users_online_for_home:"+members);
        var items_random = getRandomArrayElements(items,42);
        var number_random = getRandomNumber(1,6);
        res.render('index_nico', { title:'Express',
          user:'',users:items_random,users_online:members,number_random:number_random});
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

var conditions = [];
var sex_male = req.query["sex_male"];
var sex_female = req.query["sex_female"];
if((sex_female=='true' && sex_male=='true') || (sex_female=='false' && sex_male=='false') ){

}else{

if(sex_female=='true'){conditions.push({gender:'female'});}
if(sex_male=='true'){conditions.push({gender:'male'});}



}
var ciudad = req.query["ciudad"];
if(ciudad!=''){conditions.push({ciudad:ciudad})}

console.log("conditions="+JSON.stringify(conditions));
var edad = req.query["edad"];

//
//calcular la edad de una persona 
//recibe la fecha como un string en formato español 
//devuelve un entero con la edad. Devuelve false en caso de que la fecha sea incorrecta o mayor que el dia actual 
var calcular_edad = function(fecha){ 

    //calculo la fecha de hoy 
    hoy=new Date() 
    //alert(hoy) 

    //calculo la fecha que recibo 
    //La descompongo en un array 
    var array_fecha = fecha.split("/") 
    //si el array no tiene tres partes, la fecha es incorrecta 
    if (array_fecha.length!=3) 
         return false 

    //compruebo que los ano, mes, dia son correctos 
    var ano 
    ano = parseInt(array_fecha[2]); 
    if (isNaN(ano)) 
         return false 

    var mes 
    mes = parseInt(array_fecha[0]); 
    if (isNaN(mes)) 
         return false 

    var dia 
    dia = parseInt(array_fecha[1]); 
    if (isNaN(dia)) 
         return false 


    //si el año de la fecha que recibo solo tiene 2 cifras hay que cambiarlo a 4 
    if (ano<=99) 
         ano +=1900 

    //resto los años de las dos fechas 
    edad=hoy.getYear()- ano - 1; //-1 porque no se si ha cumplido años ya este año 

    //si resto los meses y me da menor que 0 entonces no ha cumplido años. Si da mayor si ha cumplido 
    if (hoy.getMonth() + 1 - mes < 0) //+ 1 porque los meses empiezan en 0 
         return edad 
    if (hoy.getMonth() + 1 - mes > 0) 
         return edad+1 

    //entonces es que eran iguales. miro los dias 
    //si resto los dias y me da menor que 0 entonces no ha cumplido años. Si da mayor o igual si ha cumplido 
    if (hoy.getUTCDate() - dia >= 0) 
         return edad + 1 

    return edad 
} 
//
//if(conditions.length==0){conditions=null};
conditions = {'$and':conditions};
console.log("conditions="+JSON.stringify(conditions));
var callback1 = function(db,items,members,configuration){
  db.collection("promotions",function(er,collection){

    var fechaInicial = new Date(); // 22 de Marzo del 2010 -  los meses comienzan a contar desde 0
    valorFecha = fechaInicial.valueOf(),  // 1269226800000
    valorFechaTermino = valorFecha -  ( 1 * configuration.cantidad_horas * 60 * 60 * 1000 ), // 1 antes, como milisegundos ( días * horas * minutos * segundos * milisegundos )
    //valorFechaTermino = valorFecha -  ( 1 * 1 * 1 * 60 * 1000 ),

    fechaTermino = new Date(valorFechaTermino) // nuevo objeto de fecha: 20 de mayo - Thu May 20 2010 23:00:00 GMT-0400 (CLT)
    console.log("la fecha entre "+fechaTermino+" y "+new Date());
    
    var start_filter = {"$gte": fechaTermino, "$lt": new Date()};
   // var username_filter = {};
    //{"username":username_filter}
    //var filters = {'$or':{[username:'$in':configuration.users_vip],[start:start_filter]}};
    var filters = {'$or':[{"username":{'$in':configuration.users_vip}},{"start":start_filter}]};
    console.log(JSON.stringify(filters));
    collection.find(filters).toArray(function(er,promotions){
        console.log("PROMO="+promotions);

        db.collection("users",function(er,collection){
          if(er!=null){console.log("error:"+er)}else{
            collection.findOne({username:req.user.username},function(er,user_obj){
              console.log("USUARIO="+JSON.stringify(user_obj));

              
                
                    if(!user_obj.follow){
                      //var follow = null;
                       res.render('explore_nico', {follow:null,user:req.user,users:items,users_online:members,promotions:promotions,user_obj:user_obj});
            
                    }else{
                      var follow = user_obj.follow;
                       res.render('explore_nico', {follow:follow,user:req.user,users:items,users_online:members,promotions:promotions,user_obj:user_obj});
            
                    }
              
                 
                
              
            

            });
          }
        });
       
    });
    
  });
}

    mongo.Db.connect(mongoUri, function (err, db) {
      db.collection('users', function(er, collection) {
                                    // collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
                                    //     console.log("mongoDB"+er);
                                    // });
      collection.find(conditions).toArray(function(err, items) {
        rClient.smembers("users_online",function(err,members){
          console.log("users_online_for_home:"+members);
          db.collection("configuration",function(er,collection){
            collection.findOne({config:1},function(er,configuration){
              callback1(db,items,members,configuration);
            });
          });


          
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
      var user = db.collection('users').findOne({username:req.user.username},function(er,user){
        console.log("USER ESSSSSS:"+user.username);

          db.collection('users', function(er, collection) {
            if(user.follow){
              var condition = {username: {'$in':user.follow}};
            }else{
              var condition = {username: {'$in':[]}};
            }
                                                        
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
      });
      
    });











} else{
  res.redirect('/');
}

});
/* Pantalla donde el usuario puede ver los regalos que puede hacer, y se le muestra el boton de allopass. para pagar, si paga, se le envia
a regalar/ok

*/
app.get('/regalar', function(req, res){
  if(req.isAuthenticated()){
    res.render("regalo_nico",{user:req.user});
  } else{
    res.redirect('/');
  }

});
/*pantalla donde se le informa que se acredito el pago, y que ahora puede regalar a los usuarios */
app.get('/regalar/ok', function(req, res){
  if(req.isAuthenticated()){
    res.render("regalo_nico_ok",{user:req.user});
  } else{
    res.redirect('/');
  }

});
app.get('/regalar/error', function(req, res){
  if(req.isAuthenticated()){
    res.render("regalo_nico",{user:req.user});
  } else{
    res.redirect('/');
  }

});

/*aca envia allopass informacion por GET sobre los pagos del producto*/
app.get('/regalar/notifications', function(req, res){

 res.send("OK",200);

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


app.get('/channel.html', function(req, res) {
  res.send('<script src="//connect.facebook.net/en_US/all.js"></script>',200);
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
                                      if(typeof(intereses_lista)=="undefined"){
                                        intereses_lista = [];
                                      }
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
   
                                          console.log("Busco a que usuarios le sigue el usuario:"+req.user.username);
                                          db.collection('users').findOne({username:req.user.username},function(err,usuario_logged){
                                            console.log("el usuario "+req.user.username+" le sigue a:"+usuario_logged.follow);
                                              var follower=false;
                                              if(usuario_logged.follow){
                                                console.log("el usuario "+req.user.username+" le sigue a:"+usuario_logged.follow);
                                                var follower = include(usuario_logged.follow,req.params.nick);
                                                console.log("el usuario "+req.user.username+" es seguidor de "+doc.username+"?="+follower);

                                              }
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