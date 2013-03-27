$(document).ready(function () {
    //Check if the user is rejoining
    //ps: This value is set by Express if browser session is still valid
    var user = $('#user').text();
    // show join box
    if (user === "") {
        $('#ask').show();
        $('#ask input').focus();
    } else { //rejoin using old session
        join(user);
    }

    // join on enter
    $('#ask input').keydown(function (event) {
        if (event.keyCode == 13) {
            $('#ask a').click();
        }
    });

    /*
     When the user joins, hide the join-field, display chat-widget and also call 'join' function that
     initializes Socket.io and the entire app.
     */
    $('#ask a').click(function () {
        join($('#ask input').val());
    });

    function join(name) {
        $('#ask').hide();
        $('#channel').show();
        $('input#message').focus();
        /*
         Connect to socket.io on the server.
         */
        var host = window.location.host.split(':')[0];
        var socket = io.connect('http://' + host, {reconnect:false, 'try multiple transports':false});
        var intervalID;
        var reconnectCount = 0;

        socket.on('connect', function () {
            console.log('connected');
        });
        socket.on('connecting', function () {
            console.log('connecting');
        });
        var intervalBangID;
        function_put_offline = function(){
                        var last_online = $("#last_online").val();
                        if(last_online==''){
                            console.log("NULO");
                        }else{
                            if((function_dateDiff(new Date,new Date(last_online))/1000)>30){
                                console.log("Es mayor a 30!!!!!!!");
                                $("#status").html("<span style='color:black'>OFFLINE</span>");

                            }else{
                                console.log("Es menor a 30");
                            }
                        }
                         //$("#status").html("<span style='color:black'>OFFLINE</span>");
        }
        /*Verificar cada 10 segundos si el last time es mayor a 30 segundos*/
         setInterval(function_put_offline,1000*10);                
        
         var function_dateDiff=function(date1,date2){
             return date1.getTime() - date2.getTime();
         }
        
        socket.on('notification_online', function (msg) {
            var mensaje = JSON.stringify(msg);
            var fb_username = $("#fb_user_name").html();
           // alert("mensaje"+msg.user+" el usuario:"+fb_username);
            if(msg.user==fb_username){
                $("#status").html("<span style='color:green'>ONLINE</span>");
                $("#last_online").val(new Date);
            }else{
               // $("#status").html("<span style='color:black'>OFFLINE</span>");
            }
            console.log("esta online:"+mensaje);

        });
        socket.on('disconnect', function () {
            console.log('disconnect');
            socket.emit('disconnect', JSON.stringify({action:'disconnect' }));
            intervalID = setInterval(tryReconnect, 4000);
        });
        socket.on('connect_failed', function () {
            console.log('connect_failed');
        });
        socket.on('error', function (err) {
            console.log('error: ' + err);
        });
        socket.on('reconnect_failed', function () {
            console.log('reconnect_failed');
        });
        socket.on('reconnect', function () {
            console.log('reconnected ');
        });
        socket.on('reconnecting', function () {
            console.log('reconnecting');
        });

        var tryReconnect = function () {
            ++reconnectCount;
            if (reconnectCount == 5) {
                clearInterval(intervalID);
            }
            console.log('Making a dummy http call to set jsessionid (before we do socket.io reconnect)');
            $.ajax('/')
                .success(function () {
                    console.log("http request succeeded");
                    //reconnect the socket AFTER we got jsessionid set
                    socket.socket.reconnect();
                    clearInterval(intervalID);
                }).error(function (err) {
                    console.log("http request failed (probably server not up yet)");
                });
        };

        /*
         When the user Logs in, send a HTTP POST to server w/ user name.
         */

        $.post('/user_anon', {"user_anon":name})
            .success(function () {
                // send join message
                socket.emit('join', JSON.stringify({chat_from:name,anon:"1"}));
            }).error(function () {
                console.log("error");
            });

        var container = $('div#msgs');

        /*
         When a message comes from the server, format, colorize it etc. and display in the chat widget
         */
        socket.on('chat', function (msg) {
            var message = JSON.parse(msg);
            if(message.chat_to==user || message.user==user){console.log("es para mi."+message.chat_to);}else{
                console.log("no es para mi."+message.chat_to);return;}
            var action = message.action;
            var struct = container.find('li.' + action + ':first');

            if (struct.length < 1) {
                console.log("Could not handle: " + message);
                return;
            }

            // get a new message view from struct template
            var messageView = struct.clone();

            // set time
            messageView.find('.time').text((new Date()).toString("HH:mm:ss"));

            switch (action) {
                case 'message':
                    var matches;
                    // someone starts chat with /me ...
                    if (matches = message.msg.match(/^\s*[\/\\]me\s(.*)/)) {
                        messageView.find('.user').text(message.user + ' ' + matches[1]);
                        messageView.find('.user').css('font-weight', 'bold');
                        // normal chat message
                    } else {
                        messageView.find('.user').text(message.user);
                        messageView.find('.message').text(': ' + message.msg);
                    }
                    break;
                case 'control':
                    messageView.find('.user').text(message.user);
                    messageView.find('.message').text(message.msg);
                    messageView.addClass('control');
                    break;
            }

            // color own user:
            if (message.user == name) {
                 messageView.find('.user').addClass('self');
                 messageView.find('.user').text("anonimo");
            }

            // append to container and scroll
            container.find('ul').append(messageView.show());
            container.scrollTop(container.find('ul').innerHeight());
        });

        /*
         When the user creates a new chat message, send it to server via socket.emit w/ 'chat' event/channel name
         */
        $('#channel form').submit(function (event) {
            event.preventDefault();
            var input = $(this).find(':input');
            var chat_to = input.attr("data-chat-to");
            var msg = input.val();
            console.log("envio el mensaje desde anonimo:"+JSON.stringify({action:'message', msg:msg,chat_to:chat_to,chat_from:user,anon:'1' }));
            socket.emit('chat', JSON.stringify({action:'message', msg:msg,chat_to:chat_to,chat_from:user,anon:'1' }));
            input.val('');
        });

    }
});