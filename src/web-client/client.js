const HTTPS_PORT = 8443;
const URL = "wss://" + window.location.hostname + ":" + HTTPS_PORT;

var killbotServer;
var streamButton;
var stopButton;
var videoPlayer;

function start () {
  streamButton.disabled = true;
  killbotServer = new KillbotServer(URL, function onReady() {
    console.log("Killbot Server is ready!");
    killbotServer.connectToRobot({
      onStream: function(stream) {
        videoPlayer.srcObject = stream;
      },
      onClose: function() {alert("Closed connection...");},
      onError: function(e) {alert("Got error: "+e);},
    });
  });
}

function stop () {
  killbotServer.stop();
}

function setup () {
  stopButton = document.getElementById("stopButton");
  streamButton = document.getElementById("streamButton");
  videoPlayer = document.getElementById("video-player");
  streamButton.onclick = start; 
  stopButton.onclick = stop;
}


window.onload = setup;
window.onbeforeunload = function () {
  streamButton.disabled = false;
}
