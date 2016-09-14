var http = require('http'),
    fileSystem = require('fs'),
    path = require('path')
    util = require('util');

http.createServer(function(request, response) {
    var filePath = 'a.mp3';
    var stat = fileSystem.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to util.pump()
    readStream.pipe(response);
		readStream.on("end", function() {
   		// Operation done
			response.end();
		});
})
.listen(2000);
