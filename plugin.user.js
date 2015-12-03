// ==UserScript==
// @name        Webchat IRC Plugin
// @namespace   http://www.ankh-morpork.de
// @include     http://www.ankh-morpork.de/index.php?seite=5200
// @version     1
// @grant       none
// ==/UserScript==
var para = document.createElement("p");
var input=document.createElement("button");
var area = document.getElementById("commandcontent");

input.className = "chatbutton";
input.innerHTML = "Roll";
input.onclick = roll;
para.appendChild(input);
area.appendChild(para); 

var config = {
	channels: ["#geflicktetrommel"],
	server: "uk.quakenet.org",
	botName: "Wirtbot"
};

function doFunStuff (sound)
{
	_ContentElements[2].append(sound);
}

//TODO: emoticons aus und anschaltbar machen
function updateChat()
{
	var includeUsersBansGuests = (_RequestCounter == 1);
	for (var i = 1; i < _RoomIds.length; i++)
	{
		if (_InRooms[i])
		{
			var room = i;
			$.get("/amchat/ajax/execute.php?a=g&r=" + _RoomIds[room] + "&ts=" + _LastMessageIds[room] + "&iu=" + (includeUsersBansGuests ? "1" : "0"), function(data)
			{
				if (data == '')
				{
					var index = this.url.indexOf('&r=');
					var room = this.url.substring(index + 3);
					index = room.indexOf('&');
					room = room.substring(0, index);
					leaveRoom(room, false);
					$.modal("<div>Das Betreten des Raumes war leider nicht erfolgreich.</div>", {maxWidth: 400, minHeight: 300, maxHeight: 500});
					return;
				}
				var index = data.indexOf('#!#');
				var lastMessageId = data.substr(0, index);
				var rest = data.substring(index + 3);
				index = rest.indexOf('#!#');
				var room = rest.substr(0, index);
				rest = rest.substring(index + 3);
				index = rest.indexOf('#!#');
				var userlist = rest.substr(0, index);
				rest = rest.substring(index + 3);
				index = rest.indexOf('#!#');
				var banlist = rest.substr(0, index);
				rest = rest.substring(index + 3);
				index = rest.indexOf('#!#');
				var messages = rest.substring(0, index);
				rest = rest.substring(index + 3);
				index = rest.indexOf('#!#');
				var sound = rest.substring(0, index);
				doFunStuff(sound); // automatische nachrichtenverarbeitung hier
				rest = rest.substring(index + 3);
				index = rest.indexOf('#!#');
				var newMessageCount = rest.substring(0, index);
				var guestlist = rest.substring(index + 3);
				
				var visible = vis();
				var title = document.title;
				var titleStartsWithAnkh = title.indexOf('Ankh') == 0;
				
				if (lastMessageId > _LastMessageIds[room])
				{
					_LastMessageIds[room] = lastMessageId;
				
					var repMessages = messages;
					repMessages = repMessages.replace(/([\n >])www\.([a-z0-9\-]+)\.([a-z0-9\-.\~]+)((?:\/[^< \n\r]*)?)/gi, "$1" + '<a href="http://www.' + "$2" + '.' + "$3" + "$4" + '" target="_blank" title="Link">www.' + "$2" + '.' + "$3" + "$4" + '</a>');
					repMessages = repMessages.replace(/([\n >])([a-z]+?):\/\/([^< \n\r]+)/gi, "$1" + '<a href="' + "$2" + '://' + "$3" + '" target="_blank" title="Link">' + "$3" + '</a>');
					if (sound == 1)
					{
						playSound(false);
					}
					if (messages != _LastMessages[room])
					{
						_LastMessages[room] = messages;
						_ContentElements[room].append(repMessages);
						if (parseInt(newMessageCount) > 0)
						{
							if (!_ReRead.prop('checked'))
							{
								_ContentElements[room].scrollTop(_ContentElements[room].prop('scrollHeight'));
							}
							if (!visible && titleStartsWithAnkh)
							{
								document.title = '*** ' + title;
								if (sound != 1)
								{
									playSound(true);
								}
							}
						} else if (visible && !titleStartsWithAnkh)
						{
							document.title = title.substring(4);
						}

						if (_ActiveRoom != room)
						{
							var oldMessageCount = _NewLines[room].html();
							var messageCount = parseInt(newMessageCount) + parseInt(oldMessageCount);
							_NewLines[room].html(messageCount);
							if (messageCount > 0)
							{
								_NewLinesContainer[room].css( "display", "inline");
							} else
							{
								_NewLinesContainer[room].css( "display", "none");
							}
						}
					} else if (visible && !titleStartsWithAnkh)
					{
						document.title = title.substring(4);
					}			
				} else if (visible && !titleStartsWithAnkh)
				{
					document.title = title.substring(4);
				}
				if (includeUsersBansGuests)
				{
					if (userlist != "-1")
					{
						if (userlist != _LastUsers[room])
						{
							_LastUsers[room] = userlist;
							_Chatuserlists[room].html(userlist);
						}
					} else
					{
						// Ban
						leaveRoom(room, false);
						$.modal("<div>" + messages + "</div>", {maxWidth: 400, minHeight: 300, maxHeight: 500});
						return;
					}
					if (banlist != "")
					{
						_Chatbanlists[room].html(banlist);
					} else
					{
						_Chatbanlists[room].html("<p>Derzeit sind keine Verbannungen ausgesprochen.</p>");
					}
					if (guestlist != "")
					{
						_Chatguestlists[room].html(guestlist);
					} else
					{
						_Chatguestlists[room].html("<p>Es waren in den letzten 15 Minuten keine Gäste online.</p>");
					}
				}
				
				var lineCount = $('#chatcontent > p').length;
				while (lineCount > _MaxLines)
				{
					_ContentElements[room].children().first().remove();
					lineCount--;
				}
			});
		}
	}
	
	_RequestCounter++;
	_RequestCounter = _RequestCounter % 10;

	$.ajax(
	{
		type: "GET",
		url: "/amchat/ajax/execute_visitors.php",
		cache: false,
		success: function(data)
		{
			if (data == '')
			{
				for (var i = 1; i < _RoomIds.length; i++)
				{
					_Visitors[i].html(0);
				}
			} else
			{
				var room_data = new Array();
				var rooms = data.split(';');
				$.each(rooms, function(key, room) {
					var parts = room.split(':');
					var room_id = parts[0];
					room_data[room_id] = parts[1];
				});
				for (var i = 1; i < _RoomIds.length; i++)
				{
					var id = _RoomIds[i];
					if (room_data[id] > 0)
					{
						_Visitors[i].html(room_data[id]);
					} else
					{
						_Visitors[i].html(0);
					}
				}
			}
		}
	});
}

