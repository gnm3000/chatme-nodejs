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
        location.reload();
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
        socket.on('disconnect', function () {
            console.log('disconnect');
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
        $.post('/user', {"user":name})
            .success(function () {
                // send join message
                socket.emit('join', JSON.stringify({chat_to: "Nicolas"}));
            }).error(function () {
                console.log("error");
            });

        var container = $('div#msgs');

        /*
         When a message comes from the server, format, colorize it etc. and display in the chat widget
         */
        socket.on('chat', function (msg) {

            var message = JSON.parse(msg);
            // si el mensaje es para mi o si yo lo escribi entonces que si lo muestre.
            if(message.chat_to==user || message.chat_from==user ){
                             console.log("el chat_to es:"+message.chat_to+" y el user es: "+user);

                             
                        }else{
                            console.log("no era para mi");return;
                        }
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
            if (message.user == name) 

                {messageView.find('.user').addClass('self');
            console.log("la que mando este mensaje es:"+user);
             element_insert = $("div.panes div."+message.chat_to+" ul");
             element_insert.append(messageView.show());
            console.log("hace el append!!!"+messageView.show());
            //$("ul.tabs a."+message.chat_from).click();
            container.scrollTop(element_insert.innerHeight());
            return;
        }

            // append to container and scroll
            cant_tabs_user = $("ul.tabs a."+message.chat_from).length;
            if((cant_tabs_user == 0 && message.chat_from!=user)){
                //entonces agrega un tab
                console.log("Entro al IFF!!");
                //var tabs = $("ul.tabs").tabs("div.panes > div");
                $("ul.tabs").append("<li><a class='"+message.chat_from+"' href='#'>"+message.chat_from+"</a></li>");
                //agrego un DIV
                $("div.panes").append("<div class='"+message.chat_from+"'><ul></ul></div>");
                //tabs.tabs( "refresh" );
                $("ul.tabs").tabs("div.panes > div");
            }else{
                console.log("no entro al iff. User:"+user+". message.chat_from:"+message.chat_from+ ".cant_tabs_user:"+cant_tabs_user);
            }
            console.log("chat_to:"+message.chat_from+". y user:"+user);
            
            element_insert = $("div.panes div."+message.chat_from+" ul");
            element_insert.append(messageView.show());
            console.log("hace el append!!!"+messageView.show());
            //$("ul.tabs a."+message.chat_from).click();
            container.scrollTop(element_insert.innerHeight());
            if(!$("ul.tabs a."+message.chat_from).hasClass("current")){
                $("ul.tabs a."+message.chat_from).css("color","red");
            }
            
            //container.find('ul').append(messageView.show());
            //container.scrollTop(container.find('ul').innerHeight());





        });

        /*
         When the user creates a new chat message, send it to server via socket.emit w/ 'chat' event/channel name
         */
        $('#channel form').submit(function (event) {
            event.preventDefault();
            var input = $(this).find(':input');
            var msg = input.val();
            actual_tab = $("ul.tabs a.current").html();
            if(actual_tab!=null){
                //si hay un current seleccionado
                $("#message").attr("data-chat-to",actual_tab);
                }else{
                    //no hay ninguno current seleccionado
                    $("#message").attr("data-chat-to",'');
                }
            var chat_to = $("#message").attr("data-chat-to");
            console.log("manda el mensaje con el chat_to = "+chat_to);
            if(chat_to==''){ input.val('');return;}
            socket.emit('chat', JSON.stringify({action:'message', msg:msg,chat_to:chat_to,chat_from:user}));
            input.val('');
        });
        //
    }
    $("ul.tabs").on('click','a',function(e){
    e.preventDefault();
    $(this).css("color","black");
    $("#message").attr("data-chat-to",$(this).html());
});
});

