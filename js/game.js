//create the first player
var server = window.location.hostname;
var player;
var guests = {};
var ballX = 0;
var ballY = 0;
var ballR = 0;
var game;
var gameContext;
var socket;
var name;
var maxSpeed = 15;
var size = 40;
var t;
var width = 1200;
var height = 600;

$(window).load(function () {
    $("#namebox").keydown(function(e) {
        // Enter is pressed
        if (e.keyCode == 13) { enterName(); }
    });
});

function enterName() {
	name = document.getElementById('namebox').value;
	if(name.length > 20)
	{
		alert('Error. Name cannot be greater than 20 characters.');
		document.getElementById('namebox').value = '';
		return;
	}
	$('#form').remove();
	$('#about').remove();
	var gg = document.createElement('canvas');
	gg.setAttribute('id','game');
	gg.innerHtml = "This browser is not compatable with this game. Please download <a href='http://www.google.com/chrome'>Google Chrome</a>";
	$("#gamespace").append(gg);
	loadGame();
}

function loadGame() {
connect();
var r = Math.round(Math.random() * 255);
var g = Math.round(Math.random() * 255);
var b = Math.round(Math.random() * 255);
game = document.getElementById('game');
//game.width = vWidth-25;
//game.height = vHeight-25;
game.width = width;
game.height = height;
var x = Math.round(Math.random() * game.width); 
var y = Math.round(Math.random() * game.height);
gameContext = game.getContext('2d');
gameContext.font = 'bold 24px sans-serif';

player = new Player(r,g,b,x,y,name);
player.startControls();
socket.send(JSON.stringify({"action" : "create", "r" : r, "g" : g, "b" : b,"x" : player.getX(), "y" : player.getY(),"xaccel" : player.getXA(), "yaccel" : player.getYA(), "name" : player.name, "xspeed" : player.getXS(), "yspeed" : player.getYS()}));
socket.send(JSON.stringify({"action" : "load"}));
var __this = this;
this.run = function() {
	gameContext.clearRect(0,0,game.width,game.height);
	gameContext.strokeRect(0,0,game.width,game.height);
	writeText();
	drawBall();
	for( g in guests)
	{
		var guest = guests[g];
		if(guest!=null)
		{
			guest.tick();
		}
	}
	player.tick();
	socket.send(JSON.stringify({"action": "move","x" : player.getX(), "y" : player.getY(),"xaccel" : player.getXA(), "yaccel" : player.getYA(), "xspeed" : player.getXS(), "yspeed" : player.getYS()}));
	t = setTimeout(__this.run,50);
}
t = setTimeout(__this.run,50);
}


function writeText() {
	var temp = gameContext.fillStyle;
	gameContext.fillStyle = 'rgb(0,0,0)';
	gameContext.fillText('Use the arrow keys to move.', 5, 20);
	gameContext.fillText('Collect balls to gain points.', 5, 43);
	var string = 'Scores:';
	var metrics = gameContext.measureText(string);
	gameContext.fillText(string, game.width - metrics.width-5, 20);
	var font = gameContext.font;
	gameContext.font = 'bold 12px sans-serif';
	gameContext.fillText('Copyright 2013 Glen Takahashi', 5, height-14);
	if(player!=null)
	{
		metrics = gameContext.measureText(player.name + ": " + player.score);
		gameContext.fillText(player.name + ": " + player.score, game.width - metrics.width - 5, 45);
	}
	var i = 60;
	for( g in guests )
	{
		var guest = guests[g];
		if(guest == null)
			continue;
		metrics = gameContext.measureText(guest.name + ": " + guest.score);
		gameContext.fillText(guest.name + ": " + guest.score, game.width - metrics.width - 5, i);
		i += 15;
	}
	gameContext.font = font;
	gameContext.fillStyle = temp;
}
function drawBall() {
	var temp = gameContext.fillStyle;
	gameContext.fillStyle = 'rgb(0,0,0)';
	gameContext.beginPath();
	gameContext.arc(ballX,ballY,ballR,0,Math.PI * 2, false);
	gameContext.fill();
	gameContext.strokeStyle = 'rgb(0,0,0)';
	gameContext.stroke();
	gameContext.closePath();
	gameContext.fillStyle = temp;
}

