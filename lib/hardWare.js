var SerialPort=require('serialport2').SerialPort,
	config=require('./config');
var sp=new SerialPort();
var callback=function(){};
var portName=config.serial.portName;


exports.setFun=function(fun){
	callback=fun;
};
exports.init=function(){
	sp.open(portName,{
		baudRate:57600,
		dataBits:8,
		parity:'none',
		stopBits:1,
		flowControl:false
	});
	var cleanData=""
	var readData="";
	sp.on('data',function(data){
		readData+=data.toString();
		var ACCIndex=readData.indexOf('A');
		var AEIndex=readData.indexOf('B');
		if (ACCIndex >= 0 && AEIndex >= 0) {
			cleanData = readData.substring(ACCIndex+ 1,AEIndex);
			//console.log(cleanData);
			callback(cleanData);
			//socket.emit("d",{"d":cleanData});
		}
		var l=readData.length;
		readData = readData.substring(AEIndex+1,l);
	});
};
