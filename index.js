#!/usr/bin/node

const app    = require('express')();
const server = require('http').Server(app);
const spis   = require('./spis.json');
const JSON   = require('circular-json');

class Player
{
  constructor(json)
  {
    if(json.socket === undefined) { throw new Exception("socket empty!"); }
    this.socket = json.socket;
    this.username = "";
    this.id = json.socket.id;
    this.joined_game = null;
    this.points = 0;
    this.color = "";
    this.socket.on('chat message', (msg) => {this._chat_message(msg);});
    this.socket.on('disconnect', () => {this._disconnect();});
    this.socket.on('draw', (json) => { if(active_game !== null) { active_game._draw(this, json); } });
    this.socket.on('clear', (a) => { if(active_game !== null) { active_game._clear(this, a); } });
  }
  setGame(g)
  {
    this.joined_game = g;
  }
  isInGame()
  {
    return this.joined_game !== null;
  }
  getGame()
  {
    return this.joined_game;
  }
  emit(name, json)
  {
    io.in(this.socket.id).emit(name, JSON.stringify(json));
  }
  _disconnect()
  {
    console.log(this.username+' disconnected');

    var send =
    {
      time: (new Date()).getTime(),
      text: this.username,
      author: this.username,
      color: 'left'
    };
    add_to_history(send);
    emit("left", send);

    clients.splice(clients.indexOf(this));
    refresh_list();
    if(active_game !== null)
      active_game._disconnected(this);
    clients.splice(clients.indexOf(this));
  }
  _chat_message(msg)
  {
    let first = (this.username === "") ? true : false;
    if(first)
    {
      this.username = msg;
      this.color = "Black";

      refresh_list();

      if(!refresh)
        refresh = setInterval(() => { refresh_list(); }, 500);

      var send = {
        time: (new Date()).getTime(),
        text: msg,
        author: this.username,
        color: 'whoolean'
      };

      add_to_history(send);
      emit('joined', send);
      this.emit('nick', msg);
    }

    if(active_game === null)
      active_game = new Game();
    if(first)
      active_game._joined(this, msg);
    else
      active_game._on_message(this, msg);
  }
}

function emit(name, json)
{
  io.emit(name, JSON.stringify(json));
}

class Game
{
  constructor()
  {
    this.clients = [];
    this.loss = null;
    this.playtime = null;
    this.master = null;
    this._min_clients = 2;
    this.gtrdy = null;
    this.canvas = [];
    this.playing = false;
    this.index = 0;
  }
  setMaster(player)
  {
    this.master = player;
  }
  _clear(from, a)
  {
    if(from === this.master)
    {
      this.canvas = [];
      this.master.socket.broadcast.emit('clear', true);
    }
  }
  _draw(from, json)
  {
    if(from === this.master && this.playing)
    {
      this.canvas.push(JSON.parse(json));
      this.master.socket.broadcast.emit('drawing', json);
    }
  }
  _artist()
  {
    this.gtrdy = setInterval(() => {
      this.master = this.clients[this.index];
      this.index++;
      if(this.index >= this.clients.length) { this.index = 0; }

      this.loss = Math.floor((Math.random() * 807) + 1);
      console.log("Pokemon: "+this.loss);
      io.emit('start turn', this.master.username);

      var send =
      {
        time: 1,
        text: this.master.username,
        author: true,
        color: "artist"
      };
      add_to_history(send);

      this.master.emit('master', spis[this.loss-1].name);

      clearInterval(this.gtrdy);
    }, 10000);
  }
  start(msg)
  {
    console.log("Starting game...");
    this.playing = true;
    io.emit('new turn', true);
    this.canvas = [];
    this.clients[0].socket.broadcast.emit('clear', true);

    this.playtime = setInterval(() =>
    {
      io.emit('new turn', true);
      this.canvas = [];
      io.emit('clear', true);
      this._artist();
    }, 60000);

    this._artist();
  }
  stop()
  {
    this.playing = false;
    this.loss = -1;
    clearInterval(this.playtime);
    clearInterval(this.gtrdy);
    io.emit('stop', true);
  }
  _on_message(cl, msg)
  {
    var send =
    {
      time: (new Date()).getTime(),
      text: msg,
      author: cl.username,
      color: cl.color
    };
    add_to_history(send);
    emit('chat message', send);

    if(this.loss > 0)
      if(spis[this.loss-1].name.toLowerCase() === msg.toLowerCase() && this.master !== cl)
      {
        clearInterval(this.playtime);
        this.loss = -1;
        io.emit('win', cl.username);
        var send =
        {
          time: 1,
          text: cl.username,
          author: cl.username,
          color: "winner"
        };
        add_to_history(send);
        refresh_list();
        cl.points++;
        this.start("");
      }
  }
  _joined(cl, msg)
  {
    this.clients.push(cl);
    if(!this.playing && this.clients.length >= this._min_clients)
      this.start(cl, msg);
  }
  _disconnected(cl)
  {
    this.clients.splice(this.clients.indexOf(cl));
    if(this.playing && this.clients.length < this._min_clients)
      this.stop();
  }
}

function refresh_list()
{
  let names  = [];
  let points = [];

  for(let c in clients)
  {
    if(clients[c].username !== "")
    {
      names.push(clients[c].username);
      points.push(clients[c].points);
    }
  }
  emit('onlist', {"name": names, "points": points});
}

function add_to_history(json)
{
  history.push(json);
  history = history.slice(-100);
}

const io = require('socket.io')(server, {
  path: '',
  serveClient: false,
  // below are engine.IO options
  pingInterval: 500,
  pingTimeout: 5000,
  cookie: false
});

var history = [];
var clients = [];

var active_game = null;

var refresh;
var gtrdy;

io.on('connection', (socket) =>
{
	let client = new Player({"socket": socket});
  clients.push(client);

	console.log((new Date()) + ' Connection accepted.');
	// send back chat history
	if (history.length > 0)
    client.emit('history', history);

  if(active_game !== null)
  {
    if (active_game.canvas.length > 0)
      client.emit('hisdrawing', this.canvas);

    if (!active_game.playing)
      client.emit('hold', true);
  }
});

server.listen(3000,{log: false, origins: '*:*'}, function(){
	console.log('listening on *:3000');
});
