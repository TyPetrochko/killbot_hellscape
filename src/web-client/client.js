// const HTTPS_PORT = 8443;
// const URL = "ws://" + window.location.hostname + ":" + HTTPS_PORT;
const URL = "ws://" + location.hostname+(location.port ? ':'+location.port: '');

var killbotServer;
var streamButton;
var stopButton;
var videoPlayer;

function start () {
  streamButton.disabled = true;
  stopButton.disabled = false;
  killbotServer = new KillbotServer(URL, function onReady() {
    console.log("Killbot Server is ready!");
    killbotServer.connectToRobot({
      onStream: function(stream) {
        console.log("Received a video stream!");
        videoPlayer.srcObject = stream;
      },
      onClose: function() {alert("Closed connection...");},
      onError: function(e) {alert("Got error: "+e);},
    });
  });
}

function stop () {
  killbotServer.stop();
  videoPlayer.srcObject = null;
  streamButton.disabled = false;
  stopButton.disabled = true;
}

function setup () {
  stopButton = document.getElementById("stopButton");
  streamButton = document.getElementById("streamButton");
  videoPlayer = document.getElementById("video-player");
  streamButton.onclick = start; 
  stopButton.onclick = stop;
  stopButton.disabled = true;
}


window.onload = setup;
window.onbeforeunload = function () {
  streamButton.disabled = false;
}
