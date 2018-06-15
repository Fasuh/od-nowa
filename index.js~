var app = require('express')();
var server = require('http').Server(app);
var spis = require('./spis.json');
//var io = require('socket.io')(server);


/*app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});*/

//user colors and names

const io = require('socket.io')(server, {
  path: '',
  serveClient: false,
  // below are engine.IO options
  pingInterval: 500,
  pingTimeout: 5000,
  cookie: false
});

var userName = false;
var userColor = false;
//chat history
var history = [];

//connected clients
var clients = [];
//history of canvas
var canver = [];
//clients with nicknames playing
var active = [];

var refresh;
var gtrdy;


// id
active[0] = [];
//nick
active[1] = [];
//color
active[2] = [];
//pkt
active[3] = [];

//lossed pokemon
var loss;
//if game is alredy running
var playing = false;
//interval
var playtime;
//who's the master
var master;

io.on('connection', function(socket){
	var index = clients.push(socket.id) - 1;
	var userName = false;
	var userColor = false;
	console.log((new Date()) + ' Connection accepted.');
	// send back chat history
	if (history.length > 0) {
		var json = JSON.stringify(history);
		io.in(socket.id).emit('history', json);
	}
	if	(canver.length > 0){
		var json = JSON.stringify(canver);
		io.in(socket.id).emit('hisdrawing', json);
	}
	if (playing==false){
		io.in(socket.id).emit('hold', true);
	}
	socket.on('disconnect', function(){
		console.log('user disconnected');
		if(active[0].indexOf(socket.id)>-1){
			
			var send = {
				time: (new Date()).getTime(),
				text: active[1][active[0].indexOf(socket.id)],
				author: active[1][active[0].indexOf(socket.id)],
				color: 'left'
			};
			history.push(send);
			history = history.slice(-100);
			var json = JSON.stringify(send);
			io.emit('left', json);
			
			active[0].splice(active[0].indexOf(socket.id), 1);
			active[1].splice(active[0].indexOf(socket.id), 1);
			active[2].splice(active[0].indexOf(socket.id), 1);
			active[3].splice(active[0].indexOf(socket.id), 1);
			
		}
		var json1 = JSON.stringify(active[1]);
		var json2 = JSON.stringify(active[3]);
		io.emit('onlist', {name: json1, points: json2});

		if(playing == true && active[0].length < 2){
			playing = false;
			loss=-1;
			clearInterval(playtime);
			clearInterval(gtrdy);
			io.emit('stop', true);
		}
		clients.splice(socket.id, 1);
	});
	socket.on('chat message', function(msg){
		if(active[0].indexOf(socket.id)<0){
			//add user to the array
			active[0].push(socket.id);
			active[1].push(msg);
			active[2].push("Black");
			active[3].push(0);
			
			var json1 = JSON.stringify(active[1]);
			var json2 = JSON.stringify(active[3]);
			io.emit('onlist', {name: json1, points: json2});
			
			if(!refresh){
				refresh = setInterval(() => {
					var json1 = JSON.stringify(active[1]);
					var json2 = JSON.stringify(active[3]);
					io.emit('onlist', {name: json1, points: json2});
				}, 10000);
			}
			
			//add message about user joining the game
			var send = {
				time: (new Date()).getTime(),
				text: msg,
				author: active[1][active[0].indexOf(socket.id)],
				color: 'whoolean'
			};
			history.push(send);
			history = history.slice(-100);
			// broadcast message to all connected clients
			var json = JSON.stringify(send);
			io.emit('joined', json);
			io.in(socket.id).emit('nick', msg);
			if(playing==false && active[0].length>=2){
				playing=true;
				
				io.emit('new turn', true);
				canver = [];
				socket.broadcast.emit('clear', true);
				
				gtrdy = setInterval(() => {
					master = active[0][0];
					active[0][active[0].length]=active[0][0];
					active[0].shift();
				
					active[1][active[1].length]=active[1][0];
					active[1].shift();
				
					active[2][active[2].length]=active[2][0];
					active[2].shift();
			
					active[3][active[3].length]=active[3][0];
					active[3].shift();
					loss = Math.floor((Math.random() * 807) + 1);
					console.log(loss);
					io.emit('start turn', active[1][0]);
					
					var send = {
						time: 1,
						text: active[1][0],
						author: true,
						color: "artist"
					};
					history.push(send);
					history = history.slice(-100);
					
					io.in(master).emit('master', spis[loss-1].name);
					clearInterval(gtrdy);
				}, 10000)
				playtime = setInterval(() => {
					io.emit('new turn', true);
					canver = [];
					socket.broadcast.emit('clear', true);
					
					gtrdy = setInterval(() => {
						master = active[0][0];
						active[0][active[0].length]=active[0][0];
						active[0].shift();
					
						active[1][active[1].length]=active[1][0];
						active[1].shift();
					
						active[2][active[2].length]=active[2][0];
						active[2].shift();
				
						active[3][active[3].length]=active[3][0];
						active[3].shift();
						loss = Math.floor((Math.random() * 807) + 1);
						console.log(loss);
						io.emit('start turn', active[1][0]);
						
						var send = {
							time: 1,
							text: active[1][0],
							author: true,
							color: "artist"
						};
						history.push(send);
						history = history.slice(-100);
						
						io.in(master).emit('master', spis[loss-1].name);
						clearInterval(gtrdy);
					}, 10000)
				}, 70000);
				console.log("Started the game.");
			}
		}
		else{
			
			var send = {
				time: (new Date()).getTime(),
				text: msg,
				author: active[1][active[0].indexOf(socket.id)],
				color: active[2][active[0].indexOf(socket.id)]
			};
			history.push(send);
			history = history.slice(-100);
			// broadcast message to all connected clients
			var json = JSON.stringify(send);
			io.emit('chat message', json);
			if(loss>=0){
				if(spis[loss-1].name.toLowerCase() == msg.toLowerCase() && socket.id != master){
					clearInterval(playtime);
					loss=-1;
					io.emit('win', active[1][active[0].indexOf(socket.id)]);
					
					var send = {
						time: 1,
						text: active[1][active[0].indexOf(socket.id)],
						author: true,
						color: "winner"
					};
					
					history.push(send);
					history = history.slice(-100);
					
					active[3][active[0].indexOf(socket.id)]++;

					var json1 = JSON.stringify(active[1]);
					var json2 = JSON.stringify(active[3]);
					io.emit('onlist', {name: json1, points: json2});
					
					io.emit('new turn', true);
					canver = [];
					socket.broadcast.emit('clear', true);
					
					gtrdy = setInterval(() => {
						master = active[0][0];
						active[0][active[0].length]=active[0][0];
						active[0].shift();
					
						active[1][active[1].length]=active[1][0];
						active[1].shift();
					
						active[2][active[2].length]=active[2][0];
						active[2].shift();
				
						active[3][active[3].length]=active[3][0];
						active[3].shift();
						loss = Math.floor((Math.random() * 807) + 1);
						console.log(loss);
						io.emit('start turn', active[1][0]);
						
						var send = {
							time: 1,
							text: active[1][0],
							author: true,
							color: "artist"
						};
						history.push(send);
						history = history.slice(-100);
						
						io.in(master).emit('master', spis[loss-1].name);
						clearInterval(gtrdy);
					}, 10000)
					playtime = setInterval(() => {
						io.emit('new turn', true);
						canver = [];
						socket.broadcast.emit('clear', true);
						
						gtrdy = setInterval(() => {
							master = active[0][0];
							active[0][active[0].length]=active[0][0];
							active[0].shift();
						
							active[1][active[1].length]=active[1][0];
							active[1].shift();
						
							active[2][active[2].length]=active[2][0];
							active[2].shift();
					
							active[3][active[3].length]=active[3][0];
							active[3].shift();
							loss = Math.floor((Math.random() * 807) + 1);
							console.log(loss);
							io.emit('start turn', active[1][0]);
							
							var send = {
								time: 1,
								text: active[1][0],
								author: true,
								color: "artist"
							};
							history.push(send);
							history = history.slice(-100);
							
							io.in(master).emit('master', spis[loss-1].name);
							clearInterval(gtrdy);
						}, 10000)
					}, 70000);
				}
			}
		}
	});
	if	(active[0].length > 0){
		var json1 = JSON.stringify(active[1]);
		var json2 = JSON.stringify(active[3]);
		io.in(socket.id).emit('onlist', {name: json1, points: json2});
	}
	socket.on('draw', function(json){
		if(socket.id==master && playing==true){
			var send = JSON.parse(json);
			canver.push(send);
			socket.broadcast.emit('drawing', json);
		}
	});
	socket.on('clear', function(a){
		if(socket.id==master){
			canver = [];
			socket.broadcast.emit('clear', true);
		}
	});
});

server.listen(3000,{log: false, origins: '*:*'}, function(){
	console.log('listening on *:3000');
});