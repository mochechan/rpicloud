/* to support 
static html web services
sockjs
file upload
*/

var log, _rc;
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var session = require('sesh').session; //don't use magicSession https://github.com/marak/session.js
//alternative: https://github.com/senchalabs/connect
var formidable = require('formidable'); // for files upload
var sockjs = require('sockjs');
var node_static = require('node-static');
var http_port = 8080;
var express_port = 9999;
var html_path = __dirname;
var port = {
	http: 8080,
	express: 9999,
	cloudcmd: 9990, 
	};

var http_server;

var sockjs_clients = {}; // all clients for sockjs
var handler = require('./http_handler/http_handler.js');


// sockjs Broadcast to all clients
function broadcast(message){
  for (var client in clients) {
    sockjs_clients[client].write(JSON.stringify(message));
  }
}


exports.http_server_start = function () {
	if (typeof(arguments[0]._rc) === 'object' && typeof(arguments[0]._rc.log) === 'function') {
		_rc = arguments[0]._rc;
		log = arguments[0]._rc.log;
	} else log = console.log;

	log('in http_server_start');
	//log(arguments);

	// 1. Echo sockjs server
	var sockjs_options = {
		sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js",
		log: function () {
			log("sockjs_log");
			log(arguments);
		},
	};

	var sockjs_echo = sockjs.createServer(sockjs_options);
	sockjs_echo.on('connection', function(conn) {
		log("sockjs connected");
		log(conn);
		clients[conn.id] = conn;
	  conn.on('data', function(message) {
			log("received message from browser:");
			log(message);
			_rc.call_api({api_name: 'command', api_args: {message: message, callback: function(){
				log("sockjs callback...");
				log(arguments);
	    	conn.write(arguments);
			}}});
	  });
		conn.on('close', function() {
    	log('sockjs close ' + conn);
	  });
	});

	// 2. Static files server
	var static_directory = new node_static.Server(html_path);

	// 3. Usual http stuff
	http_server = http.createServer(function onRequest(request_, response_) {
		session(request_, response_, function(request, response){
			log("http requested:" + request.url);
			//console.log("################# request.session");
			//console.log(request.session);

			// for file upload handlers
  		var pathname = url.parse(request.url).pathname;
	  	if (typeof handler[pathname] === 'function') {
	  		log("http_handler: " + pathname);
  	  	handler[pathname](request, response, _rc);
	 	 } else {
	  	  //console.log("No request handler found for " + pathname);
  	  	//response.writeHead(404, {"Content-Type": "text/html"});
	  	  //response.write("404 Not found");
  	  	//response.end();
		  }
		});
	}).listen(http_port, '0.0.0.0', function() {
 		log("http server has started at port: " + http_port);
	});


	// static_html "handlers" should prevent file upload handlers
	http_server.addListener('request', function(req, res) {
		log("server.addListener request");
	  if (typeof handler[url.parse(req.url).pathname] === 'function') return; 
  	static_directory.serve(req, res);
	});
	http_server.addListener('upgrade', function(req,res){
		log("server.addListener upgrade");
	  if (typeof handler[url.parse(req.url).pathname] === 'function') return; 
  	res.end();
	});

	sockjs_echo.installHandlers(http_server, {prefix:'/sockjs'});


	//////////////////////////////////////////// cloudcmd

	var express_cloudcmd = require('express')();
	var cloudcmd = require('cloudcmd');
	var socketio = require("socket.io").listen(http_server);

	express_cloudcmd.use(cloudcmd({
    socket: socketio,  
	}));

	express_cloudcmd.listen(port.cloudcmd, function () {
  	log('express_cloudcmd is listening at port ' );
	});

} // end of http_server_start



