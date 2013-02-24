/*
 * GET home page.
 */
var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';

exports.index = function (req, res) {
    //save user from previous session (if it exists)
    if(!req.cookies.nick){
         var nick_rand = "user-"+Math.floor((Math.random()*10000)+1);
         res.cookie('nick', nick_rand, {maxAge: 900000, httpOnly: true});
    }
    var user = req.session.user;
    //regenerate new session & store user from previous session (if it exists)
    req.session.regenerate(function (err) {
        req.session.user = user;
        res.render('index', { title:'Express', server:serverName, user:req.session.user, nick:''});
    });
};