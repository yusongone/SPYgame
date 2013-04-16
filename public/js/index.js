var con;
$(document).ready(function(){
		var socket=io.connect();
		socket.on("connect",function(){
			OSC.init($("#box"),["a","b","c"]);
		});
		var cleanData="",readData="";
		socket.on("d",function(data){
				var str=data.d;
				var ary=data.d.split(",");
				OSC.chengData([{"name":"a",data:ary[0]},{"name":"b",data:ary[1]},{"name":"c",data:ary[2]}]);
			});
});


