var fs = require ("fs");
var omxcam = require ("omxcam");

var ws = fs.createWriteStream ("video.h264")
    .on ("error", function (error){
      console.error (error);
      vs.stop ();
    });

var vs = omxcam.createVideoStream ({ width: 640, height: 480, timeout: 2000 });
/*
    vs.on ("error", function (error){
      console.error (error);
      ws.end ();
    });
*/
vs.pipe (ws);
