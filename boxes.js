/************************** get Heroku port **********************************/
var http_port = 8081;
var port = 8543;
/***************************  Require modules  ********************************/
var fs = require('fs');
var privateKey = fs.readFileSync('/etc/nginx/ssl/STAR_glentaka_com.key');
var certificate = fs.readFileSync('/etc/nginx/ssl/STAR_glentaka_com.chained.crt');
var https = require('https'),
    server = https.createServer({
      key: privateKey,
      cert: certificate
    });
var     console = require('console'),
    express = require('express'),
        app = express(),
        io = require('socket.io').listen(server);
server.listen(port);
app.listen(http_port);
io.set('log level', 1);
//http requests:
app.use(express.static(__dirname));
app.get("/"+__filename, function(req, res) {
    res.end('ACCESS DENIED');
});
console.log('starting boxes');
var clients = [];
var width = 1200;
var height = 600;
var ballX = Math.round(Math.random() * width);
var ballY = Math.round(Math.random() * height);
var ballR = 7;
var maxSpeed = 15;

/*************************  Start socket server  ******************************/
io.sockets.on('connection', function(client) {
    var id = client.id;
    console.log("client id " + id + " connected");
    client.broadcast.emit('create', id);
    clients[id] = client;
    clients[id].score = 0;
    clients[id].x = -1;
    clients[id].y = -1;
    client.emit('id', id);
    client.emit('json', JSON.stringify({"action" : "ball", "ballX" : ballX, "ballY" : ballY, "ballR" : ballR}));
        // You can also use socket.broadcast() to send to everyone.
        client.on('message', function(data) {
                // Do some stuff when you recieve a message
        //client.broadcast.emit(JSON.parse(data));
        data = JSON.parse(data);
        data.id = id;
        if(clients[data.id]==undefined || data['action'] == undefined)
            return;
        data.score = clients[data.id].score;
        if(data['action'] == 'load') {
        console.log("loading clients for: " + id);
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
            if(c.x != -1 && c.y != -1 && ((Math.abs(c.x - data.x) > maxSpeed + 1 && Math.abs(c.x - data.x) < width - maxSpeed - 1) || (Math.abs(c.y - data.y) > maxSpeed + 1&& Math.abs(c.y - data.y) < height - maxSpeed - 1)))
            {
                console.log("client id " + id + " did illegal move " + (c.x - data.x));
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
                    ballX = Math.round(Math.random() * width);
                    ballY = Math.round(Math.random() * height);
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

        client.on('disconnect', function() {
        if(clients[id]===undefined)
            return;
        clients[id].broadcast.emit('delete', id);
        delete clients[id];
        });

});
