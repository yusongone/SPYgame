/**
 * Module dependencies.
 */

var express = require('express'),
	http = require('http'),
	socketIO = require("socket.io");
var paserCookie=require("./lib/paserCookie");
var house=require("./lib/house");
var parseSigendCookie=require("connect").utils.parseSignedCookie;
var MemoryStore=new express.session.MemoryStore;
var app = express.createServer();

var i=0;

// Configuration
app.configure(function(){
	app.set("title","webOne");
	app.set('views', __dirname + '/views');
	app.set("view options",{layout:false});
	app.set('view engine','ejs');
	app.use(express.cookieParser("keyboard cat"));
	app.use(express.session({
		"secret":"secret",
		"store":MemoryStore
	}));
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get("/",function(req,res){
	res.render("index",{"title":req.session.userId});	
});

app.post("/ss/login",function(req,res){		
		req.session.userId=req.body.na;
		res.send({"result":"ok","name":req.body.na});
});


//var server=http.createServer(app);
//	server.listen(3000,function(req,res){
//	});
app.listen(3000);

var io=socketIO.listen(app);
io.set("authorization",function(handData,callback){
	var str=handData.headers.cookie;
		handData.cookie=paserCookie.pk(str);
	var c=handData.cookie["connect.sid"];
		handData.sessionID=parseSigendCookie(c,"secret");
	MemoryStore.get(handData.sessionID,function(err,session){
		if(session&&session.userId){
			handData.name=session.userId;
			callback(null,true);
		}else{
			callback(null,false);
		}
	});
});

io.sockets.on("connection",function(socket){
	house.init(socket.manager.handshaken[socket.id].name,socket);
	//house.pushAllHouse(socket);
	//house.addPeople(socket.manager.handshaken[socket.id].name,socket);
	return false;
	MemoryStore.get(socket.id,function(err,session){
		console.log(session.uiserId);
	});
});