function Player(r,g,b,x,y,name)
{
	this.r = r;
	this.g = g;
	this.b = b;
	this.score = 0;
	this.name = name;
	//var xspeed = Math.round(Math.random() * 20 + 4) * (Math.random()>.5?-0.8);
	var xspeed = 0;
	var xaccel = 0;
	//var yspeed = Math.round(Math.random() * 20 + 4) * (Math.random()>.5?-0.8);
	var yspeed = 0;
	var yaccel = 0;
	var left = false;
	var right = false;
	var up = false;
	var down = false;
	var boxes = new Array();
	var _tick = 5;
	var _this = this;

	function Box(x,y,w,h)
	{
		this.a = 1;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.update = function()
		{
			this.a -= (1/_tick) * this.a;
			this.w -= (1/_tick) * this.w;
			this.h -= (1/_tick) * this.h;
		}
	}
	this.getX = function () { return x; };
	this.getY = function () { return y; };
	this.getXS = function () { return xspeed; };
	this.getYS = function () { return yspeed; };
	this.getXA = function () { return xaccel; };
	this.getYA = function () { return yaccel; };
	this.incTick = function(ti) {
		_tick += ti;
		_tick = Math.min(50,_tick);
	}
	var gliding = false;
	this.tick = function()
	{
		this.paint();
		if(up == false && left == false && right == false && down == false)
		{
		//	xaccel = (xspeed>0?-0.8:0.8);
		//	yaccel = (yspeed>0?-0.8:0.8);
			if(xspeed < 0.8 && xspeed > -0.8)
			{
				xspeed = 0;
				fxaccel = 0;
			}
			else if(xspeed > 1)
				fxaccel = -0.8;
			else if(xspeed < -1)
				fxaccel = 0.8;
			if(yspeed < 1 && yspeed > -1)
			{
				yspeed = 0;
				fyaccel = 0;
			}
			else if(yspeed > 1)
				fyaccel = -0.8;
			else if(yspeed < -1)
				fyaccel = 0.8;
			gliding = true;
		}
			

		if(boxes.length == _tick)
			boxes.shift();
		x += xspeed;
		if(!gliding)
			xspeed += xaccel;
		else
			xspeed += fxaccel;
		while(x<0)
			x += game.width-1;
		while (x>game.width-1)
			x -= game.width-1;
		if(xspeed > maxSpeed)
			xspeed = maxSpeed;
		else if(xspeed < -1 * maxSpeed)
			xspeed = -1 * maxSpeed;
		y += yspeed;
		if(!gliding)
			yspeed += yaccel;
		else
			yspeed += fyaccel;
		while(y<0)
			y += game.height-1;
		while (y>game.height-1)
			y -= game.height-1;
		if(yspeed>maxSpeed)
			yspeed=maxSpeed;
		else if(yspeed<-1 * maxSpeed)
			yspeed=-1 * maxSpeed;
		boxes.push(new Box(x,y,size,size));
		
	}
	this.paint = function () {
		var temp = gameContext.fillStyle;
		for( b in boxes)
		{
			var box = boxes[b];
			gameContext.fillStyle = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + box.a + ')';
			gameContext.fillRect(box.x-box.w/2, box.y-box.h/2,box.w,box.h);	
			box.update();
		}
		gameContext.fillStyle = 'rgb(0,0,0)';
		//handle names
		var temp2 = gameContext.font;
		gameContext.font = 'bold 12px sans-serif';
		string = this.name;
		metrics = gameContext.measureText(string);
		gameContext.fillText(string, x - metrics.width / 2, y - 30);
		gameContext.font = temp2;
		gameContext.fillStyle = temp;
	}
	boxes.push(new Box(x,y,size,size));
	//controls
	this.startControls = function() {
		document.onkeydown = function(event) {
			var keycode;

			if(event == null)
				keyCode = window.event.keyCode;
			else
				keyCode = event.keyCode;

			switch(keyCode)
			{
				case 37:
				//	xspeed = -2;
					if(left==false)
						xaccel -= 0.8;
					gliding = false;
					left = true;
					break;
				case 38:
				//	yspeed = -2;
					if(up==false)
						yaccel -= 0.8;
					gliding = false;
					up = true;
					break;
				case 39:
				//	xspeed = 2;
					if(right==false)
						xaccel += 0.8;
					gliding = false;
					right = true;
					break;
				case 40:
				//	yspeed = 2;
					if(down==false)
						yaccel += 0.8;
					gliding = false;
					down = true;
					break;
				default:
					break;
			}
		}
		document.onkeyup = function(event) {
			var keycode;

			if(event == null)
				keyCode = window.event.keyCode;
			else
				keyCode = event.keyCode;

			switch(keyCode)
			{
				case 37:
					if(left==true)
						xaccel += 0.8;
					left = false;
					break;
				case 38:
					if(up==true)
						yaccel += 0.8;
					up = false;
					break;
				case 39:
					if(right==true)
						xaccel -= 0.8;
					right = false;
					break;
				case 40:
					if(down==true)
						yaccel -= 0.8;
					down = false;
					break;
				default:
					break;
			}
		}
	}
}
function Guest(r,g,b,x,y,name)
{
	this.r = r;
	this.g = g;
	this.b = b;
	this.score = 0;
	this.name = name;
	//var xspeed = Math.round(Math.random() * 20 + 4) * (Math.random()>.5?-1:1);
	var xspeed = 0;
	var xaccel = 0;
	//var yspeed = Math.round(Math.random() * 20 + 4) * (Math.random()>.5?-1:1);
	var yspeed = 0;
	var yaccel = 0;
	var boxes = new Array();
	var _tick = 5;
	var _this = this;

	function Box(x,y,w,h)
	{
		this.a = 1;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.update = function()
		{
			this.a -= (1/_tick) * this.a;
			this.w -= (1/_tick) * this.w;
			this.h -= (1/_tick) * this.h;
		}
	}
	this.skipTick = false;
	this.incTick = function(ti) {
		_tick += ti;
		_tick = Math.min(50,_tick);
	}

	this.tick = function()
	{
		this.paint();
		if(this.skipTick == true)
		{
			x = this.newX;
			xaccel = this.newXA;
			xspeed = this.newXS;
			y = this.newY;
			yaccel = this.newYA;
			yspeed = this.newYS;
		} else {
			x += xspeed;
			xspeed += xaccel;
			if(xspeed > maxSpeed)
				xspeed = maxSpeed;
			else if(xspeed < -1 * maxSpeed)
				xspeed = -1 * maxSpeed;
			y += yspeed;
			yspeed += yaccel;
			if(yspeed>maxSpeed)
				yspeed=maxSpeed;
			else if(yspeed<-1 * maxSpeed)
				yspeed=-1 * maxSpeed;
		}
		if(boxes.length == _tick)
			boxes.shift();
		while(x<0)
			x += game.width-1;
		while (x>game.width-1)
			x -= game.width-1;
		while(y<0)
			y += game.height-1;
		while (y>game.height-1)
			y -= game.height-1;
		boxes.push(new Box(x,y,size,size));
		this.skipTick = false;
	}

	this.paint = function () {
		var temp = gameContext.fillStyle;
		for( b in boxes)
		{
			var box = boxes[b];
			gameContext.fillStyle = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + box.a + ')';
			gameContext.fillRect(box.x-box.w/2, box.y-box.h/2,box.w,box.h);	
			box.update();
		}
		gameContext.fillStyle = 'rgb(0,0,0)';
		//handle names
		var temp2 = gameContext.font;
		gameContext.font = 'bold 12px sans-serif';
		string = this.name;
		metrics = gameContext.measureText(string);
		gameContext.fillText(string, x - metrics.width / 2, y - 30);
		gameContext.font = temp2;
		gameContext.fillStyle = temp;
	}
	boxes.push(new Box(x,y,size,size));
}
function connect () {
socket = io.connect(server);
var _id;
socket.on('id', function(id) {
	_id = id;
});

socket.on('create', function(id) {
	if(guests[id] == undefined)
		guests[id] = null;
});

socket.on('info', function() {
	socket.send(JSON.stringify({"action" : "create", "r" : player.r, "g" : player.g, "b" : player.b,"x" : player.getX(), "y" : player.getY(),"xaccel" : player.getXA(), "yaccel" : player.getYA(), "name" : player.name}));
});

socket.on('delete', function(id) {
	delete guests[id];
});

socket.on('hacking', function(id) {
	clearTimeout(t);
	gameContext.clearRect(0,0,game.width,game.height);
	gameContext.strokeRect(0,0,game.width,game.height);
	gameContext.fillStyle = 'rgb(0,0,0)';
	gameContext.font = 'bold 24px sans-serif';
	var string = "You have been disconnected for hacking.";
	var metrics = gameContext.measureText(string);
	gameContext.fillText(string, (game.width - metrics.width) / 2, game.height / 2);
	guests = {};
	socket.disconnect();
});

socket.on('json', function(data){
  data = JSON.parse(data);
  if(data['action'] == 'create' && guests[data.id] == null)
  {
	guests[data.id] = new Guest(data.r,data.g,data.b,data.x,data.y,data.name);
	guests[data.id].score = data.score;
	for(i = 0;i<data.score;i++)
		guests[data.id].incTick(1);
  }
  else if (data.action == 'ball') {
	ballR = data.ballR;
	ballX = data.ballX;
	ballY = data.ballY;
  }
  else if (data.action == 'collect') {
	ballR = data.ballR;
	ballX = data.ballX;
	ballY = data.ballY;
	if(data.id == _id)
	{
		player.score++;
		player.incTick(1);
	}
	else if(guests[data.id] != null)
	{
		guests[data.id].incTick(1);
		guests[data.id].score++;
	}
  }
  else if (data.action == 'move' && guests[data.id] != null) {
	guests[data.id].newX = data.x;
	//document.getElementById('dd').innerHTML += data.x + "\n";	
	guests[data.id].newY = data.y;
	guests[data.id].newXA = data.xaccel;
	guests[data.id].newYA = data.yaccel;
	guests[data.id].newXS = data.xspeed;
	guests[data.id].newYS = data.yspeed;
	guests[data.id].skipTick = true;
  }
});
}