function sendMessage()
{
	if (_ActiveRoom > 0)
	{
	  var message = $("#nextchatmessage").val();
		if ((_Color != "") && isNoCommand(message))
		{
			var newmessage = _Color + " " + message;
			message = newmessage;	
		} 
		$.get("/amchat/ajax/execute.php?a=s&r=" + _RoomIds[_ActiveRoom] + "&m=" + enc(message), function(data)
		{
			$("#nextchatmessage").val("");
			nextchatmessageCounter.text(inputMaxLength);
			if (data && data.length > 0)
			{
				_ContentElements[_ActiveRoom].append(data);
				if (!_ReRead.prop('checked'))
				{
					_ContentElements[_ActiveRoom].scrollTop(_ContentElements[_ActiveRoom].prop('scrollHeight'));
				}
			}
		});
	}
}

function isNoCommand (message) {
	if (stringStartsWith(message, "/") || stringStartsWith(message, "@Lady") || stringStartsWith(message, "@Wirt") || stringStartsWith(message, "@Band"))  return false;
	return true;
}


function stringStartsWith (string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}

function setColor(color)
{
	var mes = $("#nextchatmessage").val();
	if (color == _Color)
	{
		_Color = "";
		$("#nextchatmessage").css('color', 'black');
	} else	{
		_Color = color;
		 $("#nextchatmessage").css('color', colorConverter(color));
	}
}

function colorConverter (color) {
	var converted = "black";
	switch(color) {
    case "/rot": converted = "red";
        break;
	  case "/blau": converted = "blue";
        break;
    case "/gruen": converted = "green";
        break;
    case "/pink": converted = "magenta";
        break;
		case "/orange": converted = "orange";
        break;
    default: converted = "black";
	} 
	return converted;
}

addJS_Node (colorConverter);
addJS_Node (setColor);
addJS_Node (stringStartsWith);
addJS_Node (isNoCommand);
addJS_Node (sendMessage);
addJS_Node (updateChat);
addJS_Node (doFunStuff);

function roll()
{
	if (_ActiveRoom > 0)
	{
    var message = "/me rolls: " + Math.random()*10;
		$.get("/amchat/ajax/execute.php?a=s&r=" + _RoomIds[_ActiveRoom] + "&m=" + enc(message), function(data)
		{
			nextchatmessageCounter.text(inputMaxLength);
		});
	}
}



function addJS_Node (text, s_URL, funcToRun, runOnLoad) {
    var D                                   = document;
    var scriptNode                          = D.createElement ('script');
    if (runOnLoad) {
        scriptNode.addEventListener ("load", runOnLoad, false);
    }
    scriptNode.type                         = "text/javascript";
    if (text)       scriptNode.textContent  = text;
    if (s_URL)      scriptNode.src          = s_URL;
    if (funcToRun)  scriptNode.textContent  = '(' + funcToRun.toString() + ')()';

    var targ = D.getElementsByTagName ('head')[0] || D.body || D.documentElement;
    targ.appendChild (scriptNode);
}
