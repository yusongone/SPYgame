var AllPeoples={};
	AllPeoples.peopleList={};
	AllPeoples.deletePeople=function(name){
		var house=this.peopleList[name].joinHouse;
		delete this.peopleList[name];	
		house?house.deletePeople(name):"";
	};
	AllPeoples.broadcast=function(mes,json){
		var list=this.peopleList;
		for(var i in list){
			list[i].socket.emit(mes,json);
		}
	};

var houses={};
	houses.housesList={};
	houses.deleteHouse=function(name){		
		delete this.housesList[name];
		AllPeoples.broadcast("deleteHouse",{"name":name});
	};




exports.init=function(name,socket){
	var people=new People(name,socket);
	AllPeoples.peopleList[name]=people;
	people.returnAllHouse();
	people.bindEvent();
};


function People(name,socket){
	this.name=name;
	this.socket=socket;
    this.ready=0;
    this.speak=null;
    this.life=1;
    this.report;
    this.ticketCount=[];
};
People.prototype.clearMyGameInfo=function(){
    this.ready=0;
    this.speak=null;
    this.life=1;
    this.report=null;
    this.ticketCount=[];
};
People.prototype.tellOther=function(mes,json){
    var house=this.joinHouse;
        if(!house){
            return false;
        }
        var pList=house.peoples;
        for(var i in pList){
            pl=pList[i];
            if(pl!=this){
                pl.socket.emit(mes,json);	
            }
        }
};
People.prototype.returnAllHouse=function(){
	var socket=this.socket;
	var ary=[];
	for(var i in houses.housesList){
		var temp={};
		temp.houseName=houses.housesList[i].name;
		temp.creator=houses.housesList[i].creator.name;
		ary.push(temp);
	}
	socket.emit("allHouse",{"data":ary});
};
People.prototype.imDeath=function(){
    this.life=0;
};
People.prototype.bindEvent=function(){
	var socket=this.socket;
	var people=this;
	socket.on("createHouse",function(data){
		if(!houses.housesList[data.houseName]&&!people.createHouse){
			people.createHouse=new House(data.houseName,people);		
			houses.housesList[data.houseName]=people.createHouse;
			var temp={};
				temp.houseName=data.houseName;
				temp.creator=people.name;
				AllPeoples.broadcast("createHouse",{"data":temp});
		};
	});
	socket.on("disconnect",function(){
        people.tellOther("deletePeople",{"name":people.name});
		people.deleteCreateHouse();
	});
	socket.on("joinHouse",function(data){
		var houseName=data.houseName;	
		var peopleName=people.name;
        if(houses.housesList[houseName].game){
            people.socket.emit("joinHouse",{"result":"error","msg":"游戏已经开始!"}); 
            //游戏已经开始
            return false;
        }
		people.joinHouse=houses.housesList[houseName];
		var ary=houses.housesList[houseName].returnAllPeople();
		houses.housesList[houseName].addPeople(people);
        if(people.joinHouse==people.createHouse){
            people.socket.emit("joinHouse",{"result":"ok","position":"creator"}); 
            people.ready=1;
        }else{
            people.socket.emit("joinHouse",{"result":"ok","position":"joiner"}); 
        };
	    socket.emit("AllJoinPeople",{"data":ary});
	});
    socket.on("start",function(){
        if(people.joinHouse==people.createHouse&&people.joinHouse.peopleCount>1){
            if(people.joinHouse.allJoinReady()){
                people.joinHouse.startGame();
            }else{
                people.socket.emit("noStart",{"mes":"somebody ware not ready"});
            }
        }else{
            people.socket.emit("noStart",{"mes":"peopleNotEnough"});
        }
    });
    socket.on("ready",function(){
        if(people.joinHouse&&!people.joinHouse.game){
            people.ready=1;
            people.tellOther("ready",{"name":people.name});
        }
    });
    socket.on("speak",function(data){
        if(!people.life||!people.joinHouse||!people.joinHouse.game){
            return false;
        }
        people.tellOther("speak",{"name":people.name,"word":data.word});
        people.speak=data.word;
        people.joinHouse.checkAllSpeakState();
    });
    socket.on("report",function(data){
        if(people.joinHouse&&people.joinHouse.game&&people.life){
            var house=people.joinHouse; 
                people.report=data.name;
                house.peoples[data.name].ticketCount.push(people);
                house.checkAllReport();
                people.tellOther("report",{"name":people.name});
        }
    });
    socket.on("imRestart",function(data){
        var house=people.joinHouse;
        var ary=house.getWhoReady();
        socket.emit("whoReady",{"ary":ary});
    });
};
People.prototype.clearTicket=function(){
    this.report=null;
    this.ticketCount=[];
}
People.prototype.deleteCreateHouse=function(){
	var that=this;
	if(this.createHouse){
		var name=this.createHouse.name;
		houses.deleteHouse(name);
		AllPeoples.deletePeople(this.name);
	};
    if(this.joinHouse){
        var house=this.joinHouse; 
            house.deletePeople(this.name);
    }
};

