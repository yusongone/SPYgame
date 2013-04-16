var privateSpace={};
$(document).ready(function(){
	GameSpace.showScene("login");	
//	GameSpace.showScene("gamePrelude");	
//	GameSpace.showScene("playScene");	
});

var GameSpace={};

/*
 * GameSpace
 *public function
 * */
(function(GS){
	GS.initWindow=function(){
	};
	GS.extend=function(sup,sub){
		function temp(){};
		temp.prototype=sup.prototype;	
		sub.prototype=new temp();
		sub.prototype.constructor=sub;
	}
})(GameSpace);

/*
 * GameSpace
 * SCENE
 * */
(function(GS){

	var _Scenes={},
		_activeScene=null;
	function _showScene(name,json){
		_activeScene?_activeScene.hide():"";
		_Scenes[name].show(json);
		_activeScene=_Scenes[name];	
		return _activeScene;
	};

	/*
	 *SCENE parent
	 * */
	function _Scene(){
		this.body=$("<div/>");	
	};
	_Scene.prototype.hide=function(){
		var b=this.body;
		b.animate({"left":"-100%"},500,function(){
				b.remove();
			});
	};
	_Scene.prototype.show=function(json){
		this.initUI($("#gameBox"),json);
		this.body.css({"left":"200%"});
		this.body.animate({"left":"0%"},500);
	};
	/*a scene
	 * login
	 * */
	(function(){
		function _Login(){
			_Scenes["login"]=this;
		}
		GS.extend(_Scene,_Login);
		_Login.prototype.initUI=function(tag){
			this.body=$("<div/>",{"class":"login"});
			var name=$("<input/>",{"placeholder":"昵称"});	
			var login=$("<div/>",{"text":"LOGIN","class":"btn loginBT"})
			this.body.append(name,login);
			tag.append(this.body);

			login.click(function(){
                if(!$.trim(name.val())){
                    name.val("");
                       name.attr("placeholder","昵称不能为空哦！");
                       return false;
                }
				$.ajax({
					url:"/ss/login",
					type:"post",
					data:{"na":name.val()},
					dataType:"json",
					success:function(data){
                        if(data.result=="ok"){
                            var socket=io.connect();
                                GameSpace.socket=socket;
                                GameSpace.name=data.name;
                                var gamePrelude=GameSpace.showScene("gamePrelude");	
                                    gamePrelude.bindEvent(socket);
                        
                        }
					}
				});
			});
		}
		GS.Login=new _Login();
	})();
	/*a scene
	 *scene of create or join game
	 * */
	(function(){

		var houseControl=(function(){
			var houses={
				"houseJson":{},
				"closeAll":function(){
					for(var i in this.houseJson){
						this.houseJson[i].closeJoinDiv();
					}
				}
			};
			function House(tag,dataJson){
				tag.append(this.getUI(dataJson));
			};
			House.prototype.getUI=function(json){
				this.name=json.houseName;
				this.body=$("<div/>",{"class":"house"});
				var statu=$("<div/>",{"class":"statu"});
				var infoBox=$("<div/>",{"class":"infoBox"});
				var name=$("<div/>",{"class":"name","text":"房间名称: "+json.houseName});
				var creater=$("<div/>",{"class":"creator","text":"创建人: "+json.creator});
					infoBox.append(name,creater);
				var pepleCount=$("<div/>",{"class":"pepleCount","text":json.peopleCount});
					this.body.append(statu,infoBox,pepleCount);
					this.bindEvent(this.body);
					return this.body;
			};
			House.prototype.createJoinDiv=function(){
				var that=this;
				var div=$("<div/>",{"class":"joinDiv"});
				var input=$("<input/>",{"type":"password","placeholder":"key","class":"pas"});
				var ok=$("<input/>",{"type":"button","value":"join","class":"ok"});
					div.append(ok);
					div.css({"left":"100%"});
				this.body.append(div);
				this.JoinDiv=div;
				div.animate({"left":"0%"});
				div.click(function(){return false;});
				ok.unbind("click").click(function(){
					GameSpace.socket.emit("joinHouse",{"houseName":that.name});
				});
			};
			House.prototype.closeJoinDiv=function(){
				var j=this.JoinDiv;
				j?j.animate({"left":"100%"},500,function(){j.remove();delete j;}):"";
			};
			House.prototype.bindEvent=function(li){
				var that=this;
				li.click(function(){
					var tag=$(this);
					houses.closeAll();
					that.createJoinDiv();
				});	
			};
			function _createAddHouseDiv(tag){
				var div=$("<div/>",{"class":"addHouse"});
					var houseName=$("<input/>",{"class":"hn","placeholder":"房间名称"});
					var pass=$("<input/>",{"class":"pas","placeholder":"密码（可以为空）"});
					var create=$("<div/>",{"class":"btn ok","text":"创建"});
					div.append(houseName,pass,create);

					create.unbind("click").click(function(){
						GameSpace.socket.emit("createHouse",{"houseName":houseName.val(),"pass":pass.val()});	
						//houseControl.cancleHouse();
					});
					tag.prepend(div);
                        houseName.focus();
                    return div;
			}

			return {
				"body":$("<div/>",{}),
				"createDiv":null,
				"initHouse":function(tag){
					tag.append(this.body); 
				},
				"deleteHouse":function(name){	
					houses.houseJson[name].body.remove();
					delete houses.houseJson[name];
				},
				"createHouse":function(){
					if(!this.createDiv){
						this.createDiv=_createAddHouseDiv(this.body);
					}
				},	
				"addHouse":function(json){
					var tempHouse=new House(this.body,json);
						houses.houseJson[json.houseName]=tempHouse;
				},
				"cancleHouse":function(){
					this.createDiv.remove();
					delete this.createDiv;
				}
			}
		})();

		/*
		 * */
		function _GamePrelude(){
			_Scenes["gamePrelude"]=this;
			this.name="gamePrelude";
		};
		GS.extend(_Scene,_GamePrelude);
		_GamePrelude.prototype.initUI=function(tag){
            var that=this;
				var body=$("<div/>",{"class":"gamePrelude"});	
				var box=$("<div/>",{"class":"preludeBox"});
				var toolBar=$("<div/>",{"class":"toolbar"});
					var create=$("<div/>",{"class":"btn create","text":"创建"});
					toolBar.append(create);
				this.paddingBox=$("<div/>",{"class":"paddingBox"});
				var list=$("<div/>",{"class":"houseList"});
					houseControl.initHouse(list);
					this.paddingBox.append(list);
					box.append(toolBar,this.paddingBox);
			body.append(box);	
			this.body=body;
			tag.append(this.body);

				function createAction(){
					that.paddingBox[0].scrollTop=0;
					houseControl.createHouse(list);
					$(this).text("取消").unbind("click").click(function(){
						houseControl.cancleHouse();
						$(this).text("创建").unbind("click").click(createAction);
					});
				}
				create.click(createAction);
		};
		_GamePrelude.prototype.initServerHouse=function(ary){
			for(var i=0,l=ary.length;i<l;i++){
				houseControl.addHouse(ary[i]);
			}
		};
		_GamePrelude.prototype.bindEvent=function(socket){
				var that=this;
				socket.on("allHouse",function(data){
					that.initServerHouse(data.data);
				});
				socket.on("createHouse",function(data){
					that.initServerHouse([data.data]);
				});
				socket.on("deleteHouse",function(data){
					houseControl.deleteHouse([data.name]);
				});
				socket.on("joinHouse",function(data){
				    if(data.result=="ok"){
					var playScene=GameSpace.showScene("playScene",{"position":data.position});	
						playScene.bindEvent(GameSpace.socket);
                    }else{
                        alert(data.msg);
                    };
				});
				socket.on("connect",function(){
				});
		
		};
		
		GS.GamePrelude=new _GamePrelude();
	})();

	/*a scene
	 *scene of play
	 * */	
	(function(){
		var peopleList=(function(){
			var Peoples={};
			function closeAll(){
				for(var i in Peoples){
					Peoples[i].closeOverDiv();
				}	
			}
			function People(jsonData){
				this.name=jsonData.name;
                this.life=1;
				jsonData.tag.append(this.getUI(jsonData));	
				Peoples[this.name]=this;
                this.report=null;
			}; 
			People.prototype.getUI=function(json){
				var that=this;
				this.body=$("<div/>",{"class":"people"});	
				var head=$("<div/>",{"class":"head"});
				var infoBox=$("<div/>",{"class":"infoBox"});
					var info=$("<div/>",{"class":"info"});
				    this.infoBar=$("<div/>",{"class":"infoBar"});
					this.describe=$("<div/>",{"class":"describe"});
					this.distrust=$("<div/>",{"class":"distrust","text":json.name});
						info.append(this.describe,this.infoBar);
					infoBox.append(info);
					this.body.append(head.append(this.distrust),infoBox);
					return this.body;
			};
            People.prototype.reportEvent=function(){
                var that=this;
                    if(!this.life){
                        return false;
                    }
					this.body.unbind("click").click(function(){
                        if(!GS.PlayScene.report){
                            closeAll();
                            that.reportMe();
                        }
					});
            }
            People.prototype.clearReportEvent=function(){
                    this.body.unbind("click");
            };
			People.prototype.speak=function(word){
                this.describe.text(word);
            };
			People.prototype.createOverDiv=function(){
                var that=this;
				this.overDiv=$("<div/>",{"class":"overDiv"});
					var box=$("<div/>",{"class":"box"})
					var over=$("<div/>",{"class":"over"});
					var btBox=$("<div/>",{"class":"btTool"});
						var btn=$("<div/>",{"class":"btn","text":"举报","dragable":true});
						btBox.append(btn);
						box.append(over,btBox);
					this.overDiv.append(box);
					btn.click(function(){
                        GS.PlayScene.report=that.name;
                        peopleList.clearAllReportEvent();
                        GameSpace.socket.emit("report",{"name":that.name});
                        GS.PlayScene.barText("你举报了"+that.name);
                        btBox.css({"border-left":"10px solid red","border-right":"10px solid red"});
                        btn.remove();
                        var dd=$("<div/>",{"class":"me","text":"怀疑此人！"})
                        btBox.append(dd);
						return false;
					});
					return this.overDiv;
			};
            People.prototype.reportMe=function(){
                var that=this;
				if(!that.overDiv){
                    var od=that.createOverDiv();	
                    that.body.append(od);
                    od.css({"left":"100%"});
                    od.animate({"left":"0%"},500,function(){});
                }
            };
            People.prototype.imDead=function(){
                this.life=0;
                this.statusIn("已经误杀！！");
            };
			People.prototype.closeOverDiv=function(){
				var j=this.overDiv;
				var that=this;
				if(j){
					j.animate({"left":"100%"},500,function(){j.remove();that.overDiv=null;});
				}
			};
            People.prototype.statusIn=function(str){
                   var temp=$("<strong/>",{"text":str});
                   this.infoBar.html("").append(temp)
            };
            People.prototype.sameTicket=function(){
				    this.statusIn("需要重新投票");
            };

			return {
				"createPeople":function(json){
						var p=new People(json);
                            if(json.ready=="1"){
                                p.statusIn("准备完毕！");
                            }else{
                                p.statusIn("正在准备。。。");
                            }
                        return p;
					},
                "deletePeople":function(name){
				    Peoples[name].body.remove();
                    delete Peoples[name];
                },
                "getPeople":function(name){
                    return Peoples[name]; 
                },
                "allPeopleCanReport":function(name){
                    for(var i in Peoples){
                        Peoples[i].reportEvent();
                    }; 
                },
                "allStatusIn":function(str,life){
                    for(var i in Peoples){
                        if(life){
                            if(Peoples[i].life){
                                Peoples[i].statusIn(str);
                            }
                        }else{
                                Peoples[i].statusIn(str);
                        }
                    } 
                },
                "clearAllPeopleReportDiv":function(){
                    for(var i in Peoples){
                        Peoples[i].closeOverDiv();
                    }; 
                },
                "clearAllReportEvent":function(){
                    for(var i in Peoples){
                        var p=Peoples[i];
                            p.clearReportEvent();
                    } 
                },
                "resetAllInfo":function(){
                    for(var i in Peoples){
                        var p=Peoples[i];
                            p.statusIn("正在准备。。。");
                            p.speak("");
                    } 
                }
			};
		})();
		

		function _PlayScene(){
			_Scenes["playScene"]=this;
			this.name="playScene";
		};
		GS.extend(_Scene,_PlayScene);
		_PlayScene.prototype.initUI=function(tag,json){
				var body=$("<div/>",{"class":"playScene"});	
				var box=$("<div/>",{"class":"playBox"});
				this.toolBar=$("<div/>",{"class":"toolbar"});
					this.statusBar=$("<div/>",{"class":"statusBar"});
					var create=$("<div/>",{"class":"btn menu","text":"菜单"});
					this.toolBar.append(this.statusBar,create);
				this.paddingBox=$("<div/>",{"class":"paddingBox"});
				this.list=$("<div/>",{"class":"pepleList"});
					this.paddingBox.append(this.list);
                this.controlBox=$("<div/>",{"class":"controlBox"});
				this.controlBar=$("<div/>",{"class":"controlBar"});
                    this.controlBox.append(this.controlBar);
					box.append(this.toolBar,this.paddingBox,this.controlBox);
				body.append(box);	
				this.body=body;
				tag.append(this.body);
            var padding_bottom=this.paddingBox.css("padding-bottom");
            this.padding_bottom=padding_bottom;
            if(json.position=="creator"){
                this.position="creator";
                this.showBegin();
            }else if(json.position="joiner"){
                this.position="joiner";
                this.showReady();
            }
		};
        _PlayScene.prototype.showBegin=function(){
            var that=this;
                that.showControlBar();
                var start=$("<div/>",{"class":"btn start","text":"开始"});
                this.controlBar.html("").append(start);
                start.click(function(){
                    GameSpace.socket.emit("start",{});
                });
        };
        _PlayScene.prototype.showReady=function(){
                var that=this;
                    that.showControlBar();
                var ready=$("<div/>",{"class":"btn ready","text":"准备"});
                this.controlBar.html("").append(ready);
                ready.click(function(){
                    GameSpace.socket.emit("ready",{});
                    that.barText("准备完毕，等待游戏开始！");
                    that.hideControlBar();
                });
        };
        _PlayScene.prototype.hideControlBar=function(str){
            this.paddingBox.css({"padding-bottom":"0px"});
            this.controlBox.animate({"height":"0px"});
			//this.controlBox.animate({"bottom":"-"+padding_bottom});
        }
        _PlayScene.prototype.showControlBar=function(str){
            this.paddingBox.css({"padding-bottom":this.padding_bottom});
            this.controlBox.animate({"height":this.padding_bottom});
		//	this.controlBox.animate({"bottom":"0px"});
        }
        _PlayScene.prototype.showSpeak=function(str){
            var that=this;
                that.showControlBar();
                that.word=str;
                var box=$("<div/>",{"class":"sendBox"});
                var ms=$("<div/>",{"class":"ms","text":str});
                var speak=$("<textarea/>",{"class":"speak"}); 
                    box.append(speak);
                this.send=$("<div/>",{"class":"btn send","text":"发送"});
                this.controlBar.html("").append(ms,box,this.send);
                    this.send.click(function(){
                        GameSpace.socket.emit("speak",{"word":speak.val()});
                        that.barText("您说:"+speak.val());
                        speak.val("");
                        that.hideControlBar();
                    });
        };
        _PlayScene.prototype.restart=function(str){
            peopleList.resetAllInfo();
            GameSpace.socket.emit("imRestart",{});
            if(this.position=="creator"){
                this.showBegin();
            }else if(this.position=="joiner"){
                this.showReady(); 
            }
        }
        _PlayScene.prototype.imDead=function(str){
				this.barText("你是被冤枉的，游戏继续，你出局。");
                peopleList.allStatusIn("正在思索。。。");
        };
        _PlayScene.prototype.barText=function(str){
				this.statusBar.text(str);
        };
		_PlayScene.prototype.bindEvent=function(socket){
			var that=this;
			socket.on("JoinAPeople",function(data){
				var pp=peopleList.createPeople({"name":data.name,"tag":that.list,"ready":data.ready});
			});	
			socket.on("AllJoinPeople",function(da){
				var data=da.data;
				for(var i=0,l=data.length;i<l;i++){
					var pp=peopleList.createPeople({"name":data[i].name,"tag":that.list,"ready":data[i].ready});
				}		
			});
            socket.on("whoReady",function(da){
                for(var i=0,l=da.ary.length;i<l;i++){
                    var pp=peopleList.getPeople(da.ary[i].name);
                        pp.statusIn("准备完毕!");
                }
            });
            socket.on("ready",function(da){
                    var pp=peopleList.getPeople(da.name);
                        pp.statusIn("准备完毕!");
            });
            socket.on("report",function(da){
                    var pp=peopleList.getPeople(da.name);
                        pp.statusIn("投票完毕!");
            });
            socket.on("begin",function(da){
                that.hideControlBar();
                that.showSpeak(da.word);
                that.barText("游戏开始，请描述您收到的词语！");
                peopleList.allStatusIn("正在思索。。。");
            });
            socket.on("gameGoon",function(da){
                that.showSpeak(that.word);
                that.barText("有人被冤死，游戏继续，请描述您的词语！");
                peopleList.allStatusIn("正在思索。。。");
                that.report=null;
            });
            socket.on("speak",function(da){
                var pp=peopleList.getPeople(da.name);
                    pp.speak(da.word);
                    pp.statusIn("描述完毕！");
            });
            socket.on("reportNow",function(da){
                that.hideControlBar();
                that.barText("所有人投票完毕！从列表中选出你怀疑的人。");
                peopleList.allStatusIn("正在投票。。。");
                peopleList.allPeopleCanReport();
            });
            socket.on("deletePeople",function(da){
                peopleList.deletePeople(da.name); 
            });
            socket.on("gameResult",function(da){
                that.report=null;
                peopleList.clearAllPeopleReportDiv();
                var gameFun={
                    "spyRunAway":function(){
                        if(da.deadName==GameSpace.name){
                            that.imDead(); 
                        }else{
                            that.barText("有人被冤死了，游戏继续！");
                            var pp=peopleList.getPeople(da.deadName);
                                pp.imDead();
                        }
                    },
                    "killSPY":function(){
                        that.barText("SPY被杀死！游戏结束。");
                        alert("SPY被杀死！游戏结束。");
                        that.restart();
                    },
                    "spyWin":function(){
                        that.barText("卧底获胜！！！！");
                        alert("卧底获胜！！");
                        that.restart();
                    },
                    "manySPY":function(){
                        var str="有"+da.people.length+"个人票数相同，他们要重新描述！";
                        for(var i=0,l=da.people.length;i<l;i++){
                            var tempName=da.people[i].name;
                            if(tempName==GameSpace.name){
                                str="你与另外"+(l-1)+"个人都有"+10+"票，需要重新描述！";
                                that.showSpeak(that.word);
                            }else{
                                var pp=peopleList.getPeople(da.people[i].name);
                                    pp.sameTicket();
                            }
                        }
                        that.barText(str);
                    }
                }
                    gameFun[da.result]();
            });
        };
		GS.PlayScene=new _PlayScene();
	})()


	GS.showScene=_showScene;
})(GameSpace);


