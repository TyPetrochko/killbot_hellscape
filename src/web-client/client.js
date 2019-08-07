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
      on_stream: function(s) {console.log("Got a stream!");},
      on_close: function() {console.log("Closed connection...");},
      on_error: function(e) {console.log("Got error: "+e);},
    });
  };
}

window.onload = start;

