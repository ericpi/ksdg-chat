var http = require("http");

var userList = { };
var userID = 0; 

http.createServer(function (req, resp) {
    var reqArgs = require('url').parse(req.url);
    var postData = "";
    var selfID, selfNick;

    if(req.headers.cookie != undefined) {
      var cookies = req.headers.cookie.split("; ")
      for(key in cookies) {
	  var cookie = cookies[key].split("=");
	  if(cookie[0] == "userID") {
	      selfID = cookie[1];
	  } else if(cookie[0] == "userNick") {
	      selfNick = cookie[1];
	  }
      };
    }

    req.on("end", function () {
        switch(reqArgs.pathname) {
            case "/join":
                var postObj = JSON.parse(postData);
                var retObj = {
                    "status": 200,
                    "userID": ++userID,
                    "userNick": postObj.userNick
                }
                userList[retObj.userID] = {
                    "nick": postObj.userNick,
                    "conn": false
                }
                resp.setHeader("Set-Cookie", [ "userNick="+postObj.userNick, "userID="+retObj.userID ]);
                resp.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); 
                resp.end(JSON.stringify(retObj));

                for(id in userList) {
                    try {
                        var bResp = userList[id].conn;
                        bResp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        bResp.end("<p class=\"text-info\">" + (new Date).toLocaleTimeString() + 
                                    " " + postObj.userNick + " has joined chatroom</p>");
                    } catch(e) { 
                        console.log("** write user #" + id + " fail **");
                    }
                };
                break;

            case "/stream":
                if(userList[selfID] != undefined) {
                    userList[selfID].conn = resp;
                } else {
                    userList[selfID] = {
                        "nick": selfNick,
                        "conn": resp
                    }
                }
                break;

            case "/send":
                var postObj = JSON.parse(postData);
                var retObj = {
                    "status": 200,
                    "chatMsg": postObj.sendMsg
                }
                resp.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); 
                resp.end(JSON.stringify(retObj));
                
                for(id in userList) {
                    try {
                        var bResp = userList[id].conn;
                        bResp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        bResp.end("<p>" + (new Date).toLocaleTimeString() + 
                                    " &lt;" + userList[selfID].nick + "&gt; " + postObj.sendMsg + "</p>");
                    } catch(e) { 
                        console.log("**( write user #" + id + reqArgs.href +" fail ***");
                    }
                };
                break;

            default:
                require("fs").readFile("./client.html", "utf-8", function(err, data) {
                    resp.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); 
                    resp.end(data);
                });
                break;
        }

        console.log(req.connection.remoteAddress + " - - [" + (new Date) + "] GET \"" + 
                    reqArgs.href +"(" + selfID + ":" + selfNick + ")\"");
    });

    req.on("data", function(chunk) {
        postData+=chunk;
    });
}).listen(8080, function() {
    console.log("[" + (new Date).toLocaleTimeString() + "] server start!" );
});
