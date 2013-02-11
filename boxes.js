/************************** get Heroku port **********************************/
var port = process.env.PORT || 80;
/***************************  Require modules  ********************************/
var     sys = require('util'), 
        http = require('http'),
        express = require('express'),
        app = express(),
        server = http.createServer(app),
        io = require('socket.io').listen(server);
server.listen(port);
io.set('log level', 1);
//heroku code fix
io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});
//http requests:
app.use(express.static(__dirname));
sys.puts('starting boxes');
var clients = [];
var ballX = Math.round(Math.random() * 1200);
var ballY = Math.round(Math.random() * 800);
var ballR = 7;
var maxSpeed = 15;

/*************************  Start socket server  ******************************/
io.sockets.on('connection', function(client) {
    client.broadcast.emit('create', client.id);
    clients[client.id] = client;
    clients[client.id].score = 0;
    clients[client.id].x = -1;
    clients[client.id].y = -1;
    client.emit('id', client.id);
    client.emit('json', JSON.stringify({"action" : "ball", "ballX" : ballX, "ballY" : ballY, "ballR" : ballR})); 
        // You can also use socket.broadcast() to send to everyone.
        client.on('message', function(data) {
                // Do some stuff when you recieve a message
        //client.broadcast.emit(JSON.parse(data));
        data = JSON.parse(data);
        data.id = client.id;
        if(clients[data.id]==undefined || data['action'] == undefined)
            return;
        data.score = clients[data.id].score;
        if(data['action'] == 'load') {
            for(c in clients)
            {
                var _client = clients[c];
                client.emit('create',c);
                _client.emit('info','');
            }   
        } else if (data['action'] == 'move') {
            var c = clients[data.id];
            if(data.x == undefined || data.y == undefined)
                return;
            if(c.x != -1 && c.y != -1 && ((Math.abs(c.x - data.x) > maxSpeed + 1 && Math.abs(c.x - data.x) < 1200 - maxSpeed - 1) || (Math.abs(c.y - data.y) > maxSpeed + 1&& Math.abs(c.y - data.y) < 800 - maxSpeed - 1)))
            {
                sys.puts('illegal move ' + (c.x - data.x));
                client.broadcast.emit('delete', data.id);
                client.emit('hacking', data.id);
                delete clients[data.id];
            }
            else {
                c.x = data.x;
                c.y = data.y;
                if(data.x - 20 - ballR <= ballX && data.x + 20 + ballR >= ballX && data.y - 20 - ballR <= ballY && data.y + 20 + ballR >= ballY)
                {
                    c.score++;
                    ballX = Math.round(Math.random() * 1200);
                    ballY = Math.round(Math.random() * 800);
                    client.broadcast.emit('json',JSON.stringify({"action" : "collect", "id" : data.id, "score" : clients[data.id].score, "ballX" : ballX, "ballY" : ballY, "ballR" : ballR }));
                    client.emit('json',JSON.stringify({"action" : "collect", "id" : data.id, "score" : clients[data.id].score, "ballX" : ballX, "ballY" : ballY, "ballR" : ballR }));
                }
                data = JSON.stringify(data);
                client.broadcast.emit('json', data);
            }
        } else if (data['action'] == 'create') {
            if(data.name == undefined)
                return;
            data.name = data.name.substr(0,20);
            data = JSON.stringify(data);
            client.broadcast.emit('json', data);
        }
        });

        client.on('disconnect', function(id) {
        if(clients[id]==undefined)
            return;
        clients[id].broadcast.emit('delete', id);
        delete clients[id];
        });
        
});