function House(houseName,creat){
	this.name=houseName;
	this.creator=creat;
	this.peoples={};
    this.peopleCount=0;
    this.game=0;
};
House.prototype.allPeopleClearInfo=function(){
    this.game=0;
    for(var i in this.peoples){
         this.peoples[i].clearMyGameInfo();
    }
};
House.prototype.getWhoReady=function(){
    var ary=[];
    for(var i in this.peoples){
        if(this.peoples[i].ready){
		    var temp={};
			    temp.name=this.peoples[i].name;
                ary.push(temp);
        }
    }
    return ary;
};
House.prototype.returnAllPeople=function(socket){
	var ary=[];
	for(var i in this.peoples){
		var temp={};
			temp.name=this.peoples[i].name;
            temp.ready=this.peoples[i].ready;
		ary.push(temp);
	}
    return ary;
};
House.prototype.getAllReadyPeople=function(){
    var ary=[];
	for(var i in this.peoples){
        if(this.peoples[i].ready){
		    var temp={};
			    temp.name=this.peoples[i].name;
            ary.push(temp);
        }
    }
    return ary;
};
House.prototype.getLifePeople=function(){
    var temp={};
    for(var i in this.peoples){
        if(this.peoples[i].life){
            temp[i]=this.peoples[i];
        };
    };
    return temp;
};
House.prototype.getLifePeopleCount=function(people){
    var count=0;
    for(var i in this.peoples){
        if(this.peoples[i].life){
            count++;
        }
    }
    return count;
}

House.prototype.addPeople=function(people){
	this.peoples[people.name]=people;
    people.tellOther("JoinAPeople",{"name":people.name,"ready":people.ready});
    this.peopleCount++;
};
House.prototype.deletePeople=function(name){
	delete this.peoples[name];
    this.peopleCount--;
};
House.prototype.checkAllSpeakState=function(){
    var lifePeople=this.getLifePeople();
    for(var i in lifePeople){
        if(!lifePeople[i].speak){
            return false;
        }
    }
    for(var i in lifePeople){
    }
    this.broadLifePeoples("reportNow",{});
};
House.prototype.checkAllReport=function(){
    var that=this;
    var lifePeople=this.getLifePeople();
    for(var i in lifePeople){
        if(!lifePeople[i].report){
            return false;
        }
    }
    that.computeResult();
};
House.prototype.computeResult=function(){
    var that=this;
    var topT=null;
    var topCount=0;
    for(var i in this.peoples){
        var count=this.peoples[i].ticketCount.length;
        if(count>topCount){
            topCount=count;
            topT=[this.peoples[i]];
        }else if(count==topCount&&count!=0){
            topT.push(this.peoples[i]);
        }
        this.peoples[i].clearTicket();
    }
    if(topT.length>1){
        var ary=[];
        for(var i=0,l=topT.length;i<l;i++){
             ary.push({"name":topT[i].name});
             //清空这几个人的描述
            this.peoples[topT[i].name].speak=null;
        }
        that.broadcast("gameResult",{"result":"manySPY","people":ary});
    }else{
        if(topT[0].position=="SPY"){
            //he is SPY ,game over;
            that.broadcast("gameResult",{"result":"killSPY","deadName":topT[0].name});
            that.allPeopleClearInfo();
        }else{
            //he is not SPY ,game go on; 
            topT[0].imDeath();
            that.broadcast("gameResult",{"result":"spyRunAway","deadName":topT[0].name});
            that.broadLifePeoples("gameGoon",{});
            if(this.getLifePeopleCount()<3){
                that.broadcast("gameResult",{"result":"spyWin"});
                that.allPeopleClearInfo();
                return false;
            }
            for(var i in this.peoples){
                this.peoples[i].speak=null;
            }
        }
    }

};
House.prototype.allJoinReady=function(){
    for(var i in this.peoples){
        var pp=this.peoples[i];
        if(!pp.ready&&pp!=this.creator){
            this.creator.socket.emit("somebodyNoReady",{});
            return false;
        }
    }
    return true;
};
House.prototype.broadcast=function(mes,json){
	for(var i in this.peoples){
		this.peoples[i].socket.emit(mes,json);	
	}
};
House.prototype.broadLifePeoples=function(mes,json){
    var lifePeople=this.getLifePeople();
	for(var i in lifePeople){
		    lifePeople[i].socket.emit(mes,json);	
	}
};
House.prototype.startGame=function(){
    this.getWord();
    for(var i in this.peoples){
        var pp=this.peoples[i];
            pp.socket.emit("begin",{"word":pp.word});
    }
    this.game=1;
};
House.prototype.getWord=function(){
    var spyIndex=Math.floor(Math.random()*this.peopleCount+1);
    var index=0;
    var wordAry=[
        {"s1":"太阳","s2":"月亮"}
        ,{"s1":"宝马","s2":"奔驰"}
        ,{"s1":"羽绒服","s2":"棉袄"}
        ];

     var ai=Math.floor(Math.random()*wordAry.length+1);
     var word=wordAry[ai];
        var sj=Math.floor(Math.random()*2);
        var spy,some;
            if(sj==1){
               spy=word["s1"];
               some=word["s2"];
            }else{
               spy=word["s2"];
               some=word["s1"];
            }
        
    for(var i in this.peoples){
        var pp=this.peoples[i];
        index++;
        if(spyIndex==index){
           pp.position="SPY"; 
           pp.word=spy;
        }else{
           pp.position="someOne"; 
           pp.word=some;
        }
    }
};
