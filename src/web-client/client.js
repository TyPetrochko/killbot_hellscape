// Author: Tyler Petrochko
//
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const port_suffix = location.port ? ':'+location.port: '';
const URL = protocol + location.hostname + port_suffix;

var killbotServer;
var streamButton;
var stopButton;
var fullscreenButton;
var sendButton;
var videoPlayer;
var sendReceivePanel;
var log;

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
      onClose: function () {alert("Closed connection...");},
      onError: function (e) {alert("Got error: "+e);},
      onData: function (data) {
        // Always leave trailing newline
        console.log(data);
        log.value = (log.value || "") + data + "\n"
      }
    });
  });

  sendReceivePanel.style = "visibility: visible";
}

function stop () {
  killbotServer.stop();
  videoPlayer.srcObject = null;
  streamButton.disabled = false;
  stopButton.disabled = true;
  
  sendReceivePanel.style = "visibility: hidden";
}

function send() {
  field = document.getElementById("messageText");
  message = field.value;
  killbotServer.send(message);

  // Clear the field for next message
  field.value = "";
}

function goFullscreen() {
  console.log("Going fullscreen...");
  if (videoPlayer.requestFullScreen) {
    videoPlayer.requestFullScreen();
  } else if (videoPlayer.webkitRequestFullScreen) {
    videoPlayer.webkitRequestFullScreen();
  } else if (videoPlayer.mozRequestFullScreen) {
    videoPlayer.mozRequestFullScreen();
  }
}

function keydown (e) {
  console.log("keydown");
  console.log(e);
}

function keyup (e) {
  console.log("keyup");
  console.log(e);
}

function setup () {
  stopButton = document.getElementById("stopButton");
  sendButton = document.getElementById("sendButton");
  streamButton = document.getElementById("streamButton");
  fullscreenButton = document.getElementById("fullscreenButton");
  videoPlayer = document.getElementById("video-player");
  sendReceivePanel = document.getElementById("sendReceivePanel");
  log = document.getElementById("log");
  sendButton.onclick = send;
  streamButton.onclick = start; 
  stopButton.onclick = stop;
  fullscreenButton.onclick = goFullscreen;
  stopButton.disabled = true;

  window.addEventListener('keydown', keydown, true);
  window.addEventListener('keyup', keyup, true);

}



window.onload = setup;
window.onbeforeunload = function () {
  streamButton.disabled = false;
}
