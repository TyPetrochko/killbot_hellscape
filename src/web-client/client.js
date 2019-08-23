// Author: Tyler Petrochko
//
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const port_suffix = location.port ? ':'+location.port: '';
const URL = protocol + location.hostname + port_suffix;

var killbotServer;
var streamButton;
var stopButton;
var sendButton;
var videoPlayer;
var sendReceivePanel;

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

function receive(data) {
  alert(data);
}

function setup () {
  stopButton = document.getElementById("stopButton");
  sendButton = document.getElementById("sendButton");
  streamButton = document.getElementById("streamButton");
  videoPlayer = document.getElementById("video-player");
  sendReceivePanel = document.getElementById("sendReceivePanel");
  sendButton.onclick = send;
  streamButton.onclick = start; 
  stopButton.onclick = stop;
  stopButton.disabled = true;
}



window.onload = setup;
window.onbeforeunload = function () {
  streamButton.disabled = false;
}
