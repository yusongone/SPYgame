var TCP=require("./TCP");
eports.init=function(io){
	io.sockets.on("connection",function(socket){
		socket.on("data",function(){
			console.log();	
		});
	});
}
