var HTTPS_PORT = 8443;
var url = "wss://" + window.location.hostname + ":" + HTTPS_PORT ;

function start() {
  // 1. Make a killbot server
  server = new KillbotServer(url, function onReady() {
    console.log("Killbot server ready!");
  });

  // 2. Clicking stream should open a stream
  streamButton = document.getElementById('streamButton');
  streamButton.onclick = function() {
    streamButton.disabled = true;
    server.connectToRobot({
      onStream: function(stream) {
        var video = document.getElementById('video-player');
        video.srcObject = stream;
      },
      onClose: function() {alert("Closed connection...");},
      onError: function(e) {alert("Got error: "+e);},
    });
  };
}

window.onload = start;

