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
        {"s1":"太阳","s2":"月亮"},
        {"s1":"宝马","s2":"奔驰"},
        {"s1":"王菲","s2":"那英"},
        {"s1":"元芳","s2":"展昭"},
        {"s1":"胖子","s2":"肥肉"},
        {"s1":"眉毛","s2":"胡须"}, 
        {"s1":"何炅","s2":"维嘉"},
        {"s1":"状元","s2":"冠军"},
        {"s1":"羽绒服","s2":"棉袄"}
        ];

     var ai=Math.floor(Math.random()*wordAry.length);
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

/*
饺子 包子
端午节中秋节摩托车——电动车高跟鞋——增高鞋汉堡包——肉夹馍小矮人——葫芦娃蜘蛛侠——蜘蛛精节节高升——票房大卖反弹琵琶——乱弹棉花王菲——那英元芳——展昭麻雀——乌鸦胖子——肥肉眉毛——胡须何炅——维嘉状元——冠军饺子——包子端午节——中秋节摩托车——电动车高跟鞋——增高鞋汉堡包——肉夹馍小矮人——葫芦娃蜘蛛侠——蜘蛛精节节高升——票房大卖反弹琵琶——乱弹棉花金庸——古龙赵敏——黄蓉海豚——海狮水盆——水桶唇膏——口红森马——以纯烤肉——涮肉气泡——水泡纸巾——手帕杭州——苏州香港——台湾首尔——东京橙子——橘子葡萄——提子太监——人妖蝴蝶——蜜蜂小品——话剧裸婚——闪婚新年——跨年吉他——琵琶公交——地铁剩女——御姐童话——神话作家——编剧警察——捕快结婚——订婚奖牌——金牌孟飞——乐嘉那英——韩红面包——蛋糕作文——论文油条——麻花壁纸——贴画枕头——抱枕手机——座机同学——同桌婚纱——喜服老佛爷——老天爷魔术师——魔法师鸭舌帽——遮阳帽双胞胎——龙凤胎情人节——光棍节丑小鸭——灰姑娘富二代——高富帅生活费——零花钱麦克风——扩音器郭德纲——周立波图书馆——图书店男朋友——前男友洗衣粉——皂角粉牛肉干——猪肉脯泡泡糖——棒棒糖小沈阳——宋小宝土豆粉——酸辣粉蜘蛛侠——蝙蝠侠口香糖——木糖醇酸菜鱼——水煮鱼小笼包——灌汤包薰衣草——满天星张韶涵——王心凌刘诗诗——刘亦菲甄嬛传——红楼梦甄子丹——李连杰包青天——狄仁杰大白兔——金丝猴果粒橙——鲜橙多沐浴露——沐浴盐洗发露——护发素自行车——电动车班主任——辅导员过山车——碰碰车铁观音——碧螺春十面埋伏——四面楚歌成吉思汗——努尔哈赤谢娜张杰——邓超孙俪福尔摩斯——工藤新一贵妃醉酒——黛玉葬花流星花园——花样男子神雕侠侣——天龙八部天天向上——非诚勿扰勇往直前——全力以赴鱼香肉丝——四喜丸子麻婆豆腐——皮蛋豆腐语无伦次——词不达意鼠目寸光——井底之蛙近视眼镜——隐形眼镜美人心计——倾世皇妃夏家三千金——爱情睡醒了降龙十八掌——九阴白骨爪红烧牛肉面——香辣牛肉面江南style——最炫民族风梁山伯与祝英台——罗密欧与朱丽叶牛肉干——猪肉脯鱼香肉丝——四喜丸子酸菜鱼——水煮鱼麻婆豆腐——皮蛋豆腐小笼包——灌汤包玫瑰——月季薰衣草——满天星董永——许仙张韶涵——王心凌刘诗诗——刘亦菲晴川——若曦何炅——维嘉谢娜——李湘孟非——乐嘉天天向上——非诚勿扰全力以赴——勇往直前班主任——辅导员包青天——狄仁杰金丝猴——大白兔牛奶——豆浆果粒橙——鲜橙多保安——保镖过山车——碰碰车铁观音——碧螺春生菜——白菜辣椒——芥末猴——猿天龙八部——神雕侠侣降龙十八掌——九阴白骨爪金庸——古龙赵敏——黄蓉自行车——电动车海豚——海狮沐浴露——沐浴盐洗发露——护发素水盆——水桶语无伦次——词不达意鼠目寸光——井底之蛙唇膏——口红森马——以纯近视眼镜——隐形眼镜联通——移动东方神起——至上励合泡泡糖——棒棒糖小沈阳——宋小宝土豆粉——酸辣粉涮肉——烤肉气泡——水泡蜘蛛侠——蝙蝠侠木糖醇——口香糖美人心计——倾世皇妃夏家三千金——爱情睡醒了红楼梦——甄嬛传甄子丹—李连杰贵妃醉酒——黛玉葬花纸巾——手帕苏州——杭州香港——台湾首尔——东京红烧牛肉面——香辣牛肉面橙子——橘子葡萄——提子太监——人妖蝴蝶——蜜蜂花样男子——流星花园*/
