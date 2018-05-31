
$(document).ready(function() {
	var game = {
		init: function() {
			canvas = document.getElementById("gamecanvas");
			context = canvas.getContext("2d");
		}
	}
	var sketch=false;
	var timing=0;
	var wait;
	var socket = io('http://192.168.0.2:3000');
	$(function () {
		$('form').submit(function(){

			socket.emit('chat message', $('#input').val());
			document.getElementById("input").value="";
			return false;
		});
		socket.on('chat message', function(msg){
			var json = JSON.parse(msg);
			addMessage(json.author, json.text, json.color, new Date(json.time));
		});
		socket.on('joined', function(msg){
			var json = JSON.parse(msg);
			addMessage(json.author, json.text, json.color, new Date(json.time));
		});
		socket.on('left', function(msg){
			var json = JSON.parse(msg);
			addMessage(json.author, json.text, json.color, new Date(json.time));
		});
		socket.on('accepted', function(wha){
			document.getElementById("block").style.display = "none";
		});
		socket.on('nick', function(nick){
			document.getElementById("nick").innerHTML = "<b>"+nick+"</b>";
		});
		socket.on('drawing', function(json){
			var drawin = JSON.parse(json);
			addClickd( drawin.x, drawin.y, drawin.color, drawin.drag, drawin.size);
			draw();
		});
		socket.on('clear', function(json){
			clearine();
		});
		socket.on('master', function(pick){
			sketch=true;
			document.getElementById("przybornik").style.visibility = "visible";
			document.getElementById("info").innerHTML="<b>Pokemon którego masz narysować to "+pick+".</b>";
		});
		socket.on('new turn', function(master){
			clearine();
			document.getElementById("przybornik").style.visibility = "hidden";
			sketch=false;
			document.getElementById("info").innerHTML="<b>Nastepna runda.</b>";
			clearInterval(wait);
			timing=10;
			document.getElementById("timer").innerHTML=timing;
			wait = setInterval(() => {
				timing--;
				document.getElementById("timer").innerHTML=timing;
			}, 1000);
		});
		socket.on('start turn', function(master){
			document.getElementById("info").innerHTML="<b>Teraz rysuje "+master+".</b>";
			addMessage(true, master, "artist", true);
			clearInterval(wait);
			timing=60;
			document.getElementById("timer").innerHTML=timing;
			wait = setInterval(() => {
				timing--;
				document.getElementById("timer").innerHTML=timing;
			}, 1000);
		});
		socket.on('win', function(winner){
			addMessage(true, winner, "winner", true);
		});
		socket.on('stop', function(winner){
			clearInterval(wait);
			document.getElementById("timer").innerHTML="-";
			document.getElementById("info").innerHTML="Gra przerwana, zbyt mało graczy.";
			sketch=false;
			document.getElementById("przybornik").style.visibility = "hidden";
		});
		socket.on('hold', function(winner){
			document.getElementById("timer").innerHTML="-";
			document.getElementById("info").innerHTML="Zbyt malo graczy aby rozpoczac gre.";
			sketch=false;
			document.getElementById("przybornik").style.visibility = "hidden";
		});
		socket.on('history', function(history){
			var json = JSON.parse(history);
			for (var i=0; i < json.length; i++) {
				addMessage(json[i].author, json[i].text,
				json[i].color, new Date(json[i].time));
			}
		});
		socket.on('onlist', function(list){
			var nick = JSON.parse(list.name);
			var points = JSON.parse(list.points);
			
			document.getElementById("online").innerHTML="";
			for(i=1;i<=nick.length;i++){
				document.getElementById("online").innerHTML+="<b>"+i+". "+nick[i-1]+"  "+points[i-1]
				+"</b><br>";
			}
		});
		socket.on('hisdrawing', function(history){
			var json = JSON.parse(history);
			for (var i=0; i < json.length; i++) {
				addClickd(json[i].x, json[i].y,
				json[i].color, json[i].drag, json[i].size);
			}
			//x,y,color,drag,size
			redraw();
		});
	});
	
	function addMessage(author, message, color, dt) {
		if(color=="whoolean"){
			document.getElementById("content").innerHTML+='<p><span style="color:red"><b>'+message+' dolaczyl do gry!</b></span></p>';
		}else if(color=="left"){
			document.getElementById("content").innerHTML+='<p><span style="color:red"><b>'+message+' opuscil gre.</b></span></p>';
		}else if(color=="winner"){
			document.getElementById("content").innerHTML+='<p><span style="color:black"><b>Gracz '+message+' odgadl!</b></span></p>';
		}else if(color=="artist"){
			document.getElementById("content").innerHTML+='<p><span style="color:green"><b>Teraz rysuje '+message+'.</b></span></p>';
		}else{
		document.getElementById("content").innerHTML+='<p><span style="color:' + color + '"><b>' + author + '</b></span> @ ' + (dt.getHours() < 10 ? '0'
		+ dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10
		? '0' + dt.getMinutes() : dt.getMinutes())+ ': ' + message + '</p>';
		}
		content.scrollTop+=35;
	}
	var coloring ;
	var clickX = new Array();
	var clickY = new Array();
	var clickDrag = new Array();
	var colored = new Array();
	var size = new Array();
	var paint;
	
	
		function draw(){
			canvas = document.getElementById("gamecanvas");
			context = canvas.getContext("2d");
			// clear the canvas
			context.lineJoin = "round";
			//for(var i=0; i < clickX.length; i++) {		
			context.beginPath();
			//..draw all the points
			if(clickDrag[clickDrag.length-1]){
				context.moveTo(clickX[clickX.length-2], clickY[clickY.length-2]);
			}else{
				context.moveTo(clickX[clickX.length-1]-1, clickY[clickY.length-1]);
			}
			context.lineTo(clickX[clickX.length-1], clickY[clickY.length-1]); // where
			context.strokeStyle = colored[colored.length-1]; // color
			context.lineWidth = size[size.length-1]; // radius
			context.closePath(); // close
			context.stroke(); // draw
		  //}
			context.strokeStyle = "black"; // isnt working without it dunnno why
		}
		
		function redraw(){
			canvas = document.getElementById("gamecanvas");
			context = canvas.getContext("2d");
			// clear the canvas
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
			  

			context.lineJoin = "round";
			for(var i=0; i < clickX.length; i++) {		
				context.beginPath();
				//draw all the points
				if(clickDrag[i]){
					context.moveTo(clickX[i-1], clickY[i-1]);
				}else{
					context.moveTo(clickX[i]-1, clickY[i]);
				}
				context.lineTo(clickX[i], clickY[i]); // where
				context.strokeStyle = colored[i]; // color
				context.lineWidth = size[i]; // radius
				context.closePath(); // close
				context.stroke(); // draw
		  }
		  context.strokeStyle = "black"; // isnt working without it dunnno why
		}
		function cleard(){
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		}
	
	
	
	$("#gamecanvas").mousedown(function(){
		 // mouse position
		if(sketch==false) return;
		mousex = event.clientX-this.offsetLeft;
		mousey = event.clientY-this.offsetTop;
		// send info to the addClick
		coloring = document.getElementById("color").value;
		size.push(document.getElementById("radius").value)
		addClick(mousex, mousey, coloring, false);
		draw();

		$(this).mousemove(function(){
			// mouse position
			if(sketch==false) return;
			mousex = event.clientX-this.offsetLeft;
			mousey = event.clientY-this.offsetTop;
			coloring = document.getElementById("color").value;
			// send info to the addClick
			addClick(mousex, mousey, coloring, true);
			draw();
		});
	}).mouseup(function () {
	// stop drawing after click up
    $(this).unbind('mousemove');
	});
	$("#gamecanvas").mouseleave(function(){
		// stop drawing after leaving 
		$("#gamecanvas").unbind('mousemove');
	});
	
	$("#clear").click(function(){
			socket.emit('clear', true);
			clearine();
	});
	function clearine(){
			//clear field
			canvas = document.getElementById("gamecanvas");
			context = canvas.getContext("2d");
			context.clearRect(0, 0, 640, 480);
			clickX=[];
			clickY=[];
			clickDrag=[];
			colored=[];
			size=[];
	}
	
	function addClick(x, y, color, dragging)
	{
		// add all the points to the arrays
		clickX.push(x);
		clickY.push(y);
		clickDrag.push(dragging);
		colored.push(color);
		size.push(document.getElementById("radius").value)
		var send = {
			x: clickX[clickX.length-1],
			y: clickY[clickY.length-1],
			drag: clickDrag[clickDrag.length-1],
			color: colored[colored.length-1],
			size: size[size.length-1]
		};
		var json = JSON.stringify(send);
		socket.emit('draw', json);
	}
	function addClickd(x, y, color, dragging, sizer)
	{
		// add all the points to the arrays
		clickX.push(x);
		clickY.push(y);
		clickDrag.push(dragging);
		colored.push(color);
		size.push(sizer)
	}
	$("#color").change(function(){
		//color picking
		coloring = document.getElementById("color").value;
	});
});