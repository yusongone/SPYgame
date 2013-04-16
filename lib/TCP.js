var net=require("net"),
	config=require('./config');
var host=config.data.Host,
	port=config.data.Port,
	myStatus=config.data.Status;
var sockets=[];
var TCPmobel={};
console.log(host+","+port);
	TCPmobel.Server=function(){
		console.log("what");
		net.createServer(function(socket){
			console.log("created a TCP Server");	
			socket.on("data",function(){
				socket.write("hahahah");
			});
			sockets.push(socket);
		}).listen(port,host);
	}
	TCPmobel.client=function(){
		console.log("client");
		var client=net.createConnection(PORT,HOST);
			client.on("connect",function(){
				console.log("connect ok");
				client.write('hahaha  i ma yu song');
			});
			client.on('data', function(data) {
				console.log("ff");
				console.log('DATA: ' + data);
				// 完全关闭连接
				// client.destroy();
			});
			// 为客户端添加“close”事件处理函数
			client.on('close', function() {
				console.log('Connection closed');
			});
	}

	TCPmobel[myStatus]();

exports.sockets=sockets;

