/* rpicloud browser-side javascript API 
support:
* R.event.emit("exec", {"command","ls", function() {}});
* R.event.emit("handler", {"handler","ls", function() {}});
* R.event.on("ws_onmessage", function () {});
todo:
* R.login({username: "", password:""});
* R.logout({});
*/

/////////////////////////////////// start of requiring another js
// $.getScript("my_lovely_script.js", function(){ alert("Script loaded but not necessarily executed."); });

function require_js(js) {
	//console.log("requiring: " + js);
	document.write('<script type="text/javascript" src="' + js + '"></script>');
}

if (!window.jQuery) {
	require_js("http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js");
}

require_js("http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js");
require_js("http://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js");
require_js("./js/shared_utility.js");
console.log(this);
setTimeout(function(){
console.log(shared_utility.test());
},500);
//require_js("http://cdn.peerjs.com/0.3.14/peer.min.js"); //http://peerjs.com/
//https://code.google.com/p/crypto-js/
require_js("http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js"); 
require_js("http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js"); 
require_js("http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha256.js"); 
require_js("http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha3.js"); 

/////////////////////////////////// end of requiring another js


//////////////////////////////// global R for RPI cloud
var R = (typeof module === 'undefined' ? {} : module.exports);

(function (exports, global) {
	 R = {status: {}, callback_pool:{}, shared_utility: shared_utility, 
		config: {
			ws_port: 8080,
			ws_ip: window.location.hostname,
			ws_connected: false,
			logined: false,
		},
	};
	console.log("in R.config");
	console.log(R.config);
	//////////////////////////////// start of utility functions

	var timestamp = function () {
		var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "" + month + "" + day + "" + hour + "" + min + "" + sec;
	}

	var guid = function guid() {
  	function s4() {
    	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  	}
  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	var short_guid = function guid() {
  	function s4() {
    	return Math.floor((1 + Math.random()) * 0x10000) .toString(16) .substring(1);
  	}
	  return s4();
	}


	/////////////////////// end of utility functions

	/////////////////////// start of ws websocket client

	// http://www.html5rocks.com/en/tutorials/websockets/basics/?redirect_from_locale=tw
	var ws_client = new WebSocket('ws://' + R.config.ws_ip + ':' + R.config.ws_port, ['echo-protocol', 'soap', 'xmpp']);

	ws_client.onopen = function () {
		console.log("ws.onopen");
		console.log(arguments);
  	//ws_client.send('exec {"command":"ls"}'); 
		//if(R_on['ws_onopen'] && typeof(R_on['ws_onopen']) === 'function') R_on.ws_onopen(arguments);
	};

	// Log errors
	ws_client.onerror = function (error) {
  	console.log('WebSocket Error ' + error);
	  console.log(arguments);
	};

// messages from the server
ws_client.onmessage = function () {
  //console.log('ws_client.onmessage: ' );
  //console.log(arguments);
	var received = arguments[0].data;
	var parsed;
	try {
		parsed = JSON.parse(received);
	} catch (error) {
		console.log(error);
		return;
	}
	//console.log("R.callback_pool");
	//console.log(R.callback_pool);
	//console.log("parsed");
	//console.log(parsed);
	
	if (!parsed || !parsed.R_metadata || !parsed.R_metadata.transaction_id) {
		//console.log("The received message cannot be parsed to JSON.");
		return;
	}

	if( R.callback_pool[parsed.R_metadata.transaction_id] && typeof(R.callback_pool[parsed.R_metadata.transaction_id].callback) === 'function') {
		R.callback_pool[parsed.R_metadata.transaction_id].callback(parsed);
		if (R.callback_pool[parsed.R_metadata.transaction_id].trigger_once === true) {
			delete R.callback_pool[parsed.R_metadata.transaction_id];
			console.log("release callback id: " + parsed.R_metadata.transaction_id);
		}
		return;
	} else if (R.callback_pool["ws_onmessage"] && typeof(R.callback_pool["ws_onmessage"].callback) === 'function') {
		R.callback_pool["ws_onmessage"].callback(parsed);
	}
};

	ws_client.onclose = function close() {
  	console.log('on close disconnected');
  	console.log(arguments);
	};

/*
// Sending canvas ImageData as ArrayBuffer
var img = canvas_context.getImageData(0, 0, 400, 320);
var binary = new Uint8Array(img.data.length);
for (var i = 0; i < img.data.length; i++) {
  binary[i] = img.data[i];
}
connection.send(binary.buffer);

// Sending file as Blob
var file = document.querySelector('input[type="file"]').files[0];
connection.send(file);

// Setting binaryType to accept received binary as either 'blob' or 'arraybuffer'
connection.binaryType = 'arraybuffer';
connection.onmessage = function(e) {
  console.log(e.data.byteLength); // ArrayBuffer object if binary
};

// Determining accepted extensions
console.log(connection.extensions);
*/

	///////////////////////////// end of ws websocket client

	R.event = {
		on: function() {
			switch (arguments[0]) {
				case "ws_onmessage":
					if (typeof(arguments[1]) === 'function') {
						console.log("registering ws_onmessage callback");
						R.callback_pool["ws_onmessage"] = {callback: arguments[1]};
					}
				break;
				default:
					console.log("incorrect event name");
				break;
			}
		},
		emit: function (event_name, args) {
			//console.log("In R.event.emit");
			//console.log(arguments);
			var transaction_id = guid();
			//console.log("event_name: " + event_name);
			//console.log("transaction_id " + transaction_id);
			if (R.callback_pool && R.callback_pool[transaction_id]) return;
			R.callback_pool[transaction_id] = {
				trigger_once: true, 
				transaction_id: transaction_id, 
				callback: args.callback};
			args.R_metadata = {transaction_id: transaction_id};
			var msg = event_name + ' ' + JSON.stringify(args);
			console.log("sending event: " + msg);
			ws_client.send(msg);
		},
	};
	console.log("xx");

})('object' === typeof module ? module.exports : (this.R = {}), this);

/* todo:
http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
https://cozy.io/en/hack/getting-started/first-app.html

*/
