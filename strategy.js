
/*
 * Module dependencies
 */

var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy ,mongoUri = module.parent.exports.mongoUri
  , config = require('./config.json'),mongo = require('mongodb'),rest = require('restler');

/*var mongoUri = exports.mongoUri
 * Auth strategy
 */

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

if(config.auth.twitter.consumerkey.length) {
  passport.use(new TwitterStrategy({
      consumerKey: config.auth.twitter.consumerkey,
      consumerSecret: config.auth.twitter.consumersecret,
      callbackURL: config.auth.twitter.callback
    },
    function(token, tokenSecret, profile, done) {
      return done(null, profile);
    }
  ));
} 

if(config.auth.facebook.clientid.length) {
  passport.use(new FacebookStrategy({
      clientID: config.auth.facebook.clientid,
      clientSecret: config.auth.facebook.clientsecret,
      callbackURL: config.auth.facebook.callback
      //profileFields: ['id', 'displayName', 'cover','location','email']
    },
    function(accessToken, refreshToken, profile, done) {
      //aca tengo que guardar profile.
      rest.get('https://graph.facebook.com/me?fields=id,name,birthday,cover,location&access_token='+accessToken)
                                      .on('complete', function(data) {
                                        console.log("ID ES:"+JSON.stringify(data)); // auto convert to object
                                        profile.cover = data.cover.source;
                                        profile.location = data.location.name;

                                      });
      mongo.Db.connect(mongoUri, function (err, db) {
                                  db.collection('users', function(er, collection) {
                                    //me fijo si ya esta en la base de datos
                                  collection.findOne({email:profile._json.email},function(err,doc){
                                    if(doc){
                                      profile.nuevo = 0;
                                      console.log("profile nuevo 0");
                                    }else{

                                      

                                      
                                      collection.insert(profile, {safe: true}, function(er,rs) {
                                        console.log("mongoDB"+er);
                                      });
                                      profile.nuevo = 1;
                                      console.log("profile nuevo 1");
                                    }
                                    
                                     return done(null,profile);
                                  })
                                  });
                                });
      
      
      
      
    }
  ));
}
