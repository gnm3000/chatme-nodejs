var arrayNames = {};
$(document).ready(function () {
  var user = $("#user").text();
  var name = user;
  /*primero conecto la socket*/
  /*
         Connect to socket.io on the server.
         */
          var host = window.location.host.split(':')[0];
         self.options = {
        'secure':                    false,
        'connect timeout':           5000,
        'try multiple transports':   true,
        'reconnect':                 true,
        'reconnection delay':        500,
        'reopen delay':              3000,
        'max reconnection attempts': 10,
        'sync disconnect on unload': true,
        'auto connect':              true,
        'remember transport':        false,
        'transports': ['xhr-polling']
    };

        var socket = io.connect('http://' + host, self.options);

        var intervalID;
        var reconnectCount = 0;
             socket.on('connect', function () {
            console.log('connected');
            //alert("connected");
        });
        socket.on('connecting', function () {
            console.log('connecting');
        });
     
                       function procesarUsuario(mensaje)
                            {
                                //Esta función se ejecuta cuando el servidor nos avisa
                                //que alguien se conectó
                                //Limpiamos el div de usuarios
                                $('#users').html(""); 
                                $("#users").append("<h3>Usuarios Online:</h3>");
                                //Colocamos de nuevo los usuarios
                                console.log("usuario desconectado:"+JSON.stringify(mensaje));
                                for (i in mensaje[1])
                                {
                                    $('#users').append($('<span>').html( mensaje[1][i]));
                                    arrayNames[i] = mensaje[1][i];
                                }
                            }
        socket.on("mensaje",procesarUsuario);
        function procesarUsuarios(data)
            {
                //Esta función se ejecuta cuando el servidor nos
                //avisa que alguien se desconectó
                $('#users').html("");
                $("#users").append("<h3>Usuarios Online:</h3>");
                for (i in data[0])
                {
                    $('#users').append($('<span>').html(data[0][i]));
                    arrayNames[i] = data[0][i];
                }
            }
        socket.on("usuarioDesconectado",procesarUsuarios);
   socket.on('disconnect', function () {
            console.log('disconnect');
            intervalID = setInterval(tryReconnect, 5000);
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
        socket.on('set_status', function (data) {
            var data = JSON.parse(data);

            console.log('set_status'+data.username+".Status:"+data.status);
        });

                    $("select").change(function () {
              var str = $("select option:selected").val();
             
               socket.emit("set_status",{status:str});
            })
            .trigger('change');
       

        var tryReconnect = function () {
            ++reconnectCount;
            if (reconnectCount == 3) {
                clearInterval(intervalID);

            }
            console.log('Making a dummy http call to set jsessionid (before we do socket.io reconnect)');
            //$.ajax('/')
            $.post('/user', {"user":name})
                .success(function () {
                    console.log("http request succeeded");
                    //reconnect the socket AFTER we got jsessionid set
                    socket.socket.reconnect();
                     console.log("MANDO JOIN:"+JSON.stringify({usuario:name,anon:0}));
                socket.emit('join', JSON.stringify({usuario:name,anon:0}));
                   
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
                console.log("MANDO JOIN:"+JSON.stringify({usuario:name,anon:0}));
                socket.emit('join', JSON.stringify({usuario:name,anon:0}));

            }).error(function () {
                console.log("error");
            });

        var container = $('div#msgs');
  /*
         When a message comes from the server, format, colorize it etc. and display in the chat widget
         */
        socket.on('chat', function (msg) {
            //console.log("MENSAJE CHAT ES:"+msg);
            var message = JSON.parse(msg);
            console.log("el action es:"+message.action);
            // si el mensaje es para mi o si yo lo escribi entonces que si lo muestre.
            if(message.chat_to==user || message.user==user ){
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

                {
                    messageView.find('.user').addClass('self');
            console.log("la que mando este mensaje es:"+user);
             //element_insert = $("div.panes div."+message.chat_to+" ul");
             element_insert = $("div.tab-pane[id="+message.chat_to+"]");
             element_insert.append(messageView.show());
            console.log("hace el append!!!"+messageView.show());
            //$("ul.tabs a."+message.chat_from).click();
            container.scrollTop(element_insert.innerHeight());
            return;
        }

            // append to container and scroll
            //cant_tabs_user = $("ul.tabs a."+message.chat_from).length;
            cant_tabs =  $("#myTab li").length;
            cant_tabs_user = $("div.tab-pane[id="+message.user+"]").length;
            if((cant_tabs_user == 0 && message.user!=user)){
                //entonces agrega un tab
                console.log("Entro al IFF!!");
                //var tabs = $("ul.tabs").tabs("div.panes > div");
                //agrego el tab
                //alert("message.chat_from="+message.user);
                //$("ul.tabs").append("<li><a class='"+message.chat_from+"' href='#'>"+message.chat_from+"</a></li>");
                $("#myTab").append("<li class='"+message.user+"'><a data-toggle='tab' class='"+message.user+"' href='#"+message.user+"'>"+message.user+"</a><span data-user='"+message.user+"' class='x_close'>X</span></li>");
                $("div.tab-content").append("<div class='tab-pane' id='"+message.user+"'>"+message.user+" </div>");
                //agrego un DIV - content del tab
                //$("div.panes").append("<div class='"+message.chat_from+"'><ul></ul></div>");
                //tabs.tabs( "refresh" );
                //$("ul.tabs").tabs("div.panes > div");

                if(cant_tabs==0){
                    $("#myTab a."+message.user).click();
                }
                
            }   else{
                console.log("no entro al iff. User:"+user+". message.chat_from:"+message.user+ ".cant_tabs_user:"+cant_tabs_user);
            }
            console.log("chat_from:"+message.user+". y user:"+user);
            
            //element_insert = $("div.panes div."+message.chat_from+" ul");
            element_insert = $("div.tab-pane[id="+message.user+"]");
           //alert("element_insert="+element_insert);
            element_insert.append(messageView.show());
            console.log("hace el append!!!"+messageView.show().html());
            //$("ul.tabs a."+message.chat_from).click();
            container.scrollTop(element_insert.innerHeight());

            if(!$("#myTab li."+message.user).hasClass("active")){
                $("#myTab a."+message.user).css("color","red");
                var beepOne = $("#beep-one")[0];
                beepOne.load();
                beepOne.play();
                console.log("PLAY SOUND");
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
            //actual_tab es el tab con el usuario seleccionado.
            actual_tab = $("#myTab li.active a").html();

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
            console.log(JSON.stringify({action:'message', msg:msg,usuario:user,anonimo:chat_to,anon:'0' }));
            socket.emit('chat', JSON.stringify({action:'message', msg:msg,usuario:user,anonimo:chat_to,anon:'0' }));
            input.val('');
        });
 
    $("#myTab").on('click','a',function(e){
    e.preventDefault();
    $(this).css("color","black");
    
    $("#message").attr("data-chat-to",$(this).html());
});
});

